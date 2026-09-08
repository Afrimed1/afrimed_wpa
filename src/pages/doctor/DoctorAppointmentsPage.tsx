import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CalendarDays, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { listConsultations } from '@/services/clinical'
import type { Consultation } from '@/types/database'
import { DemoNotice } from './DoctorPatientsPage'

type FollowUpRow = Consultation & {
  patients?: { id?: string; first_name?: string; last_name?: string; access_code?: string } | null
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export function DoctorAppointmentsPage() {
  const { isDemoMode } = useAuth()
  const navigate = useNavigate()
  const [rows, setRows] = useState<FollowUpRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'overdue'>('all')

  const load = useCallback(async () => {
    if (isDemoMode) return
    setLoading(true)
    setError('')
    try {
      const consultations = (await listConsultations({ mine: true })) as FollowUpRow[]
      setRows(
        consultations
          .filter((item) => Boolean(item.follow_up_date))
          .sort((a, b) => String(a.follow_up_date).localeCompare(String(b.follow_up_date))),
      )
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Chargement impossible.')
    } finally {
      setLoading(false)
    }
  }, [isDemoMode])

  useEffect(() => {
    void load()
  }, [load])

  const today = todayIso()
  const visible = useMemo(() => {
    if (filter === 'upcoming') return rows.filter((row) => (row.follow_up_date || '') >= today)
    if (filter === 'overdue') return rows.filter((row) => (row.follow_up_date || '') < today)
    return rows
  }, [filter, rows, today])

  const overdueCount = rows.filter((row) => (row.follow_up_date || '') < today).length
  const upcomingCount = rows.filter((row) => (row.follow_up_date || '') >= today).length

  if (isDemoMode) return <DemoNotice title="Les rendez-vous / suivis nécessitent Supabase." />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-primary">
          <CalendarDays className="h-6 w-6 text-secondary" />
          Rendez-vous
        </h1>
        <p className="mt-1 text-sm text-primary/60">
          Suivis planifiés à la clôture des consultations (V0 — pas encore d’agenda)
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat
          label="À venir"
          value={upcomingCount}
          active={filter === 'upcoming'}
          onClick={() => setFilter('upcoming')}
        />
        <Stat
          label="En retard"
          value={overdueCount}
          alert
          active={filter === 'overdue'}
          onClick={() => setFilter('overdue')}
        />
        <Stat
          label="Tous"
          value={rows.length}
          active={filter === 'all'}
          onClick={() => setFilter('all')}
        />
      </div>

      <div className="card">
        {error && <p className="mb-3 text-sm text-red-700">{error}</p>}
        <div className="divide-y divide-primary/10">
          {loading && (
            <p className="py-5 text-sm text-primary/60">
              <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
              Chargement…
            </p>
          )}
          {!loading && visible.length === 0 && (
            <p className="py-5 text-sm text-primary/60">Aucun suivi planifié pour ce filtre.</p>
          )}
          {visible.map((row) => {
            const overdue = (row.follow_up_date || '') < today
            const name = row.patients
              ? `${row.patients.last_name || ''} ${row.patients.first_name || ''}`.trim()
              : 'Patient'
            return (
              <button
                key={row.id}
                type="button"
                onClick={() => navigate(`/doctor/consultations/${row.id}`)}
                className="flex w-full items-start justify-between gap-3 py-4 text-left hover:bg-primary/[.02]"
              >
                <span>
                  <span className="block font-semibold text-primary">{name || 'Patient'}</span>
                  <span className="mt-0.5 block text-sm text-primary/60">
                    {row.motif || 'Sans motif'}
                    {row.follow_up_notes ? ` · ${row.follow_up_notes}` : ''}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                      overdue ? 'bg-red-50 text-red-700' : 'bg-secondary/15 text-secondary'
                    }`}
                  >
                    {overdue && <AlertTriangle className="h-3.5 w-3.5" />}
                    {row.follow_up_date
                      ? new Date(`${row.follow_up_date}T00:00:00`).toLocaleDateString('fr-FR')
                      : '—'}
                  </span>
                  <span className="mt-1 block text-xs text-primary/50">
                    {overdue ? 'En retard' : 'À venir'}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  alert,
  active,
  onClick,
}: {
  label: string
  value: number
  alert?: boolean
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`card text-left transition ${
        active ? 'ring-2 ring-secondary' : 'hover:bg-primary/[.02]'
      }`}
    >
      <p className="text-sm text-primary/60">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${alert ? 'text-accent' : 'text-primary'}`}>{value}</p>
    </button>
  )
}
