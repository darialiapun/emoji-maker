import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/** Only cache a successful client — never cache "missing env". */
let cached: SupabaseClient | undefined

function readUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
}

/** Anon key: prefer NEXT_PUBLIC_* (works on server too); allow SUPABASE_ANON_KEY if someone omits the prefix. */
function readAnonKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim()
  )
}

/**
 * Human-readable reason when Supabase cannot be used. Empty string = URL + key look fine
 * (caller should still handle DB errors).
 */
export function getSupabaseConfigurationHint(): string {
  const url = readUrl()
  const key = readAnonKey()

  if (!url && !key) {
    return "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local in the project root (Supabase → Project Settings → API), then restart npm run dev."
  }
  if (!url) {
    return "Missing NEXT_PUBLIC_SUPABASE_URL in .env.local."
  }
  if (!key) {
    return "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_ANON_KEY) in .env.local — use the anon public key from Supabase → API."
  }
  return ""
}

export type SupabaseResult =
  | { ok: true; client: SupabaseClient }
  | { ok: false; error: string }

export function getSupabaseAdmin(): SupabaseResult {
  if (cached) {
    return { ok: true, client: cached }
  }

  const url = readUrl()
  const key = readAnonKey()

  if (!url || !key) {
    return {
      ok: false,
      error: getSupabaseConfigurationHint(),
    }
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return { ok: true, client: cached }
}
