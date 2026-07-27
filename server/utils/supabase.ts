import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let cached: SupabaseClient | null | undefined

/**
 * Read-only Supabase client for server-side content fetching.
 *
 * Uses the anon key on purpose — row level security is what keeps unpublished
 * rows private. The service-role key is never loaded here, so a bug in a
 * content route can't escalate into write access.
 *
 * Returns null when Supabase isn't configured, which is the signal for callers
 * to fall back to the markdown/YAML files in content/.
 */
export function serverSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached

  const config = useRuntimeConfig()
  const url = config.public.supabaseUrl
  const key = config.public.supabaseAnonKey

  cached = url && key
    ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
    : null

  return cached
}
