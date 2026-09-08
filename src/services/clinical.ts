import {
  ClinicalCacheKeys,
  cacheGet,
  cacheInvalidateKeys,
  cacheInvalidatePrefix,
  cacheSet,
  clearClinicalCache,
} from '@/lib/clinicalCache'
import { getAccessToken } from '@/lib/supabase'
import type {
  Consultation,
  ConsultationLabRequest,
  LabExamType,
  Medication,
  Patient,
  PatientAllergy,
  Prescription,
  PrescriptionItem,
} from '@/types/database'

type TableInsert<Table extends keyof import('@/types/database').Database['public']['Tables']> =
  import('@/types/database').Database['public']['Tables'][Table]['Insert']
type TableUpdate<Table extends keyof import('@/types/database').Database['public']['Tables']> =
  import('@/types/database').Database['public']['Tables'][Table]['Update']

export type PatientInput = Omit<
  TableInsert<'patients'>,
  'id' | 'establishment_id' | 'access_code' | 'created_at' | 'updated_at'
> & {
  allergies?: Array<Pick<PatientAllergy, 'substance' | 'severity' | 'notes'>>
  motif?: string
  history_of_illness?: string
}
export type PatientUpdateInput = Omit<
  TableUpdate<'patients'>,
  'id' | 'establishment_id' | 'access_code' | 'created_at' | 'updated_at'
> & {
  allergies?: Array<Pick<PatientAllergy, 'substance' | 'severity' | 'notes'>>
}
export interface ConsultationInput {
  patientId: string
}
export type ConsultationUpdateInput = Omit<
  TableUpdate<'consultations'>,
  'id' | 'establishment_id' | 'patient_id' | 'doctor_id' | 'created_at' | 'updated_at' | 'started_at' | 'closed_at'
>
export interface LabRequestInput {
  consultationId: string
  examTypeId: string
}
export type LabRequestCompletionInput = Pick<
  TableUpdate<'consultation_lab_requests'>,
  'result_text' | 'result_values'
> & {
  status?: 'completed'
}
export interface PrescriptionItemInput {
  medicationId?: string | null
  medicationName: string
  posology: string
  duration?: string | null
  allergyOverride?: boolean
  allergyOverrideReason?: string | null
}
export interface SavePrescriptionInput {
  consultationId: string
  patientId: string
  notes?: string | null
  items: PrescriptionItemInput[]
}

export interface SearchPatientsOptions {
  query?: string
  limit?: number
}

export interface ListConsultationsOptions {
  patientId?: string
  status?: Consultation['status']
  mine?: boolean
}

export interface ListLabRequestsOptions {
  consultationId?: string
  patientId?: string
  status?: ConsultationLabRequest['status']
}

export interface AiSuggestionResult {
  suggestions?: unknown
  [key: string]: unknown
}

export interface DoctorDashboard {
  consultationsToday: number
  consultationsWeek: number
  awaitingLabs: number
  overdueFollowUps: number
  inProgress: number
  deferred: number
}

export interface AdminStats {
  patients: number
  consultations: number
  pendingLabs: number
  activeStaff: number
  overdueFollowUps: number
  topPathologies: Array<{ diagnosis: string; count: number }>
}

export interface LabRequest extends ConsultationLabRequest {
  patients?: Pick<Patient, 'id' | 'first_name' | 'last_name' | 'access_code'> | null
  lab_exam_types?: LabExamType | null
  requested_by_profile?: Pick<import('@/types/database').Profile, 'first_name' | 'last_name'> | null
}

export interface PatientDossier extends Patient {
  allergies: PatientAllergy[]
  recentConsultations: Consultation[]
}

export interface ConsultationDetail extends Consultation {
  patient: Patient
  dossier?: PatientDossier
  labRequests: LabRequest[]
  prescriptions: Array<Prescription & { items: PrescriptionItem[] }>
  medications?: Medication[]
  examTypes?: LabExamType[]
}

export interface PatientPortalConsultation {
  date: string
  motif: string | null
  diagnosis: string | null
}

export interface PatientPortalPrescription {
  date: string
  notes: string | null
  items: Array<Pick<PrescriptionItem, 'prescription_id' | 'medication_name' | 'posology' | 'duration'>>
}

export interface PatientPortalData {
  identity: Pick<Patient, 'first_name' | 'last_name' | 'birth_date' | 'sex' | 'phone'>
  allergies: Array<Pick<PatientAllergy, 'substance' | 'severity' | 'notes'>>
  chronic: {
    personalHistory: string
    medicalHistory: string
    familyHistory: string
    treatments: string
  }
  pastConsultations: PatientPortalConsultation[]
  prescriptions: PatientPortalPrescription[]
  followUp: Array<{ date: string | null; notes: string | null }>
}

