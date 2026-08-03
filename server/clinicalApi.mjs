import { createAdminClient } from './adminApi.mjs'

const STAFF_ROLES = ['admin', 'doctor', 'lab']
const PATIENT_FIELDS = [
  'first_name',
  'last_name',
  'birth_date',
  'sex',
  'phone',
  'emergency_contact_name',
  'emergency_contact_phone',
  'personal_history',
  'family_history',
  'chronic_treatments',
  'is_active',
]
const CONSULTATION_FIELDS = [
  'motif',
  'history_of_illness',
  'temperature_c',
  'blood_pressure',
  'pulse_bpm',
  'weight_kg',
  'height_cm',
  'review_of_systems',
  'physical_exam',
  'ai_decisions',
]

function httpError(message, status = 400) {
  const error = new Error(message)
  error.status = status
  return error
}

function pick(source, allowed) {
  return Object.fromEntries(
    allowed
      .filter((key) => source[key] !== undefined)
      .map((key) => [key, source[key]]),
  )
}

function text(value) {
  return String(value || '').trim()
}

export function generateAccessCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let index = 0; index < 6; index += 1) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export async function requireStaff(accessToken, roles = STAFF_ROLES, env = process.env) {
  const admin = createAdminClient(env)
  const { data, error } = await admin.auth.getUser(accessToken)
  if (error || !data.user) throw httpError('Session invalide', 401)

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .maybeSingle()

  if (profileError || !profile || !profile.is_active) {
    throw httpError('Profil du personnel non autorise', 403)
  }
  if (!roles.includes(profile.role)) throw httpError('Role non autorise', 403)
  return { admin, profile }
}

export const requireStaffProfile = requireStaff

async function getPatient(admin, patientId, establishmentId) {
  const { data, error } = await admin
    .from('patients')
    .select('*')
    .eq('id', patientId)
    .eq('establishment_id', establishmentId)
    .maybeSingle()
  if (error) throw error
  if (!data) throw httpError('Patient introuvable', 404)
  return data
}

async function getConsultationRecord(admin, id, establishmentId) {
  const { data, error } = await admin
    .from('consultations')
    .select('*')
    .eq('id', id)
    .eq('establishment_id', establishmentId)
    .maybeSingle()
  if (error) throw error
  if (!data) throw httpError('Consultation introuvable', 404)
  return data
}

function requireDoctorOrAdmin(profile) {
  if (!['admin', 'doctor'].includes(profile.role)) throw httpError('Acces medecin requis', 403)
}

export async function searchPatients(accessToken, { q = '', establishmentId } = {}, env) {
  const { admin, profile } = await requireStaff(accessToken, STAFF_ROLES, env)
  if (establishmentId && establishmentId !== profile.establishment_id) {
    throw httpError('Etablissement non autorise', 403)
  }
  const targetEstablishment = establishmentId || profile.establishment_id
  let query = admin
    .from('patients')
    .select('*')
    .eq('establishment_id', targetEstablishment)
    .order('last_name')
    .limit(50)
  const term = text(q)
  if (term) {
    const escaped = term.replace(/[%_,()]/g, ' ')
    query = query.or(`first_name.ilike.%${escaped}%,last_name.ilike.%${escaped}%,access_code.ilike.%${escaped}%`)
  }
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function createPatient(accessToken, payload, env) {
  const { admin, profile } = await requireStaff(accessToken, ['admin', 'doctor'], env)
  const firstName = text(payload.firstName ?? payload.first_name)
  const lastName = text(payload.lastName ?? payload.last_name)
  if (!firstName || !lastName) throw httpError('Nom et prenom obligatoires')

  const patient = {
    ...pick(payload, PATIENT_FIELDS),
    first_name: firstName,
    last_name: lastName,
    establishment_id: profile.establishment_id,
  }
  let created = null
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data, error } = await admin
      .from('patients')
      .insert({ ...patient, access_code: generateAccessCode() })
      .select('*')
      .single()
    if (!error) {
      created = data
      break
    }
    if (error.code !== '23505') throw error
  }
  if (!created) throw httpError('Impossible de generer un code patient unique', 500)

  const allergies = Array.isArray(payload.allergies)
    ? payload.allergies
        .map((allergy) => ({
          patient_id: created.id,
          substance: text(allergy.substance),
          severity: text(allergy.severity),
          notes: text(allergy.notes) || null,
        }))
        .filter((allergy) => allergy.substance && ['mild', 'moderate', 'severe'].includes(allergy.severity))
    : []

  if (allergies.length) {
    const { error } = await admin.from('patient_allergies').insert(allergies)
    if (error) throw error
  }

  return getPatientDossier(accessToken, created.id, env)
}

