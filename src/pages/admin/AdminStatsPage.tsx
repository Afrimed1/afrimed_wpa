import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, BarChart3, Loader2, Stethoscope, Users } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { adminStats, type AdminStats } from '@/services/clinical'

export function AdminStatsPage() {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Statistiques</h1>
        <p className="mt-1 text-sm text-primary/60">
          Pathologies fréquentes et indicateurs d&apos;activité
        </p>
      </div>
      {isDemoMode && <div className="card border-secondary-200 bg-secondary-50 text-sm text-primary-700">Supabase est requis pour afficher les statistiques réelles de l&apos;établissement.</div>}
      {error && <div className="rounded-xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent">{error}</div>}

      {isLoading ? (
        <div className="card flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-secondary" /></div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Consultations" value={stats?.consultations ?? 0} icon={Stethoscope} />
            <StatCard label="Patients" value={stats?.patients ?? 0} icon={Users} />
            <StatCard label="Suivis en retard" value={stats?.overdueFollowUps ?? 0} icon={AlertTriangle} alert />
            <StatCard label="Utilisateurs actifs" value={stats?.activeStaff ?? 0} icon={Users} />
          </div>
          <section className="card">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-secondary" />
              <h2 className="font-semibold text-primary">Pathologies les plus fréquentes</h2>
            </div>
            {stats?.topPathologies.length ? (
              <div className="mt-4 divide-y divide-primary-100">
                {stats.topPathologies.map((pathology) => (
                  <div key={pathology.diagnosis} className="flex items-center justify-between py-3 text-sm">
                    <span className="font-medium text-primary">{pathology.diagnosis}</span>
                    <span className="text-primary/60">{pathology.count} consultation(s)</span>
                  </div>
                ))}
              </div>
            ) : <p className="mt-4 text-sm text-primary/50">Aucune pathologie renseignée.</p>}
          </section>
        </>
      )}
    </div>
  )
}

function StatCard({ label, value, icon: Icon, alert = false }: { label: string; value: number; icon: typeof Users; alert?: boolean }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div><p className="text-sm text-primary/60">{label}</p><p className={`mt-2 text-3xl font-bold ${alert ? 'text-accent' : 'text-primary'}`}>{value}</p></div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${alert ? 'bg-accent/10' : 'bg-primary/5'}`}><Icon className={`h-5 w-5 ${alert ? 'text-accent' : 'text-primary/60'}`} /></div>
      </div>
    </div>
  )
}