function withQuery(path: string, params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value))
    }
  }
  const query = search.toString()
  return query ? `${path}?${query}` : path
}

async function clinicalFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAccessToken()
  if (!token) {
    throw new Error('Session expirée. Reconnectez-vous.')
  }

  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload.error || `Erreur API (${response.status})`)
  }
  return (payload.data ?? payload) as T
}

async function publicClinicalFetch<T>(path: string): Promise<T> {
  const response = await fetch(path)
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload.error || `Erreur API (${response.status})`)
  }
  return (payload.data ?? payload) as T
}

function invalidatePatientRelated(patientId?: string | null) {
  cacheInvalidatePrefix('consultations:')
  cacheInvalidatePrefix('patients:')
  cacheInvalidateKeys(ClinicalCacheKeys.doctorDashboard())
  if (patientId) cacheInvalidateKeys(ClinicalCacheKeys.patient(patientId))
}

function invalidateConsultationRelated(consultationId: string, patientId?: string | null) {
  cacheInvalidateKeys(
    ClinicalCacheKeys.consultation(consultationId, true),
    ClinicalCacheKeys.consultation(consultationId, false),
  )
  invalidatePatientRelated(patientId)
}

export function searchPatients(options: SearchPatientsOptions = {}): Promise<Patient[]> {
  const key = ClinicalCacheKeys.patientsSearch(
    JSON.stringify({ q: options.query || '', limit: options.limit || '' }),
  )
  const cached = cacheGet<Patient[]>(key)
  if (cached) return Promise.resolve(cached)
  return clinicalFetch<Patient[]>(
    withQuery('/api/clinical/patients', { q: options.query, limit: options.limit }),
  ).then((data) => cacheSet(key, data, 30_000))
}

export function createPatient(input: PatientInput): Promise<PatientDossier & {
  initialConsultation?: Consultation | null
  warning?: string | null
}> {
  return clinicalFetch('/api/clinical/patients', {
    method: 'POST',
    body: JSON.stringify(input),
  }).then((data) => {
    invalidatePatientRelated(data.id)
    if (data.initialConsultation?.id) {
      invalidateConsultationRelated(data.initialConsultation.id, data.id)
    }
    cacheSet(ClinicalCacheKeys.patient(data.id), data)
    return data
  })
}

export function getPatient(patientId: string): Promise<PatientDossier> {
  const key = ClinicalCacheKeys.patient(patientId)
  const cached = cacheGet<PatientDossier>(key)
  if (cached) return Promise.resolve(cached)
  return clinicalFetch<PatientDossier>(
    `/api/clinical/patients/${encodeURIComponent(patientId)}`,
  ).then((data) => cacheSet(key, data))
}

