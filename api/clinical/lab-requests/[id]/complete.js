import { completeLabRequest } from '../../../../server/clinicalApi.mjs'
function getBearer(req) {
  const header = req.headers.authorization || ''
  return header.match(/^Bearer\s+(.+)$/i)?.[1] || ''
}
function send(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}
async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8')
      if (!raw) return resolve({})
      try { resolve(JSON.parse(raw)) } catch (error) { reject(error) }
    })
    req.on('error', reject)
  })
}
export default async function handler(req, res) {
  const token = getBearer(req)
  if (!token) return send(res, 401, { error: 'Token manquant' })
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' })
  try {
    const id = String(req.query.id || '')
    return send(res, 200, { data: await completeLabRequest(token, { id, ...(await readBody(req)) }, process.env) })
  } catch (error) {
    return send(res, error?.status || 500, { error: error?.message || 'Erreur serveur' })
  }
}
