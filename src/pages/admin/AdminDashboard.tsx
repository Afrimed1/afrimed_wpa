import {
  AlertTriangle,
  BarChart3,
  ClipboardList,
  Loader2,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { adminStats, type AdminStats } from '@/services/clinical'

export function AdminDashboard() {
  const { isDemoMode } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadStats = useCallback(async () => {
    if (isDemoMode) {
      setIsLoading(false)
      return
    }
    try {
      setError('')
      setStats(await adminStats())
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Impossible de charger les statistiques.')
    } finally {
      setIsLoading(false)
    }
  }, [isDemoMode])

  useEffect(() => {
    void loadStats()
  }, [loadStats])

  const cards = [
    { label: 'Consultations', value: stats?.consultations ?? 0, icon: TrendingUp },
    { label: 'Utilisateurs actifs', value: stats?.activeStaff ?? 0, icon: Users },
    { label: 'Suivis en retard', value: stats?.overdueFollowUps ?? 0, icon: AlertTriangle, alert: true },
    { label: 'Demandes laboratoire', value: stats?.pendingLabs ?? 0, icon: ClipboardList },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Tableau de bord</h1>
        <p className="mt-1 text-sm text-primary/60">
          Vue synthétique de l&apos;activité de l&apos;établissement
        </p>
      </div>

      {isDemoMode && <div className="card border-secondary-200 bg-secondary-50 text-sm text-primary-700">Supabase est requis pour afficher les statistiques réelles de l&apos;établissement.</div>}
      {error && <div className="rounded-xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, alert }) => (
          <div key={label} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-primary/60">{label}</p>
                <p className={`mt-2 text-3xl font-bold ${alert ? 'text-accent' : 'text-primary'}`}>{isLoading ? '-' : value}</p>
              </div>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  alert ? 'bg-accent/10' : 'bg-primary/5'
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${alert ? 'text-accent' : 'text-primary/60'}`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-secondary" />
            <h2 className="font-semibold text-primary">Pathologies fréquentes</h2>
          </div>
          {isLoading ? <Loader2 className="mt-5 h-6 w-6 animate-spin text-secondary" /> : stats?.topPathologies.length ? (
            <ol className="mt-4 space-y-3 text-sm">
              {stats.topPathologies.map((pathology) => <li key={pathology.diagnosis} className="flex justify-between gap-4"><span className="text-primary">{pathology.diagnosis}</span><span className="font-medium text-primary/60">{pathology.count}</span></li>)}
            </ol>
          ) : <p className="mt-4 text-sm text-primary/50">Aucune pathologie renseignée.</p>}
        </div>
        <div className="card">
          <h2 className="font-semibold text-primary">Suivis en retard</h2>
          <p className="mt-4 text-sm text-primary/60">{isLoading ? 'Chargement…' : stats?.overdueFollowUps ? `${stats.overdueFollowUps} suivi(s) nécessitent une relance.` : 'Aucun suivi en retard.'}</p>
        </div>
      </div>
    </div>
  )
}
