import {
  AlertCircle,
  Calendar,
  FlaskConical,
  Loader2,
  Plus,
  Stethoscope,
  UserSearch,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { doctorDashboard } from '@/services/clinical'
import type { DoctorDashboard as DashboardData } from '@/services/clinical'

const quickActions = [
  {
    label: 'Rechercher un patient',
    icon: UserSearch,
    path: '/doctor/patients',
    color: 'bg-primary/5 text-primary',
  },
  {
    label: 'Nouveau dossier',
    icon: Plus,
    path: '/doctor/patients',
    color: 'bg-secondary/10 text-secondary',
  },
  {
    label: 'Nouvelle consultation',
    icon: Stethoscope,
    path: '/doctor/consultations',
    color: 'bg-secondary/10 text-secondary',
  },
]

export function DoctorDashboard() {
  const { isDemoMode } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    if (isDemoMode) return
    try { setData(await doctorDashboard()) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Tableau de bord indisponible.') }
  }, [isDemoMode])
  useEffect(() => { void load() }, [load])

  if (isDemoMode) {
    return <div className="space-y-6"><div><h1 className="text-2xl font-bold text-primary">Tableau de bord</h1></div><div className="card border-secondary-200 bg-secondary-50"><p className="font-semibold text-primary">Les fonctionnalités cliniques nécessitent Supabase.</p><p className="mt-2 text-sm text-primary/70">Configurez Supabase pour accéder aux consultations, dossiers et résultats biologiques.</p></div></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Tableau de bord</h1>
        <p className="mt-1 text-sm text-primary/60">
          Consultations du jour et alertes prioritaires
        </p>
      </div>

      {error && <div className="card text-sm text-red-700">{error}</div>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5">
              <Calendar className="h-5 w-5 text-primary/60" />
            </div>
            <div>
              <p className="text-sm text-primary/60">Consultations aujourd&apos;hui</p>
              <p className="text-2xl font-bold text-primary">{data ? data.consultationsToday : <Loader2 className="h-5 w-5 animate-spin" />}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
              <FlaskConical className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm text-primary/60">Résultats labo en attente</p>
              <p className="text-2xl font-bold text-accent">{data?.awaitingLabs ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
              <AlertCircle className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm text-primary/60">Suivis en retard</p>
              <p className="text-2xl font-bold text-accent">{data?.overdueFollowUps ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10">
              <Calendar className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-primary/60">Consultations cette semaine</p>
              <p className="text-2xl font-bold text-primary">{data?.consultationsWeek ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-semibold text-primary">Accès rapide</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {quickActions.map(({ label, icon: Icon, color, path }) => (
            <button
              key={label}
              type="button"
              onClick={() => navigate(path)}
              className="card flex min-h-[88px] items-center gap-3 text-left transition hover:shadow-elevated"
            >
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-semibold text-primary">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold text-primary">Suivi de l&apos;activité</h2>
        <p className="mt-4 text-sm text-primary/60">
          {data?.inProgress ?? 0} consultation(s) en cours et {data?.deferred ?? 0} dossier(s) reporté(s).
        </p>
      </div>
    </div>
  )
}
