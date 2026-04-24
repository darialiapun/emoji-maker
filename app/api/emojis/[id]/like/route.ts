import { auth } from "@clerk/nextjs/server"

import { getSupabaseAdmin } from "@/lib/supabase/admin"

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(_request: Request, context: RouteContext) {
  const { userId } = await auth()
  if (!userId) {
    return Response.json({ error: "Sign in to like emojis." }, { status: 401 })
  }

  const { id: emojiId } = await context.params
  if (!emojiId) {
    return Response.json({ error: "Missing emoji id." }, { status: 400 })
  }

  const sb = getSupabaseAdmin()
  if (!sb.ok) {
    return Response.json({ error: sb.error }, { status: 503 })
  }
  const supabase = sb.client

  const { data: existing } = await supabase
    .from("emoji_likes")
    .select("emoji_id")
    .eq("emoji_id", emojiId)
    .eq("user_id", userId)
    .maybeSingle()

  if (existing) {
    const { error: delErr } = await supabase
      .from("emoji_likes")
      .delete()
      .eq("emoji_id", emojiId)
      .eq("user_id", userId)

    if (delErr) {
      console.error(delErr)
      return Response.json({ error: "Could not update like." }, { status: 500 })
    }
  } else {
    const { error: insErr } = await supabase.from("emoji_likes").insert({
      emoji_id: emojiId,
      user_id: userId,
    })

    if (insErr) {
      console.error(insErr)
      return Response.json({ error: "Could not update like." }, { status: 500 })
    }
  }

  const { count, error: countErr } = await supabase
    .from("emoji_likes")
    .select("*", { count: "exact", head: true })
    .eq("emoji_id", emojiId)

  if (countErr) {
    console.error(countErr)
    return Response.json({ error: "Could not count likes." }, { status: 500 })
  }

  return Response.json({
    liked: !existing,
    likesCount: count ?? 0,
  })
}
