/**
 * Deploy AFRIMED sur Vercel (gratuit).
 * Necessite: npx vercel login  (une seule fois)
 * Puis: npm run deploy
 */
import { readFileSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

function loadEnvLocal() {
  const env = {}
  if (!existsSync('.env.local')) return env
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    if (!line || line.trim().startsWith('#') || !line.includes('=')) continue
    const i = line.indexOf('=')
    env[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return env
}

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, {
    stdio: 'inherit',
    shell: false,
    ...opts,
  })
  if (result.status !== 0) process.exit(result.status || 1)
}

const local = loadEnvLocal()
const required = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_SECRET_KEY',
]
for (const key of required) {
  if (!local[key]) {
    console.error('Manquant dans .env.local:', key)
    process.exit(1)
  }
}

console.log('Verification login Vercel...')
const whoami = spawnSync('npx', ['vercel', 'whoami'], { encoding: 'utf8' })
if (whoami.status !== 0) {
  console.error('Pas connecte a Vercel.')
  console.error('Dans le terminal du projet, lance une seule fois:')
  console.error('  npx vercel login')
  console.error('Puis relance: npm run deploy')
  process.exit(1)
}

console.log('Injection des variables d\'environnement...')
for (const key of required) {
  const add = spawnSync(
    'npx',
    ['vercel', 'env', 'add', key, 'production'],
    {
      input: `${local[key]}\n`,
      encoding: 'utf8',
    },
  )
  // ignore errors if already exists
  if (add.status !== 0) {
    console.log(`env ${key}: deja presente ou a verifier dans le dashboard`)
  } else {
    console.log(`env ${key}: OK`)
  }
}

if (local.GEMINI_API_KEY) {
  spawnSync('npx', ['vercel', 'env', 'add', 'GEMINI_API_KEY', 'production'], {
    input: `${local.GEMINI_API_KEY}\n`,
    encoding: 'utf8',
  })
}

console.log('Deploy production...')
run('npx', ['vercel', '--prod', '--yes'])
