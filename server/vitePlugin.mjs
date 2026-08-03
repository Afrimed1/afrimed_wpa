import {
  createStaff,
  listEstablishmentProfiles,
  setStaffActive,
} from './adminApi.mjs'
import { handleClinicalRequest } from './clinicalRouter.mjs'

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8')
      if (!raw) {
        resolve({})
        return
      }
      try {
        resolve(JSON.parse(raw))
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

function sendJson(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

function getBearer(req) {
  const header = req.headers.authorization || ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  return match?.[1] || ''
}

async function handle(req, res, env) {
  const url = new URL(req.url || '/', 'http://localhost')
  const path = url.pathname
  const method = req.method || 'GET'
  const token = getBearer(req)

  if (!token) {
    sendJson(res, 401, { error: 'Token manquant' })
    return true
  }

  try {
    if (method === 'GET' && path === '/api/admin/profiles') {
      const establishmentId = url.searchParams.get('establishmentId') || ''
      const data = await listEstablishmentProfiles(token, establishmentId, env)
      sendJson(res, 200, { data })
      return true
    }

    if (method === 'POST' && path === '/api/admin/staff') {
      const body = await readBody(req)
      const result = await createStaff(token, body, env)
      sendJson(res, 201, result)
      return true
    }

    if (method === 'PATCH' && path.startsWith('/api/admin/staff/')) {
      const profileId = path.replace('/api/admin/staff/', '')
      const body = await readBody(req)
      const result = await setStaffActive(token, profileId, body.isActive, env)
      sendJson(res, 200, result)
      return true
    }
  } catch (error) {
    const status = error?.status || 500
    sendJson(res, status, { error: error?.message || 'Erreur serveur' })
    return true
  }

  return false
}

export function afrimedAdminApiPlugin(env) {
  return {
    name: 'afrimed-admin-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith('/api/clinical')) {
          const url = new URL(req.url, 'http://localhost')
          const handled = await handleClinicalRequest(req, res, {
            pathname: url.pathname,
            searchParams: url.searchParams,
            env,
          })
          if (!handled) next()
          return
        }
        if (!req.url?.startsWith('/api/admin')) {
          next()
          return
        }
        const handled = await handle(req, res, env)
        if (!handled) next()
      })
    },
  }
}
