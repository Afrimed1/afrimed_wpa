import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

function createSupabaseClient(persistSession: boolean): SupabaseClient<Database> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase non configuré')
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession,
      autoRefreshToken: persistSession,
      detectSessionInUrl: true,
    },
  })
}

let mainClient: SupabaseClient<Database> | null = null
let helperClient: SupabaseClient<Database> | null = null

export function getSupabase(): SupabaseClient<Database> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase non configuré')
  }
  if (!mainClient) {
    mainClient = createSupabaseClient(true)
  }
  return mainClient
}

export function getSupabaseAuthHelper(): SupabaseClient<Database> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase non configuré')
  }
  if (!helperClient) {
    helperClient = createSupabaseClient(false)
  }
  return helperClient
}

/** @deprecated Utiliser getSupabase() */
export const supabase = isSupabaseConfigured
  ? (null as unknown as SupabaseClient<Database>)
  : (null as unknown as SupabaseClient<Database>)

/** @deprecated Utiliser getSupabaseAuthHelper() */
export const supabaseAuthHelper = isSupabaseConfigured
  ? (null as unknown as SupabaseClient<Database>)
  : (null as unknown as SupabaseClient<Database>)
