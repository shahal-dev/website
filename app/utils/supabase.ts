import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

/** Whether the Supabase environment variables are present. */
export function isSupabaseConfigured(): boolean {
  const { public: config } = useRuntimeConfig()
  return Boolean(config.supabaseUrl && config.supabaseAnonKey)
}

/**
 * Browser Supabase client for the admin app.
 *
 * Only the anon key ever reaches the browser — every write is authorised by
 * row level security against the logged-in user, so a stolen anon key alone
 * grants nothing beyond public read access.
 */
export function useSupabase(): SupabaseClient {
  if (client) return client

  const { public: config } = useRuntimeConfig()

  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase is not configured. Set NUXT_PUBLIC_SUPABASE_URL and NUXT_PUBLIC_SUPABASE_ANON_KEY.'
    })
  }

  client = createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storageKey: 'portfolio-admin-auth'
    }
  })

  return client
}
