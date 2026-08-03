import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

function normalizeSupabaseUrl(raw: string | undefined): string {
  return String(raw || '')
    .trim()
    .replace(/\/rest\/v1\/?$/i, '')
    .replace(/\/$/, '')
}

const supabaseUrl = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL)
const supabaseKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey)

function createSupabaseClient(persistSession: boolean): SupabaseClient<Database> {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase non configure')
  }

  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      persistSession,
      autoRefreshToken: persistSession,
      detectSessionInUrl: true,
    },
  })
}

let mainClient: SupabaseClient<Database> | null = null

export function getSupabase(): SupabaseClient<Database> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase non configure')
  }
  if (!mainClient) {
    mainClient = createSupabaseClient(true)
  }
  return mainClient
}

export async function getAccessToken(): Promise<string | null> {
  if (!isSupabaseConfigured) return null
  const { data } = await getSupabase().auth.getSession()
  return data.session?.access_token ?? null
}
