import { auth } from "@clerk/nextjs/server"

import { getSupabaseAdmin } from "@/lib/supabase/admin"

export type EmojiDto = {
  id: string
  prompt: string
  imageUrl: string
  userId: string
  createdAt: string
  likesCount: number
  likedByMe: boolean
}

export async function GET() {
  const sb = getSupabaseAdmin()
  if (!sb.ok) {
    return Response.json(
      { error: sb.error, items: [] as EmojiDto[] },
      { status: 503 },
    )
  }
  const supabase = sb.client

  const { userId } = await auth()

  const { data: emojis, error: emojisError } = await supabase
    .from("generated_emojis")
    .select("id, prompt, image_url, user_id, created_at")
    .order("created_at", { ascending: false })
    .limit(200)

  if (emojisError) {
    console.error(emojisError)
    return Response.json({ error: "Failed to load emojis." }, { status: 500 })
  }

  const rows = emojis ?? []
  const ids = rows.map((r) => r.id)

  if (ids.length === 0) {
    return Response.json({ items: [] satisfies EmojiDto[] })
  }

  const { data: likes, error: likesError } = await supabase
    .from("emoji_likes")
    .select("emoji_id, user_id")
    .in("emoji_id", ids)

  if (likesError) {
    console.error(likesError)
    return Response.json({ error: "Failed to load likes." }, { status: 500 })
  }

  const counts = new Map<string, number>()
  const likedByMe = new Set<string>()

  for (const row of likes ?? []) {
    counts.set(row.emoji_id, (counts.get(row.emoji_id) ?? 0) + 1)
    if (userId && row.user_id === userId) {
      likedByMe.add(row.emoji_id)
    }
  }

  const items: EmojiDto[] = rows.map((row) => ({
    id: row.id,
    prompt: row.prompt,
    imageUrl: row.image_url,
    userId: row.user_id,
    createdAt: row.created_at,
    likesCount: counts.get(row.id) ?? 0,
    likedByMe: likedByMe.has(row.id),
  }))

  return Response.json({ items })
}
