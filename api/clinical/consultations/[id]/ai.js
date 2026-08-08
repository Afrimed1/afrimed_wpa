import { suggestDiagnosisAI } from '../../../../server/clinicalApi.mjs'
function getBearer(req) {
  const header = req.headers.authorization || ''
  return header.match(/^Bearer\s+(.+)$/i)?.[1] || ''
}
function send(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}
export default async function handler(req, res) {
  const token = getBearer(req)
  if (!token) return send(res, 401, { error: 'Token manquant' })
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' })
  try {
    const id = String(req.query.id || '')
    return send(res, 200, { data: await suggestDiagnosisAI(token, id, process.env) })
  } catch (error) {
    return send(res, error?.status || 500, { error: error?.message || 'Erreur serveur' })
  }
}
