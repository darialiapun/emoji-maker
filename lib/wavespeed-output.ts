export function extractWavespeedImageUrls(output: unknown): string[] {
  if (output == null) {
    return []
  }

  if (typeof output === "string") {
    return output.startsWith("http") ? [output] : []
  }

  if (Array.isArray(output)) {
    return output.flatMap((item) => extractWavespeedImageUrls(item))
  }

  if (typeof output === "object") {
    const o = output as Record<string, unknown>

    if (typeof o.url === "string" && o.url.startsWith("http")) {
      return [o.url]
    }

    if (typeof o.image === "string" && o.image.startsWith("http")) {
      return [o.image]
    }

    if (Array.isArray(o.outputs)) {
      return extractWavespeedImageUrls(o.outputs)
    }

    if (Array.isArray(o.output)) {
      return extractWavespeedImageUrls(o.output)
    }

    if (o.data && typeof o.data === "object") {
      return extractWavespeedImageUrls(o.data)
    }
  }

  return []
}
