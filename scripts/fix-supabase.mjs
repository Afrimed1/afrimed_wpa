/**
 * Bootstrap / reparation Supabase AFRIMED
 * npm run fix:supabase
 */
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import {
  createAdminClient,
  loadSupabaseEnv,
  ESTABLISHMENT_ID,
} from '../server/adminApi.mjs'

const PASSWORD = process.env.AFRIMED_ADMIN_PASSWORD || 'demo1234'

const STAFF_SEEDS = [
  {
    email: 'admin@afrimed.bf',
    role: 'admin',
    first_name: 'Admin',
    last_name: 'AFRIMED',
  },
  {
    email: 'medecin@afrimed.bf',
    role: 'doctor',
    first_name: 'Awa',
    last_name: 'Ouédraogo',
  },
  {
    email: 'labo@afrimed.bf',
    role: 'lab',
    first_name: 'Issa',
    last_name: 'Traoré',
  },
]

function fail(msg) {
  console.error(msg)
  process.exit(1)
}

const { url, publishable, secret } = loadSupabaseEnv(process.env)
if (!url || !url.includes('supabase.co')) fail('VITE_SUPABASE_URL manquante ou invalide')
if (!publishable) fail('VITE_SUPABASE_PUBLISHABLE_KEY manquante')
if (!secret) fail('SUPABASE_SECRET_KEY manquante')

const admin = createAdminClient(process.env)

async function ensureEstablishment() {
  const { error } = await admin.from('establishments').upsert({
    id: ESTABLISHMENT_ID,
    name: 'Centre de Sante Pilote AFRIMED',
  })
  if (error) fail(`establishments: ${error.message}`)
}

async function applySqlFiles() {
  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL
  if (!dbUrl) {
    console.log('Migrations SQL: ajoute DATABASE_URL pour auto-apply (002/003).')
    return
  }
  const postgres = (await import('postgres')).default
  const sql = postgres(dbUrl, { max: 1 })
  try {
    const dir = resolve('supabase/migrations')
    const files = readdirSync(dir)
      .filter((name) => name.endsWith('.sql'))
      .sort()
    for (const file of files) {
      if (file.startsWith('001_')) continue
      const content = readFileSync(resolve(dir, file), 'utf8')
      await sql.unsafe(content)
      console.log('SQL applique:', file)
    }
  } finally {
    await sql.end()
  }
}

async function ensureStaffAccounts() {
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 200 })
  if (error) fail(`listUsers: ${error.message}`)

  for (const seed of STAFF_SEEDS) {
    let user = data.users.find((u) => (u.email || '').toLowerCase() === seed.email)
    if (!user) {
      console.log('Creation', seed.email)
      const created = await admin.auth.admin.createUser({
        email: seed.email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: {
          first_name: seed.first_name,
          last_name: seed.last_name,
          role: seed.role,
        },
      })
      if (created.error || !created.data.user) {
        fail(`createUser ${seed.email}: ${created.error?.message}`)
      }
      user = created.data.user
    } else {
      await admin.auth.admin.updateUserById(user.id, {
        password: PASSWORD,
        email_confirm: true,
      })
    }

    await admin.from('profiles').delete().eq('email', seed.email)
    const { error: profileError } = await admin.from('profiles').upsert({
      id: user.id,
      establishment_id: ESTABLISHMENT_ID,
      role: seed.role,
      first_name: seed.first_name,
      last_name: seed.last_name,
      email: seed.email,
      is_active: true,
    })
    if (profileError) fail(`profile ${seed.email}: ${profileError.message}`)
  }
}

async function ensurePatientDemo() {
  const payload = {
    establishment_id: ESTABLISHMENT_ID,
    first_name: 'Aminata',
    last_name: 'Sawadogo',
    access_code: 'AF7K2M',
    is_active: true,
    sex: 'F',
    birth_date: '1992-04-12',
    phone: '70000000',
    personal_history: 'Paludisme traite en 2024',
    family_history: '',
    chronic_treatments: '',
  }

  const { data } = await admin
    .from('patients')
    .select('id')
    .eq('access_code', 'AF7K2M')
    .maybeSingle()

  if (data) {
    const { error } = await admin.from('patients').update(payload).eq('id', data.id)
    if (error) console.log('patient demo update ignore:', error.message)
    return
  }

  const { error } = await admin.from('patients').insert(payload)
  if (error) fail(`patient demo: ${error.message}`)
}

async function ensureReferenceData() {
  const { error: birthError } = await admin.from('patients').select('id, birth_date').limit(1)
  if (birthError) {
    console.log('')
    console.log('SCHEMA CLINIQUE MANQUANT')
    console.log('Ouvre Supabase > SQL Editor, colle le fichier:')
    console.log('  supabase/migrations/003_mvp_clinical.sql')
    console.log('Puis Run. Ensuite relance: npm run fix:supabase')
    console.log('')
    return false
  }

  const { count: medCount, error: medError } = await admin
    .from('medications')
    .select('id', { count: 'exact', head: true })
  if (medError) {
    console.log('medications:', medError.message)
    return false
  }
  console.log('Medicaments:', medCount ?? 0)
  return true
}

async function verifyLogins() {
  const client = createClient(url, publishable, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  for (const seed of STAFF_SEEDS) {
    const { data, error } = await client.auth.signInWithPassword({
      email: seed.email,
      password: PASSWORD,
    })
    if (error) fail(`login ${seed.email}: ${error.message}`)
    const rpc = await client.rpc('current_profile')
    await client.auth.signOut()
    if (rpc.error || !rpc.data || rpc.data.role !== seed.role) {
      fail(`profil ${seed.email}: ${rpc.error?.message || 'role incorrect'}`)
    }
    console.log('OK', seed.email, seed.role)
  }
}

async function main() {
  console.log('URL:', url)
  await ensureEstablishment()
  await applySqlFiles()
  await ensureStaffAccounts()
  await ensurePatientDemo()
  await ensureReferenceData()
  await verifyLogins()
  console.log('')
  console.log('Comptes (mdp ' + PASSWORD + '):')
  for (const seed of STAFF_SEEDS) console.log(' -', seed.role + ':', seed.email)
  console.log('Patient demo: AF7K2M')
}

main().catch((e) => fail(e?.message || String(e)))
