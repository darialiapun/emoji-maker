import { auth } from "@clerk/nextjs/server"

import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { extractWavespeedImageUrls } from "@/lib/wavespeed-output"

import type { EmojiDto } from "../emojis/route"

const WAVESPEED_ENDPOINT = "https://api.wavespeed.ai/api/v1/wavespeed-ai/flux-dev"
const WAVESPEED_DEFAULT_SIZE = "1024*1024"
const POLL_INTERVAL_MS = 1200
const POLL_TIMEOUT_MS = 90_000

type WavespeedSubmitResponse = {
  id?: string
  status?: string
  urls?: { get?: string }
  data?: { // на случай, если они вернут старый формат
    urls?: { get?: string }
  }
}
type WavespeedResultResponse = {
  code?: number
  message?: string
  data?: {
    status?: string
    error?: string
    outputs?: unknown
  }
}

function getWavespeedErrorMessage(status: number, rawText: string): string {
  if (status === 401) {
    return "Wavespeed: invalid API key. Check WAVESPEED_API_KEY."
  }
  if (status === 402) {
    return "Wavespeed: insufficient credit. Add billing and try again."
  }
  if (status === 429) {
    return "Wavespeed: rate limited. Wait a bit, then retry."
  }
  if (rawText.trim()) {
    return `Wavespeed request failed (${status}): ${rawText.slice(0, 200)}`
  }
  return `Wavespeed request failed with status ${status}.`
}

function parseJsonSafely<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

async function pollWavespeedResult(
  resultUrl: string,
  apiKey: string,
): Promise<{ ok: true; output: unknown } | { ok: false; error: string; status: number }> {
  const started = Date.now()

  while (Date.now() - started < POLL_TIMEOUT_MS) {
    const res = await fetch(resultUrl, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    })

    const text = await res.text()
    if (!res.ok) {
      return {
        ok: false,
        error: getWavespeedErrorMessage(res.status, text),
        status: res.status,
      }
    }

    const data = parseJsonSafely<WavespeedResultResponse>(text)
    const status = data?.data?.status ?? data?.message ?? ""

    if (status === "completed") {
      return { ok: true, output: data?.data?.outputs }
    }

    if (status === "failed") {
      return {
        ok: false,
        error: data?.data?.error || "Wavespeed task failed.",
        status: 502,
      }
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
  }

  return {
    ok: false,
    error: "Wavespeed task timed out. Please try again.",
    status: 504,
  }
}

/*export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return Response.json({ error: "Sign in to generate emojis." }, { status: 401 })
  }

  let body: { prompt?: string }
  try {
    body = (await request.json()) as { prompt?: string }
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const raw = body.prompt?.trim()
  if (!raw) {
    return Response.json({ error: "Prompt is required." }, { status: 400 })
  }
*/
export async function POST(request: Request) {
  console.log("!!! Я ВНУТРИ ФУНКЦИИ POST !!!");
  // 1. ПРОВЕРКА АВТОРИЗАЦИИ
  const { userId } = await auth()
  if (!userId) {
    return Response.json({ error: "Sign in to generate emojis." }, { status: 401 })
  }

  // 2. !!! ИСПРАВИТЬ ТУТ !!! Вставь свой ключ вместо "api"
  const apiKey = "144acc69606f1c3df938a829d53f018c3e3b301d785512f325091574d579f60b"; 

  // 3. ПОЛУЧЕНИЕ ДАННЫХ
  let body: { prompt?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const raw = body.prompt?.trim()
  if (!raw) {
    return Response.json({ error: "Prompt is required." }, { status: 400 })
  }
  const prompt = raw.length > 2000 ? raw.slice(0, 2000) : raw
  const fullPrompt = prompt.toLowerCase().includes("emoji")
    ? prompt
    : `emoji icon, centered, clean background, ${prompt}`


  const sb = getSupabaseAdmin()
  if (!sb.ok) {
    return Response.json({ error: sb.error }, { status: 503 })
  }
  const supabase = sb.client

  let submitData: WavespeedSubmitResponse | null = null
  try {
    const submitRes = await fetch(WAVESPEED_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        size: WAVESPEED_DEFAULT_SIZE,
        num_images: 1,
        num_inference_steps: 28,
        guidance_scale: 3.5,
      }),
    })

    const submitText = await submitRes.text()
    console.log("WAVESPEED RESPONSE:", submitRes.status, submitText); 
    if (!submitRes.ok) {
      return Response.json(
        { error: getWavespeedErrorMessage(submitRes.status, submitText) },
        { status: submitRes.status === 429 ? 429 : 502 },
      )
    }

    submitData = parseJsonSafely<WavespeedSubmitResponse>(submitText)
  } catch (e) {
    console.error(e)
    return Response.json(
      { error: "Could not reach Wavespeed. Check your connection and retry." },
      { status: 502 },
    )
  }

  const resultUrl = submitData?.urls?.get || (submitData as any)?.data?.urls?.get;
  if (!resultUrl) {
    return Response.json(
      { error: "Wavespeed did not return a task result URL." },
      { status: 502 },
    )
  }

  const polled = await pollWavespeedResult(resultUrl, apiKey)
  if (!polled.ok) {
    return Response.json({ error: polled.error }, { status: polled.status })
  }

  const urls = extractWavespeedImageUrls(polled.output)
  const imageUrl = urls[0]
  if (!imageUrl) {
    return Response.json(
      { error: "Wavespeed returned no image URL in outputs." },
      { status: 502 },
    )
  }

  const { data: inserted, error: insertError } = await supabase
    .from("generated_emojis")
    .insert({
      prompt,
      image_url: imageUrl,
      user_id: userId,
    })
    .select("id, prompt, image_url, user_id, created_at")
    .single()

  if (insertError || !inserted) {
    console.error(insertError)
    return Response.json(
      { error: "Could not save the generated image." },
      { status: 500 },
    )
  }

  const item: EmojiDto = {
    id: inserted.id,
    prompt: inserted.prompt,
    imageUrl: inserted.image_url,
    userId: inserted.user_id,
    createdAt: inserted.created_at,
    likesCount: 0,
    likedByMe: false,
  }

  return Response.json({ item })
}
