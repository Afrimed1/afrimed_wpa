import { handleClinicalRequest } from '../../server/clinicalRouter.mjs'

function buildPathname(req) {
  const host = req.headers?.host || 'localhost'
  const full = new URL(req.url || '/', `https://${host}`)
  if (full.pathname.startsWith('/api/clinical')) {
    return { pathname: full.pathname, searchParams: full.searchParams }
  }

  const parts = Array.isArray(req.query?.path)
    ? req.query.path
    : String(req.query?.path || '')
        .split('/')
        .filter(Boolean)

  const searchParams = full.searchParams
  return {
    pathname: `/api/clinical/${parts.join('/')}`,
    searchParams,
  }
}

export default async function handler(req, res) {
  const { pathname, searchParams } = buildPathname(req)

  const handled = await handleClinicalRequest(req, res, {
    pathname,
    searchParams,
    env: process.env,
  })

  if (!handled) {
    res.statusCode = 404
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Route introuvable', pathname }))
  }
}
