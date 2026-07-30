import { useAuth } from '@/context/AuthContext'
import { AlertTriangle, Calendar, FileText, Heart } from 'lucide-react'

export function PatientDashboard() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Mon dossier</h1>
        <p className="mt-1 text-sm text-primary/60">
          Consultation en lecture seule de vos informations médicales
        </p>
      </div>

      {user?.patientCode && (
        <div className="rounded-2xl border border-secondary/20 bg-secondary/5 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-secondary-700">
            Votre code patient
          </p>
          <p className="mt-1 font-mono text-xl font-bold tracking-widest text-primary">
            {user.patientCode}
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
              <AlertTriangle className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm text-primary/60">Allergies déclarées</p>
              <p className="font-semibold text-primary">—</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10">
              <Heart className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-primary/60">Traitements en cours</p>
              <p className="font-semibold text-primary">—</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="mb-3 flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary/50" />
          <h2 className="font-semibold text-primary">Dernières consultations</h2>
        </div>
        <p className="text-sm text-primary/50">
          Vos consultations passées apparaîtront ici en Phase 7.
        </p>
      </div>

      <div className="card border-secondary/20 bg-secondary/5">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-secondary" />
          <div>
            <p className="font-semibold text-primary">Prochain rendez-vous</p>
            <p className="text-sm text-primary/60">Non programmé</p>
          </div>
        </div>
      </div>
    </div>
  )
}
