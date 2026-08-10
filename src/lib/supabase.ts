import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as
  | string
  | undefined

export function hasSupabaseConfig(): boolean {
  return Boolean(url?.trim() && key?.trim())
}

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!hasSupabaseConfig()) {
    throw new Error('Supabase env missing (VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY)')
  }
  if (!client) {
    client = createClient(url!, key!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }
  return client
}