export async function getPatientDossier(accessToken, patientId, env) {
  const { admin, profile } = await requireStaff(accessToken, STAFF_ROLES, env)
  const patient = await getPatient(admin, patientId, profile.establishment_id)
  const [allergiesResult, consultationsResult] = await Promise.all([
    admin.from('patient_allergies').select('*').eq('patient_id', patientId).order('created_at', { ascending: false }),
    admin
      .from('consultations')
      .select('id, status, motif, diagnosis, follow_up_date, follow_up_notes, started_at, closed_at, doctor_id')
      .eq('patient_id', patientId)
      .eq('establishment_id', profile.establishment_id)
      .order('started_at', { ascending: false })
      .limit(20),
  ])
  if (allergiesResult.error) throw allergiesResult.error
  if (consultationsResult.error) throw consultationsResult.error
  return { ...patient, allergies: allergiesResult.data ?? [], recentConsultations: consultationsResult.data ?? [] }
}

export async function updatePatientDossier(accessToken, patientId, payload, env) {
  const { admin, profile } = await requireStaff(accessToken, ['admin', 'doctor'], env)
  await getPatient(admin, patientId, profile.establishment_id)
  const updates = pick(payload, PATIENT_FIELDS)
  if (payload.firstName !== undefined) updates.first_name = text(payload.firstName)
  if (payload.lastName !== undefined) updates.last_name = text(payload.lastName)
  if (Object.keys(updates).length) {
    const { error } = await admin.from('patients').update(updates).eq('id', patientId)
    if (error) throw error
  }
  if (Array.isArray(payload.allergies)) {
    const { error: deleteError } = await admin.from('patient_allergies').delete().eq('patient_id', patientId)
    if (deleteError) throw deleteError
    const allergies = payload.allergies
      .map((allergy) => ({
        patient_id: patientId,
        substance: text(allergy.substance),
        severity: text(allergy.severity),
        notes: text(allergy.notes) || null,
      }))
      .filter((allergy) => allergy.substance && ['mild', 'moderate', 'severe'].includes(allergy.severity))
    if (allergies.length) {
      const { error } = await admin.from('patient_allergies').insert(allergies)
      if (error) throw error
    }
  }
  return getPatientDossier(accessToken, patientId, env)
}

