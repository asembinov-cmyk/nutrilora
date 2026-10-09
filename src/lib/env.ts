export interface SupabasePublicEnv {
  url: string
  anonKey: string
}

export function supabaseEnv(): SupabasePublicEnv | null {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''
  if (!url || !anonKey) return null
  return { url, anonKey }
}
