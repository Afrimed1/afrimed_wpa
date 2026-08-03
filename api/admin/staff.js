import { createStaff } from '../../server/adminApi.mjs'

function getBearer(req) {
  const header = req.headers.authorization || ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  return match?.[1] || ''
}

function send(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

export default async function handler(req, res) {
  const token = getBearer(req)
  if (!token) {
    send(res, 401, { error: 'Token manquant' })
    return
  }

  try {
    if (req.method === 'POST') {
      const result = await createStaff(token, req.body || {}, process.env)
      send(res, 201, result)
      return
    }
    send(res, 405, { error: 'Method not allowed' })
  } catch (error) {
    send(res, error?.status || 500, { error: error?.message || 'Erreur serveur' })
  }
}
