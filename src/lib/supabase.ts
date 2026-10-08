import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { supabaseEnv } from './env'

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient | null {
  const env = supabaseEnv()
  if (!env) return null
  if (!client) {
    client = createClient(env.url, env.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }
  return client
}
