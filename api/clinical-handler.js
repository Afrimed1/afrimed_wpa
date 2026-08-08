import { handleClinicalRequest } from '../server/clinicalRouter.mjs'

function buildPathname(req) {
  const host = req.headers?.host || 'localhost'
  const rawUrl = req.url || '/'
  const full = new URL(rawUrl, `https://${host}`)

  // Rewrite Vercel : /api/clinical/:path* -> /api/clinical-handler?path=:path*
  const fromQuery = full.searchParams.get('path')
  if (fromQuery) {
    const searchParams = new URLSearchParams(full.searchParams)
    searchParams.delete('path')
    return {
      pathname: `/api/clinical/${fromQuery}`.replace(/\/+$/, '') || '/api/clinical',
      searchParams,
    }
  }

  if (full.pathname.startsWith('/api/clinical/') && full.pathname !== '/api/clinical-handler') {
    return { pathname: full.pathname.replace(/\/+$/, '') || '/api/clinical', searchParams: full.searchParams }
  }

  // Fallback headers sometimes keep the original URI after rewrite
  const original =
    req.headers['x-forwarded-uri'] ||
    req.headers['x-vercel-forwarded-uri'] ||
    req.headers['x-invoke-path'] ||
    ''
  if (typeof original === 'string' && original.includes('/api/clinical')) {
    const originalUrl = new URL(original, `https://${host}`)
    return {
      pathname: originalUrl.pathname.replace(/\/+$/, '') || '/api/clinical',
      searchParams: originalUrl.searchParams,
    }
  }

  return { pathname: '/api/clinical', searchParams: full.searchParams }
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