export async function listConsultations(accessToken, filters = {}, env) {
  const { admin, profile } = await requireStaff(accessToken, STAFF_ROLES, env)
  let query = admin
    .from('consultations')
    .select('*, patients(id, first_name, last_name, access_code)')
    .eq('establishment_id', profile.establishment_id)
    .order('started_at', { ascending: false })
    .limit(100)
  if (filters.status) query = query.eq('status', filters.status)
  if (filters.patientId) query = query.eq('patient_id', filters.patientId)
  if (filters.doctorId) query = query.eq('doctor_id', filters.doctorId)
  if (profile.role === 'doctor' && filters.mine === 'true') query = query.eq('doctor_id', profile.id)
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function createConsultation(accessToken, { patientId }, env) {
  const { admin, profile } = await requireStaff(accessToken, ['admin', 'doctor'], env)
  if (!patientId) throw httpError('Patient obligatoire')
  await getPatient(admin, patientId, profile.establishment_id)
  const { data, error } = await admin
    .from('consultations')
    .insert({
      patient_id: patientId,
      establishment_id: profile.establishment_id,
      doctor_id: profile.id,
    })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function getConsultation(accessToken, id, env) {
  const { admin, profile } = await requireStaff(accessToken, STAFF_ROLES, env)
  const consultation = await getConsultationRecord(admin, id, profile.establishment_id)
  const [patientResult, labsResult, prescriptionsResult] = await Promise.all([
    admin.from('patients').select('*').eq('id', consultation.patient_id).single(),
    admin
      .from('consultation_lab_requests')
      .select('*, lab_exam_types(*)')
      .eq('consultation_id', id)
      .order('created_at', { ascending: false }),
    admin.from('prescriptions').select('*').eq('consultation_id', id).order('created_at', { ascending: false }),
  ])
  if (patientResult.error) throw patientResult.error
  if (labsResult.error) throw labsResult.error
  if (prescriptionsResult.error) throw prescriptionsResult.error
  const prescriptionIds = (prescriptionsResult.data ?? []).map((item) => item.id)
  let items = []
  if (prescriptionIds.length) {
    const { data, error } = await admin.from('prescription_items').select('*').in('prescription_id', prescriptionIds)
    if (error) throw error
    items = data ?? []
  }
  return {
    ...consultation,
    patient: patientResult.data,
    labRequests: labsResult.data ?? [],
    prescriptions: (prescriptionsResult.data ?? []).map((prescription) => ({
      ...prescription,
      items: items.filter((item) => item.prescription_id === prescription.id),
    })),
  }
}

export async function updateConsultation(accessToken, id, fields, env) {
  const { admin, profile } = await requireStaff(accessToken, ['admin', 'doctor'], env)
  const consultation = await getConsultationRecord(admin, id, profile.establishment_id)
  if (profile.role === 'doctor' && consultation.doctor_id !== profile.id) throw httpError('Consultation non autorisee', 403)
  const updates = pick(fields, CONSULTATION_FIELDS)
  if (!Object.keys(updates).length) throw httpError('Aucun champ clinique a mettre a jour')
  const { error } = await admin.from('consultations').update(updates).eq('id', id)
  if (error) throw error
  return getConsultation(accessToken, id, env)
}

export async function closeConsultation(accessToken, id, input, env) {
  const { admin, profile } = await requireStaff(accessToken, ['admin', 'doctor'], env)
  const consultation = await getConsultationRecord(admin, id, profile.establishment_id)
  if (profile.role === 'doctor' && consultation.doctor_id !== profile.id) throw httpError('Consultation non autorisee', 403)
  const diagnosis = text(input.diagnosis)
  const deferralReason = text(input.deferralReason)
  if (!diagnosis && !deferralReason) throw httpError('Diagnostic ou motif de report obligatoire')
  const { error } = await admin
    .from('consultations')
    .update({
      diagnosis: diagnosis || null,
      deferral_reason: deferralReason || null,
      follow_up_date: input.followUpDate || null,
      follow_up_notes: text(input.followUpNotes) || null,
      status: diagnosis ? 'closed' : 'deferred',
      closed_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw error
  return getConsultation(accessToken, id, env)
}

export async function listMedications(accessToken, env) {
  const { admin } = await requireStaff(accessToken, STAFF_ROLES, env)
  const { data, error } = await admin.from('medications').select('*').eq('is_active', true).order('name')
  if (error) throw error
  return data ?? []
}

export async function listExamTypes(accessToken, env) {
  const { admin } = await requireStaff(accessToken, STAFF_ROLES, env)
  const { data, error } = await admin.from('lab_exam_types').select('*').eq('is_active', true).order('category').order('name')
  if (error) throw error
  return data ?? []
}

export async function createLabRequest(accessToken, { consultationId, examTypeId }, env) {
  const { admin, profile } = await requireStaff(accessToken, ['admin', 'doctor'], env)
  const consultation = await getConsultationRecord(admin, consultationId, profile.establishment_id)
  if (profile.role === 'doctor' && consultation.doctor_id !== profile.id) throw httpError('Consultation non autorisee', 403)
  const { data, error } = await admin
    .from('consultation_lab_requests')
    .insert({
      consultation_id: consultationId,
      patient_id: consultation.patient_id,
      establishment_id: profile.establishment_id,
      requested_by: profile.id,
      exam_type_id: examTypeId,
    })
    .select('*, lab_exam_types(*)')
    .single()
  if (error) throw error
  if (consultation.status === 'in_progress') {
    const { error: consultationError } = await admin
      .from('consultations')
      .update({ status: 'awaiting_labs' })
      .eq('id', consultationId)
    if (consultationError) throw consultationError
  }
  return data
}

export async function listLabRequests(accessToken, { status } = {}, env) {
  const { admin, profile } = await requireStaff(accessToken, STAFF_ROLES, env)
  let query = admin
    .from('consultation_lab_requests')
    .select('*, patients(id, first_name, last_name, access_code), lab_exam_types(*), requested_by_profile:profiles!consultation_lab_requests_requested_by_fkey(first_name, last_name)')
    .eq('establishment_id', profile.establishment_id)
    .order('created_at', { ascending: false })
    .limit(100)
  if (status) query = query.eq('status', status)
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function completeLabRequest(accessToken, { id, resultText }, env) {
  const { admin, profile } = await requireStaff(accessToken, ['admin', 'lab'], env)
  const { data: request, error: requestError } = await admin
    .from('consultation_lab_requests')
    .select('*')
    .eq('id', id)
    .eq('establishment_id', profile.establishment_id)
    .maybeSingle()
  if (requestError) throw requestError
  if (!request) throw httpError('Demande de laboratoire introuvable', 404)
  if (!text(resultText)) throw httpError('Resultat obligatoire')
  const { data, error } = await admin
    .from('consultation_lab_requests')
    .update({
      result_text: text(resultText),
      status: 'completed',
      completed_by: profile.id,
      completed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*, lab_exam_types(*)')
    .single()
  if (error) throw error
  return data
}

export async function savePrescription(accessToken, { consultationId, notes, items }, env) {
  const { admin, profile } = await requireStaff(accessToken, ['admin', 'doctor'], env)
  const consultation = await getConsultationRecord(admin, consultationId, profile.establishment_id)
  if (profile.role === 'doctor' && consultation.doctor_id !== profile.id) throw httpError('Consultation non autorisee', 403)
  if (!Array.isArray(items) || !items.length) throw httpError('Au moins un medicament est obligatoire')

  const { data: allergies, error: allergyError } = await admin
    .from('patient_allergies')
    .select('substance, severity')
    .eq('patient_id', consultation.patient_id)
  if (allergyError) throw allergyError

  const normalized = items.map((item) => ({
    medication_id: item.medicationId || null,
    medication_name: text(item.medicationName),
    posology: text(item.posology),
    duration: text(item.duration) || null,
    allergy_override: Boolean(item.allergyOverride),
    allergy_override_reason: text(item.allergyOverrideReason) || null,
  }))
  if (normalized.some((item) => !item.medication_name || !item.posology)) {
    throw httpError('Nom et posologie obligatoires pour chaque medicament')
  }

  for (const item of normalized) {
    const matches = (allergies || []).filter((allergy) =>
      relatedAllergyMatch(allergy.substance, item.medication_name),
    )
    if (!matches.length) continue
    if (!item.allergy_override || !item.allergy_override_reason) {
      throw httpError(
        `Allergie declaree (${matches.map((m) => m.substance).join(', ')}) pour ${item.medication_name}. Override + justification requis.`,
      )
    }
  }

  const { data: prescription, error } = await admin
    .from('prescriptions')
    .insert({
      consultation_id: consultationId,
      patient_id: consultation.patient_id,
      doctor_id: profile.id,
      establishment_id: profile.establishment_id,
      notes: text(notes) || null,
    })
    .select('*')
    .single()
  if (error) throw error
  const { data: savedItems, error: itemsError } = await admin
    .from('prescription_items')
    .insert(normalized.map((item) => ({ ...item, prescription_id: prescription.id })))
    .select('*')
  if (itemsError) throw itemsError
  return { ...prescription, items: savedItems ?? [] }
}

function normalizeMedText(value) {
  return text(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function relatedAllergyMatch(substance, medicationName) {
  const substanceNorm = normalizeMedText(substance)
  const medNorm = normalizeMedText(medicationName)
  if (!substanceNorm || !medNorm) return false
  if (medNorm.includes(substanceNorm) || substanceNorm.includes(medNorm)) return true

  const pairs = [
    ['penicill', 'amoxicill'],
    ['penicill', 'ampicill'],
    ['betalactam', 'amoxicill'],
    ['sulfamid', 'cotrimox'],
    ['aspirin', 'acetylsalic'],
  ]
  return pairs.some(
    ([a, b]) =>
      (substanceNorm.includes(a) && medNorm.includes(b)) ||
      (substanceNorm.includes(b) && medNorm.includes(a)),
  )
}

export async function getDoctorDashboard(accessToken, env) {
  const { admin, profile } = await requireStaff(accessToken, ['admin', 'doctor'], env)
  const doctorFilter = profile.role === 'doctor' ? { doctor_id: profile.id } : {}
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  weekStart.setHours(0, 0, 0, 0)
  const countConsultations = (filters) =>
    admin
      .from('consultations')
      .select('*', { count: 'exact', head: true })
      .eq('establishment_id', profile.establishment_id)
      .match({ ...doctorFilter, ...filters })
  const [inProgress, awaitingLabs, deferred, today, week, overdueFollowUps] = await Promise.all([
    countConsultations({ status: 'in_progress' }),
    countConsultations({ status: 'awaiting_labs' }),
    countConsultations({ status: 'deferred' }),
    countConsultations({}).gte('started_at', new Date().toISOString().slice(0, 10)),
    countConsultations({}).gte('started_at', weekStart.toISOString()),
    countConsultations({ status: 'closed' })
      .lt('follow_up_date', now.toISOString().slice(0, 10))
      .not('follow_up_date', 'is', null),
  ])
  for (const result of [inProgress, awaitingLabs, deferred, today, week, overdueFollowUps]) {
    if (result.error) throw result.error
  }
  return {
    inProgress: inProgress.count ?? 0,
    awaitingLabs: awaitingLabs.count ?? 0,
    deferred: deferred.count ?? 0,
    consultationsToday: today.count ?? 0,
    consultationsWeek: week.count ?? 0,
    overdueFollowUps: overdueFollowUps.count ?? 0,
  }
}

export async function getAdminStats(accessToken, env) {
  const { admin, profile } = await requireStaff(accessToken, ['admin'], env)
  const establishmentId = profile.establishment_id
  const today = new Date().toISOString().slice(0, 10)
  const [patients, consultations, pendingLabs, staff, overdueFollowUps, diagnoses] = await Promise.all([
    admin.from('patients').select('*', { count: 'exact', head: true }).eq('establishment_id', establishmentId),
    admin.from('consultations').select('*', { count: 'exact', head: true }).eq('establishment_id', establishmentId),
    admin.from('consultation_lab_requests').select('*', { count: 'exact', head: true }).eq('establishment_id', establishmentId).in('status', ['pending', 'in_progress']),
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('establishment_id', establishmentId).eq('is_active', true),
    admin.from('consultations').select('*', { count: 'exact', head: true }).eq('establishment_id', establishmentId).eq('status', 'closed').lt('follow_up_date', today),
    admin.from('consultations').select('diagnosis').eq('establishment_id', establishmentId).eq('status', 'closed').not('diagnosis', 'is', null),
  ])
  for (const result of [patients, consultations, pendingLabs, staff, overdueFollowUps, diagnoses]) if (result.error) throw result.error
  const pathologyCounts = new Map()
  for (const item of diagnoses.data ?? []) {
    const diagnosis = text(item.diagnosis)
    if (diagnosis) pathologyCounts.set(diagnosis, (pathologyCounts.get(diagnosis) ?? 0) + 1)
  }
  const topPathologies = [...pathologyCounts.entries()]
    .sort(([, left], [, right]) => right - left)
    .slice(0, 5)
    .map(([diagnosis, count]) => ({ diagnosis, count }))
  return {
    patients: patients.count ?? 0,
    consultations: consultations.count ?? 0,
    pendingLabs: pendingLabs.count ?? 0,
    activeStaff: staff.count ?? 0,
    overdueFollowUps: overdueFollowUps.count ?? 0,
    topPathologies,
  }
}

export async function getPatientPortalByCode(code, env) {
  const admin = createAdminClient(env)
  const accessCode = text(code).toUpperCase()
  if (!accessCode) throw httpError('Code patient obligatoire')
  const { data: patient, error } = await admin.from('patients').select('*').eq('access_code', accessCode).maybeSingle()
  if (error) throw error
  if (!patient) throw httpError('Code patient invalide', 404)
  const [allergies, consultations, prescriptions] = await Promise.all([
    admin.from('patient_allergies').select('substance, severity, notes').eq('patient_id', patient.id),
    admin.from('consultations').select('id, status, started_at, motif, diagnosis, follow_up_date, follow_up_notes').eq('patient_id', patient.id).in('status', ['closed', 'deferred']).order('started_at', { ascending: false }),
    admin.from('prescriptions').select('*').eq('patient_id', patient.id).order('created_at', { ascending: false }),
  ])
  for (const result of [allergies, consultations, prescriptions]) if (result.error) throw result.error
  const ids = (prescriptions.data ?? []).map((item) => item.id)
  const { data: prescriptionItems, error: itemsError } = ids.length
    ? await admin.from('prescription_items').select('prescription_id, medication_name, posology, duration').in('prescription_id', ids)
    : { data: [], error: null }
  if (itemsError) throw itemsError
  return {
    identity: pick(patient, ['first_name', 'last_name', 'birth_date', 'sex', 'phone']),
    allergies: allergies.data ?? [],
    chronic: { personalHistory: patient.personal_history, familyHistory: patient.family_history, treatments: patient.chronic_treatments },
    pastConsultations: (consultations.data ?? []).map((item) => ({ date: item.started_at, motif: item.motif, diagnosis: item.diagnosis })),
    prescriptions: (prescriptions.data ?? []).map((item) => ({
      date: item.created_at,
      notes: item.notes,
      items: (prescriptionItems ?? []).filter((entry) => entry.prescription_id === item.id),
    })),
    followUp: (consultations.data ?? [])
      .filter((item) => item.status === 'closed' && (item.follow_up_date || item.follow_up_notes))
      .map((item) => ({ date: item.follow_up_date, notes: item.follow_up_notes })),
  }
}

function heuristicSuggestions(consultation) {
  const source = `${consultation.motif || ''} ${consultation.history_of_illness || ''}`.toLowerCase()
  const matches = []
  if (/palu|fi[eè]vre|frisson/.test(source)) matches.push({ label: 'Paludisme', rationale: 'Fièvre ou symptômes compatibles rapportés.', confidence: 'medium', exams: ['TDR paludisme', 'Goutte épaisse'] })
  if (/toux|respirat|gorge|dyspn/.test(source)) matches.push({ label: 'Infection respiratoire aiguë', rationale: 'Symptômes respiratoires rapportés.', confidence: 'medium', exams: ['Numération formule sanguine', 'Protéine C réactive'] })
  if (/diarrh|vomiss|abdominal|gastro/.test(source)) matches.push({ label: 'Gastro-entérite', rationale: 'Symptômes digestifs rapportés.', confidence: 'medium', exams: ['Examen parasitologique des selles'] })
  if (/typho|constipation|fi[eè]vre prolong/.test(source)) matches.push({ label: 'Fièvre typhoïde', rationale: 'Symptômes à confronter au contexte clinique.', confidence: 'low', exams: ['Sérodiagnostic de Widal', 'Numération formule sanguine'] })
  if (!matches.length) matches.push({ label: 'Evaluation clinique complémentaire', rationale: 'Informations insuffisantes pour une hypothèse ciblée.', confidence: 'low', exams: [] })
  return { hypotheses: matches.map(({ exams, ...item }) => item), suggestedExams: [...new Set(matches.flatMap((item) => item.exams))] }
}

async function geminiSuggestions(consultation, apiKey) {
  const prompt = `Vous êtes un assistant clinique. Pour une consultation au Burkina Faso, produisez uniquement un JSON valide avec hypotheses (maximum 3 objets label, rationale, confidence: low|medium|high) et suggestedExams (tableau de chaînes). Ceci est une aide et non un diagnostic. Motif: ${consultation.motif || ''}. Symptômes: ${consultation.history_of_illness || ''}.`
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json' } }),
  })
  if (!response.ok) throw httpError('Service de suggestion clinique indisponible', 502)
  const data = await response.json()
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed.hypotheses) || !Array.isArray(parsed.suggestedExams)) throw new Error('Format invalide')
    return parsed
  } catch {
    throw httpError('Reponse de suggestion clinique invalide', 502)
  }
}

export async function suggestDiagnosisAI(accessToken, consultationId, env = process.env) {
  const { admin, profile } = await requireStaff(accessToken, ['admin', 'doctor'], env)
  const consultation = await getConsultationRecord(admin, consultationId, profile.establishment_id)
  if (profile.role === 'doctor' && consultation.doctor_id !== profile.id) throw httpError('Consultation non autorisee', 403)
  const suggestions = env.GEMINI_API_KEY
    ? await geminiSuggestions(consultation, env.GEMINI_API_KEY)
    : heuristicSuggestions(consultation)
  const { error } = await admin.from('consultations').update({ ai_suggestions: suggestions }).eq('id', consultationId)
  if (error) throw error
  return suggestions
}