export function updatePatient(patientId: string, input: PatientUpdateInput): Promise<PatientDossier> {
  return clinicalFetch<PatientDossier>(`/api/clinical/patients/${encodeURIComponent(patientId)}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  }).then((data) => {
    invalidatePatientRelated(patientId)
    cacheInvalidatePrefix('consultation:')
    return cacheSet(ClinicalCacheKeys.patient(patientId), data)
  })
}

export function listConsultations(
  options: ListConsultationsOptions = {},
): Promise<Consultation[]> {
  const key = ClinicalCacheKeys.consultations(
    JSON.stringify({
      patientId: options.patientId || '',
      status: options.status || '',
      mine: Boolean(options.mine),
    }),
  )
  const cached = cacheGet<Consultation[]>(key)
  if (cached) return Promise.resolve(cached)
  return clinicalFetch<Consultation[]>(
    withQuery('/api/clinical/consultations', {
      patientId: options.patientId,
      status: options.status,
      mine: options.mine ? 'true' : undefined,
    }),
  ).then((data) => cacheSet(key, data, 30_000))
}

export function createConsultation(input: ConsultationInput): Promise<Consultation> {
  return clinicalFetch<Consultation>('/api/clinical/consultations', {
    method: 'POST',
    body: JSON.stringify(input),
  }).then((data) => {
    invalidateConsultationRelated(data.id, input.patientId)
    return data
  })
}

export function getConsultation(
  consultationId: string,
  options: { bootstrap?: boolean } = {},
): Promise<ConsultationDetail> {
  const key = ClinicalCacheKeys.consultation(consultationId, Boolean(options.bootstrap))
  const cached = cacheGet<ConsultationDetail>(key)
  if (cached) return Promise.resolve(cached)
  return clinicalFetch<ConsultationDetail>(
    withQuery(`/api/clinical/consultations/${encodeURIComponent(consultationId)}`, {
      bootstrap: options.bootstrap ? '1' : undefined,
    }),
  ).then((data) => {
    cacheSet(key, data)
    if (data.dossier) {
      cacheSet(ClinicalCacheKeys.patient(data.patient_id), data.dossier)
    }
    if (data.medications) {
      refCache.medications = { data: data.medications, expiresAt: Date.now() + 5 * 60_000 }
    }
    if (data.examTypes) {
      refCache.examTypes = { data: data.examTypes, expiresAt: Date.now() + 5 * 60_000 }
    }
    return data
  })
}

export function updateConsultation(
  consultationId: string,
  input: ConsultationUpdateInput,
): Promise<Consultation> {
  return clinicalFetch<Consultation>(
    `/api/clinical/consultations/${encodeURIComponent(consultationId)}`,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    },
  ).then((data) => {
    invalidateConsultationRelated(consultationId, data.patient_id)
    return data
  })
}

export function closeConsultation(
  consultationId: string,
  input: Pick<
    ConsultationUpdateInput,
    'diagnosis' | 'deferral_reason' | 'follow_up_date' | 'follow_up_notes'
  >,
): Promise<Consultation> {
  return clinicalFetch<Consultation>(
    `/api/clinical/consultations/${encodeURIComponent(consultationId)}/close`,
    {
      method: 'POST',
      body: JSON.stringify({
        diagnosis: input.diagnosis,
        deferralReason: input.deferral_reason,
        followUpDate: input.follow_up_date,
        followUpNotes: input.follow_up_notes,
      }),
    },
  ).then((data) => {
    invalidateConsultationRelated(consultationId, data.patient_id)
    return data
  })
}

export function runAiSuggestions(consultationId: string): Promise<AiSuggestionResult> {
  return clinicalFetch(
    `/api/clinical/consultations/${encodeURIComponent(consultationId)}/ai`,
    { method: 'POST' },
  )
}

const refCache: {
  medications: { data: Medication[]; expiresAt: number } | null
  examTypes: { data: LabExamType[]; expiresAt: number } | null
} = {
  medications: null,
  examTypes: null,
}

export function listMedications(): Promise<Medication[]> {
  if (refCache.medications && refCache.medications.expiresAt > Date.now()) {
    return Promise.resolve(refCache.medications.data)
  }
  return clinicalFetch<Medication[]>('/api/clinical/medications').then((data) => {
    refCache.medications = { data, expiresAt: Date.now() + 5 * 60_000 }
    return data
  })
}

export function listExamTypes(): Promise<LabExamType[]> {
  if (refCache.examTypes && refCache.examTypes.expiresAt > Date.now()) {
    return Promise.resolve(refCache.examTypes.data)
  }
  return clinicalFetch<LabExamType[]>('/api/clinical/exam-types').then((data) => {
    refCache.examTypes = { data, expiresAt: Date.now() + 5 * 60_000 }
    return data
  })
}

export function createLabRequest(input: LabRequestInput): Promise<ConsultationLabRequest> {
  return clinicalFetch('/api/clinical/lab-requests', {
    method: 'POST',
    body: JSON.stringify(input),
  }).then((data) => {
    invalidateConsultationRelated(input.consultationId)
    return data
  })
}

export function listLabRequests(
  options: ListLabRequestsOptions = {},
): Promise<LabRequest[]> {
  return clinicalFetch(
    withQuery('/api/clinical/lab-requests', {
      consultationId: options.consultationId,
      patientId: options.patientId,
      status: options.status,
    }),
  )
}

export function completeLabRequest(
  requestId: string,
  input: LabRequestCompletionInput,
): Promise<LabRequest> {
  return clinicalFetch(`/api/clinical/lab-requests/${encodeURIComponent(requestId)}/complete`, {
    method: 'POST',
    body: JSON.stringify({ resultText: input.result_text }),
  }).then((data) => {
    if (data.consultation_id) invalidateConsultationRelated(data.consultation_id, data.patient_id)
    return data
  })
}

export function savePrescription(input: SavePrescriptionInput): Promise<Prescription> {
  return clinicalFetch('/api/clinical/prescriptions', {
    method: 'POST',
    body: JSON.stringify(input),
  }).then((data) => {
    invalidateConsultationRelated(input.consultationId, input.patientId)
    return data
  })
}

export function doctorDashboard(): Promise<DoctorDashboard> {
  const key = ClinicalCacheKeys.doctorDashboard()
  const cached = cacheGet<DoctorDashboard>(key)
  if (cached) return Promise.resolve(cached)
  return clinicalFetch<DoctorDashboard>('/api/clinical/doctor-dashboard').then((data) =>
    cacheSet(key, data, 20_000),
  )
}

export function adminStats(): Promise<AdminStats> {
  return clinicalFetch('/api/clinical/admin-stats')
}

export function patientPortal(code: string): Promise<PatientPortalData> {
  return publicClinicalFetch(
    withQuery('/api/clinical/patient-portal', { code }),
  )
}

export { clearClinicalCache }
