import { getPatientPortalByCode } from '../../server/clinicalApi.mjs'

function send(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    send(res, 405, { error: 'Method not allowed' })
    return
  }

  try {
    const host = req.headers?.host || 'localhost'
    const url = new URL(req.url || '/', `https://${host}`)
    const code = url.searchParams.get('code') || req.query?.code
    const data = await getPatientPortalByCode(code, process.env)
    send(res, 200, { data })
  } catch (error) {
    send(res, error?.status || 500, { error: error?.message || 'Erreur serveur' })
  }
}
