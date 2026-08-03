import {
  completeLabRequest,
  createConsultation,
  createLabRequest,
  createPatient,
  getAdminStats,
  getConsultation,
  getDoctorDashboard,
  getPatientDossier,
  getPatientPortalByCode,
  listConsultations,
  listExamTypes,
  listLabRequests,
  listMedications,
  savePrescription,
  searchPatients,
  suggestDiagnosisAI,
  updateConsultation,
  updatePatientDossier,
  closeConsultation,
} from './clinicalApi.mjs'

function getBearer(req) {
  const header = req.headers.authorization || ''
  return header.match(/^Bearer\s+(.+)$/i)?.[1] || ''
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8')
      if (!raw) return resolve({})
      try {
        return resolve(JSON.parse(raw))
      } catch (error) {
        return reject(error)
      }
    })
    req.on('error', reject)
  })
}

function send(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

export async function handleClinicalRequest(req, res, { pathname, searchParams, env = process.env }) {
  const method = req.method || 'GET'
  const portal = pathname === '/api/clinical/patient-portal'
  const token = getBearer(req)
  if (!portal && !token) {
    send(res, 401, { error: 'Token manquant' })
    return true
  }

  try {
    if (method === 'GET' && pathname === '/api/clinical/patient-portal') {
      send(res, 200, { data: await getPatientPortalByCode(searchParams.get('code'), env) })
      return true
    }
    if (method === 'GET' && pathname === '/api/clinical/patients') {
      send(res, 200, { data: await searchPatients(token, { q: searchParams.get('q'), establishmentId: searchParams.get('establishmentId') }, env) })
      return true
    }
    if (method === 'POST' && pathname === '/api/clinical/patients') {
      send(res, 201, { data: await createPatient(token, await readBody(req), env) })
      return true
    }
    const patientMatch = pathname.match(/^\/api\/clinical\/patients\/([^/]+)$/)
    if (patientMatch && method === 'GET') {
      send(res, 200, { data: await getPatientDossier(token, patientMatch[1], env) })
      return true
    }
    if (patientMatch && method === 'PUT') {
      send(res, 200, { data: await updatePatientDossier(token, patientMatch[1], await readBody(req), env) })
      return true
    }
    if (method === 'GET' && pathname === '/api/clinical/consultations') {
      send(res, 200, { data: await listConsultations(token, Object.fromEntries(searchParams), env) })
      return true
    }
    if (method === 'POST' && pathname === '/api/clinical/consultations') {
      send(res, 201, { data: await createConsultation(token, await readBody(req), env) })
      return true
    }
    const closeMatch = pathname.match(/^\/api\/clinical\/consultations\/([^/]+)\/close$/)
    if (closeMatch && method === 'POST') {
      send(res, 200, { data: await closeConsultation(token, closeMatch[1], await readBody(req), env) })
      return true
    }
    const aiMatch = pathname.match(/^\/api\/clinical\/consultations\/([^/]+)\/ai$/)
    if (aiMatch && method === 'POST') {
      send(res, 200, { data: await suggestDiagnosisAI(token, aiMatch[1], env) })
      return true
    }
    const consultationMatch = pathname.match(/^\/api\/clinical\/consultations\/([^/]+)$/)
    if (consultationMatch && method === 'GET') {
      send(res, 200, { data: await getConsultation(token, consultationMatch[1], env) })
      return true
    }
    if (consultationMatch && method === 'PUT') {
      send(res, 200, { data: await updateConsultation(token, consultationMatch[1], await readBody(req), env) })
      return true
    }
    if (method === 'GET' && pathname === '/api/clinical/medications') {
      send(res, 200, { data: await listMedications(token, env) })
      return true
    }
    if (method === 'GET' && pathname === '/api/clinical/exam-types') {
      send(res, 200, { data: await listExamTypes(token, env) })
      return true
    }
    if (method === 'POST' && pathname === '/api/clinical/lab-requests') {
      send(res, 201, { data: await createLabRequest(token, await readBody(req), env) })
      return true
    }
    if (method === 'GET' && pathname === '/api/clinical/lab-requests') {
      send(res, 200, { data: await listLabRequests(token, { status: searchParams.get('status') }, env) })
      return true
    }
    const labCompleteMatch = pathname.match(/^\/api\/clinical\/lab-requests\/([^/]+)\/complete$/)
    if (labCompleteMatch && method === 'POST') {
      send(res, 200, { data: await completeLabRequest(token, { id: labCompleteMatch[1], ...(await readBody(req)) }, env) })
      return true
    }
    if (method === 'POST' && pathname === '/api/clinical/prescriptions') {
      send(res, 201, { data: await savePrescription(token, await readBody(req), env) })
      return true
    }
    if (method === 'GET' && pathname === '/api/clinical/doctor-dashboard') {
      send(res, 200, { data: await getDoctorDashboard(token, env) })
      return true
    }
    if (method === 'GET' && pathname === '/api/clinical/admin-stats') {
      send(res, 200, { data: await getAdminStats(token, env) })
      return true
    }
  } catch (error) {
    send(res, error?.status || 500, { error: error?.message || 'Erreur serveur' })
    return true
  }
  return false
}
