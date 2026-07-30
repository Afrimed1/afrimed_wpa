import {
  AlertCircle,
  Calendar,
  FlaskConical,
  Plus,
  Stethoscope,
  UserSearch,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

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
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Tableau de bord</h1>
        <p className="mt-1 text-sm text-primary/60">
          Consultations du jour et alertes prioritaires
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5">
              <Calendar className="h-5 w-5 text-primary/60" />
            </div>
            <div>
              <p className="text-sm text-primary/60">Consultations aujourd&apos;hui</p>
              <p className="text-2xl font-bold text-primary">0</p>
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
              <p className="text-2xl font-bold text-accent">0</p>
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
              <p className="text-2xl font-bold text-accent">0</p>
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
        <h2 className="font-semibold text-primary">Consultations du jour</h2>
        <p className="mt-4 text-sm text-primary/50">
          Aucune consultation programmée, les données seront disponibles en
          Phase 2.
        </p>
      </div>
    </div>
  )
}
