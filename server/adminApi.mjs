import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ESTABLISHMENT_ID = '00000000-0000-0000-0000-000000000001'

export function normalizeSupabaseUrl(raw) {
  return String(raw || '')
    .trim()
    .replace(/\/rest\/v1\/?$/i, '')
    .replace(/\/$/, '')
}

export function loadSupabaseEnv(env = process.env) {
  const url = normalizeSupabaseUrl(env.VITE_SUPABASE_URL)
  const publishable =
    env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || ''
  const secret = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY || ''
  return { url, publishable, secret }
}

export function createAdminClient(env = process.env) {
  const { url, secret } = loadSupabaseEnv(env)
  if (!url || !secret) {
    throw new Error('Supabase admin non configure (URL ou SUPABASE_SECRET_KEY)')
  }
  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export function createUserClient(accessToken, env = process.env) {
  const { url, publishable } = loadSupabaseEnv(env)
  if (!url || !publishable) {
    throw new Error('Supabase client non configure')
  }
  return createClient(url, publishable, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function generateTemporaryPassword(length = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let password = ''
  for (let i = 0; i < length; i += 1) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export async function requireAdminProfile(accessToken, env = process.env) {
  const admin = createAdminClient(env)
  const { data, error } = await admin.auth.getUser(accessToken)
  if (error || !data.user) {
    const err = new Error('Session invalide')
    err.status = 401
    throw err
  }

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .maybeSingle()

  if (profileError || !profile || !profile.is_active || profile.role !== 'admin') {
    const err = new Error('Acces admin requis')
    err.status = 403
    throw err
  }

  return { admin, profile }
}

export async function listEstablishmentProfiles(accessToken, establishmentId, env) {
  const { admin, profile } = await requireAdminProfile(accessToken, env)
  if (profile.establishment_id !== establishmentId) {
    const err = new Error('Etablissement non autorise')
    err.status = 403
    throw err
  }

  const { data, error } = await admin
    .from('profiles')
    .select('*')
    .eq('establishment_id', establishmentId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function createStaff(accessToken, input, env) {
  const { admin, profile } = await requireAdminProfile(accessToken, env)
  if (profile.establishment_id !== input.establishmentId) {
    const err = new Error('Etablissement non autorise')
    err.status = 403
    throw err
  }

  if (!['doctor', 'lab'].includes(input.role)) {
    const err = new Error('Role invalide')
    err.status = 400
    throw err
  }

  const email = String(input.email || '')
    .trim()
    .toLowerCase()
  const firstName = String(input.firstName || '').trim()
  const lastName = String(input.lastName || '').trim()

  if (!email || !firstName || !lastName) {
    const err = new Error('Champs obligatoires manquants')
    err.status = 400
    throw err
  }

  const temporaryPassword = generateTemporaryPassword()

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: {
      first_name: firstName,
      last_name: lastName,
      role: input.role,
    },
  })

  if (createError || !created.user) {
    const err = new Error(createError?.message || 'Creation auth impossible')
    err.status = 400
    throw err
  }

  const { error: profileError } = await admin.from('profiles').insert({
    id: created.user.id,
    establishment_id: input.establishmentId,
    role: input.role,
    first_name: firstName,
    last_name: lastName,
    email,
    is_active: true,
  })

  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id)
    const err = new Error(profileError.message)
    err.status = 400
    throw err
  }

  return { temporaryPassword }
}

export async function setStaffActive(accessToken, profileId, isActive, env) {
  const { admin, profile } = await requireAdminProfile(accessToken, env)

  if (profileId === profile.id) {
    const err = new Error('Impossible de modifier votre propre compte')
    err.status = 400
    throw err
  }

  const { data: target, error: targetError } = await admin
    .from('profiles')
    .select('id, establishment_id')
    .eq('id', profileId)
    .maybeSingle()

  if (targetError || !target) {
    const err = new Error('Profil introuvable')
    err.status = 404
    throw err
  }

  if (target.establishment_id !== profile.establishment_id) {
    const err = new Error('Etablissement non autorise')
    err.status = 403
    throw err
  }

  const { error } = await admin
    .from('profiles')
    .update({ is_active: Boolean(isActive) })
    .eq('id', profileId)

  if (error) throw error
  return { ok: true }
}

export async function applySqlMigrations(env = process.env) {
  const fsSql = [
    'supabase/migrations/002_fix_profiles_rls.sql',
  ].map((relative) => readFileSync(resolve(relative), 'utf8'))

  const dbUrl = env.DATABASE_URL || env.SUPABASE_DB_URL
  if (!dbUrl) {
    return { applied: false, reason: 'DATABASE_URL absente' }
  }

  const postgres = (await import('postgres')).default
  const sql = postgres(dbUrl, { max: 1 })
  try {
    for (const statement of fsSql) {
      await sql.unsafe(statement)
    }
  } finally {
    await sql.end()
  }

  return { applied: true }
}

export { ESTABLISHMENT_ID }
