import { createClient, SupabaseClient } from '@supabase/supabase-js'

function normalizeSupabaseUrl(rawUrl: string): string {
  let cleaned = (rawUrl || '').trim()
  // Remove markdown link syntax if present e.g. [url](url)
  const mdMatch = cleaned.match(/https?:\/\/[^\s)\]]+/i)
  if (mdMatch) {
    cleaned = mdMatch[0]
  }
  // If user passed a Supabase dashboard URL, convert to API endpoint
  const dashboardMatch = cleaned.match(/supabase\.com\/dashboard\/project\/([a-z0-9_-]+)/i)
  if (dashboardMatch && dashboardMatch[1]) {
    return `https://${dashboardMatch[1]}.supabase.co`
  }
  return cleaned
}

const supabaseUrl = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL || '')
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

let _supabase: SupabaseClient | null = null

const isConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project-id') &&
  !supabaseAnonKey.startsWith('your-') &&
  supabaseUrl.startsWith('https://')
)

if (isConfigured) {
  try {
    _supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  } catch (err) {
    console.error('[Supabase Client] Failed to initialize Supabase client:', err)
    _supabase = null
  }
}

export const supabase = _supabase

export function isSupabaseClientEnabled(): boolean {
  return _supabase !== null
}

export function getSupabaseConfigInfo() {
  return {
    isConfigured,
    url: isConfigured ? supabaseUrl : null,
  }
}
