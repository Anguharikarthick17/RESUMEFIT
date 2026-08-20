import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

let _supabase: SupabaseClient | null = null

if (supabaseUrl && supabaseAnonKey && !supabaseAnonKey.startsWith('your-')) {
  try {
    _supabase = createClient(supabaseUrl, supabaseAnonKey)
  } catch (err) {
    console.warn('[Supabase Client] Failed to initialize public client:', err)
    _supabase = null
  }
}

export const supabase = _supabase

export function isSupabaseClientEnabled(): boolean {
  return _supabase !== null
}
