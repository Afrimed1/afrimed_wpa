import {
  AlertTriangle,
  BarChart3,
  TrendingUp,
  Users,
} from 'lucide-react'

const stats = [
  { label: 'Consultations (semaine)', value: '—', icon: TrendingUp },
  { label: 'Utilisateurs actifs', value: '—', icon: Users },
  { label: 'Suivis en retard', value: '—', icon: AlertTriangle, alert: true },
  { label: 'Pathologies fréquentes', value: '—', icon: BarChart3 },
]

export function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Tableau de bord</h1>
        <p className="mt-1 text-sm text-primary/60">
          Vue synthétique de l&apos;activité de l&apos;établissement
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, alert }) => (
          <div key={label} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-primary/60">{label}</p>
                <p
                  className={`mt-2 text-3xl font-bold ${
                    alert ? 'text-accent' : 'text-primary'
                  }`}
                >
                  {value}
                </p>
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
          <h2 className="font-semibold text-primary">Activité récente</h2>
          <p className="mt-4 text-sm text-primary/50">
            Les statistiques seront alimentées à partir de la Phase 2.
          </p>
        </div>
        <div className="card">
          <h2 className="font-semibold text-primary">Suivis en retard</h2>
          <p className="mt-4 text-sm text-primary/50">
            Aucune alerte pour le moment — données de démonstration.
          </p>
        </div>
      </div>
    </div>
  )
}
