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
>
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
  labRequests: LabRequest[]
  prescriptions: Array<Prescription & { items: PrescriptionItem[] }>
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

export function searchPatients(options: SearchPatientsOptions = {}): Promise<Patient[]> {
  return clinicalFetch(
    withQuery('/api/clinical/patients', { q: options.query, limit: options.limit }),
  )
}

export function createPatient(input: PatientInput): Promise<Patient> {
  return clinicalFetch('/api/clinical/patients', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function getPatient(patientId: string): Promise<PatientDossier> {
  return clinicalFetch(`/api/clinical/patients/${encodeURIComponent(patientId)}`)
}

export function updatePatient(patientId: string, input: PatientUpdateInput): Promise<PatientDossier> {
  return clinicalFetch(`/api/clinical/patients/${encodeURIComponent(patientId)}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function listConsultations(
  options: ListConsultationsOptions = {},
): Promise<Consultation[]> {
  return clinicalFetch(
    withQuery('/api/clinical/consultations', {
      patientId: options.patientId,
      status: options.status,
      mine: options.mine ? 'true' : undefined,
    }),
  )
}

export function createConsultation(input: ConsultationInput): Promise<Consultation> {
  return clinicalFetch('/api/clinical/consultations', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function getConsultation(consultationId: string): Promise<ConsultationDetail> {
  return clinicalFetch(`/api/clinical/consultations/${encodeURIComponent(consultationId)}`)
}

export function updateConsultation(
  consultationId: string,
  input: ConsultationUpdateInput,
): Promise<Consultation> {
  return clinicalFetch(`/api/clinical/consultations/${encodeURIComponent(consultationId)}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function closeConsultation(
  consultationId: string,
  input: Pick<ConsultationUpdateInput, 'diagnosis' | 'deferral_reason' | 'follow_up_date' | 'follow_up_notes'>,
): Promise<ConsultationDetail> {
  return clinicalFetch(`/api/clinical/consultations/${encodeURIComponent(consultationId)}/close`, {
    method: 'POST',
    body: JSON.stringify({
      diagnosis: input.diagnosis,
      deferralReason: input.deferral_reason,
      followUpDate: input.follow_up_date,
      followUpNotes: input.follow_up_notes,
    }),
  })
}

export function runAiSuggestions(consultationId: string): Promise<AiSuggestionResult> {
  return clinicalFetch(
    `/api/clinical/consultations/${encodeURIComponent(consultationId)}/ai`,
    { method: 'POST' },
  )
}

export function listMedications(): Promise<Medication[]> {
  return clinicalFetch('/api/clinical/medications')
}

export function listExamTypes(): Promise<LabExamType[]> {
  return clinicalFetch('/api/clinical/exam-types')
}

export function createLabRequest(input: LabRequestInput): Promise<ConsultationLabRequest> {
  return clinicalFetch('/api/clinical/lab-requests', {
    method: 'POST',
    body: JSON.stringify(input),
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
  })
}

export function savePrescription(input: SavePrescriptionInput): Promise<Prescription> {
  return clinicalFetch('/api/clinical/prescriptions', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function doctorDashboard(): Promise<DoctorDashboard> {
  return clinicalFetch('/api/clinical/doctor-dashboard')
}

export function adminStats(): Promise<AdminStats> {
  return clinicalFetch('/api/clinical/admin-stats')
}

export function patientPortal(code: string): Promise<PatientPortalData> {
  return publicClinicalFetch(
    withQuery('/api/clinical/patient-portal', { code }),
  )
}
