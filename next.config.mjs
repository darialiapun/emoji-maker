/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * In development, Next.js blocks cross-origin requests to `/_next/*` by default.
   * If you open the app via 127.0.0.1, IPv6 localhost, or a LAN IP (from the
   * terminal “Network” link), add those hostnames here or the page can stay blank
   * with “Unauthorized” / 403 for dev assets.
   *
   * Optional: set `NEXT_DEV_ALLOWED_ORIGINS=192.168.1.10,10.0.0.5` in `.env.local`
   * (hostnames only, comma-separated).
   */
  allowedDevOrigins: [
    "127.0.0.1",
    "::1",
    ...(process.env.NEXT_DEV_ALLOWED_ORIGINS?.split(",")
      .map((h) => h.trim())
      .filter(Boolean) ?? []),
  ],
}

export default nextConfig
