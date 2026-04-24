
function isAllowedImageUrl(url: string): boolean {
  try {
    const u = new URL(url)
    if (u.protocol !== "https:") return false
    
    const host = u.hostname.toLowerCase()
    // Добавляем cloudfront.net в список разрешенных
    if (
      host.endsWith(".replicate.delivery") || 
      host.endsWith(".wavespeed.ai") || 
      host.endsWith(".supabase.co") ||
      host.endsWith(".cloudfront.net") // <--- ОБЯЗАТЕЛЬНО ДОБАВИТЬ ЭТО
    ) {
      return true
    }
    return false
  } catch {
    return false
  }
}

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("url")
  if (!raw) {
    return Response.json({ error: "Missing url query parameter." }, { status: 400 })
  }

  let target: URL
  try {
    target = new URL(raw)
  } catch {
    return Response.json({ error: "Invalid url." }, { status: 400 })
  }

  if (!isAllowedImageUrl(target.href)) {
    return Response.json({ error: "URL host is not allowed." }, { status: 403 })
  }

  try {
    const upstream = await fetch(target.href, {
      // ДОБАВЛЯЕМ ЗАГОЛОВОК, ЧТОБЫ ОБМАНУТЬ ЗАЩИТУ CLOUDFRONT
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })

    if (!upstream.ok) {
      return Response.json({ error: "Image not found." }, { status: upstream.status })
    }

    const contentType = upstream.headers.get("content-type") ?? "application/octet-stream"
    const buf = await upstream.arrayBuffer()

    const filename = target.pathname.split("/").filter(Boolean).pop() || "emoji.png"

    return new Response(buf, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename.replace(/"/g, "")}"`,
        "Cache-Control": "private, max-age=3600",
      },
    })
  } catch (e) {
    console.error(e)
    return Response.json({ error: "Failed to fetch image." }, { status: 502 })
  }
}