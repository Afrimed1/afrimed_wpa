import { useCallback, useEffect, useState } from 'react'
import { Loader2, Plus, Search, Stethoscope } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { createConsultation, listConsultations, searchPatients } from '@/services/clinical'
import type { Consultation, Patient } from '@/types/database'
import { DemoNotice } from './DoctorPatientsPage'

const labels = {
  in_progress: 'En cours',
  awaiting_labs: 'En attente laboratoire',
  closed: 'Clôturée',
  deferred: 'Reportée',
}
const colors = {
  in_progress: 'bg-primary/10 text-primary',
  awaiting_labs: 'bg-accent/15 text-accent',
  closed: 'bg-secondary/15 text-secondary',
  deferred: 'bg-red-50 text-red-700',
}

type ConsultationRow = Consultation & {
  patients?: { first_name?: string; last_name?: string; access_code?: string } | null
}

export function DoctorConsultationsPage() {
  const { isDemoMode } = useAuth()
  const navigate = useNavigate()

  const [status, setStatus] = useState<Consultation['status'] | ''>('')
  const [consultations, setConsultations] = useState<ConsultationRow[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [patientQuery, setPatientQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [startingId, setStartingId] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (isDemoMode) return
    setLoading(true)
    setError('')
    try {
      setConsultations(await listConsultations({ status: status || undefined, mine: true }))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Chargement impossible.')
    } finally {
      setLoading(false)
    }
  }, [isDemoMode, status])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (isDemoMode) return
    let cancelled = false
    const timer = window.setTimeout(() => {
      void (async () => {
        setSearching(true)
        try {
          const results = await searchPatients({ query: patientQuery, limit: 12 })
          if (!cancelled) setPatients(results)
        } catch {
          if (!cancelled) setPatients([])
        } finally {
          if (!cancelled) setSearching(false)
        }
      })()
    }, patientQuery ? 250 : 0)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [isDemoMode, patientQuery])

  const openForPatient = async (patient: Patient) => {
    setStartingId(patient.id)
    setError('')
    try {
      const consultation = await createConsultation({ patientId: patient.id })
      navigate(`/doctor/consultations/${consultation.id}`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Création de consultation impossible.')
    } finally {
      setStartingId('')
    }
  }

  if (isDemoMode) return <DemoNotice title="Les consultations nécessitent Supabase." />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Consultation</h1>
        <p className="mt-1 text-sm text-primary/60">
          Recherchez un patient pour démarrer, ou rouvrez une consultation en cours
        </p>
      </div>

      <div className="card space-y-3">
        <h2 className="font-semibold text-primary">Nouvelle consultation</h2>
        <label className="relative block">
          <Search className="absolute left-3 top-3 h-4 w-4 text-primary/50" />
          <input
            value={patientQuery}
            onChange={(event) => setPatientQuery(event.target.value)}
            placeholder="Nom, prénom ou code patient"
            className="w-full rounded-lg border border-primary/15 py-2 pl-9 pr-3 text-sm outline-none focus:border-secondary"
          />
        </label>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <div className="divide-y divide-primary/10">
          {searching && (
            <p className="py-3 text-sm text-primary/60">
              <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
              Recherche…
            </p>
          )}
          {!searching && patients.length === 0 && (
            <p className="py-3 text-sm text-primary/60">
              {patientQuery
                ? 'Aucun patient trouvé.'
                : 'Saisissez un nom pour trouver un patient enregistré.'}
            </p>
          )}
          {patients.map((patient) => (
            <button
              key={patient.id}
              type="button"
              disabled={Boolean(startingId)}
              onClick={() => void openForPatient(patient)}
              className="flex w-full items-center justify-between gap-3 py-3 text-left hover:bg-primary/[.02] disabled:opacity-60"
            >
              <span>
                <span className="block font-semibold text-primary">
                  {patient.last_name} {patient.first_name}
                </span>
                <span className="text-sm text-primary/60">{patient.access_code}</span>
              </span>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-secondary">
                {startingId === patient.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Ouvrir
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-semibold text-primary">
            <Stethoscope className="h-4 w-4" />
            Mes consultations
          </h2>
          <label className="text-sm text-primary/70">
            Statut{' '}
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as Consultation['status'] | '')}
              className="ml-2 rounded-lg border border-primary/15 px-3 py-2"
            >
              <option value="">Tous</option>
              {Object.entries(labels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4 divide-y divide-primary/10">
          {loading && (
            <p className="py-5 text-sm text-primary/60">
              <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
              Chargement…
            </p>
          )}
          {!loading && consultations.length === 0 && (
            <p className="py-5 text-sm text-primary/60">Aucune consultation trouvée.</p>
          )}
          {consultations.map((consultation) => {
            const patientLabel = consultation.patients
              ? `${consultation.patients.last_name || ''} ${consultation.patients.first_name || ''}`.trim()
              : ''
            return (
              <button
                key={consultation.id}
                type="button"
                onClick={() => navigate(`/doctor/consultations/${consultation.id}`)}
                className="flex w-full items-center justify-between gap-3 py-4 text-left hover:bg-primary/[.02]"
              >
                <span>
                  <span className="block font-semibold text-primary">
                    {patientLabel || consultation.motif || 'Consultation'}
                  </span>
                  <span className="text-sm text-primary/60">
                    {consultation.motif ? `${consultation.motif} · ` : ''}
                    {new Date(consultation.started_at).toLocaleString('fr-FR')}
                  </span>
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${colors[consultation.status]}`}
                >
                  {labels[consultation.status]}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
