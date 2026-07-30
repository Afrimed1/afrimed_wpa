import { Clock, FlaskConical, Inbox } from 'lucide-react'

export function LabDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Tableau de bord</h1>
        <p className="mt-1 text-sm text-primary/60">
          Demandes d&apos;examens en attente de traitement
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
              <Inbox className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm text-primary/60">En attente</p>
              <p className="text-2xl font-bold text-accent">0</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10">
              <Clock className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-primary/60">Traitées aujourd&apos;hui</p>
              <p className="text-2xl font-bold text-primary">0</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="mb-4 flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-secondary" />
          <h2 className="font-semibold text-primary">Demandes récentes</h2>
        </div>
        <p className="text-sm text-primary/50">
          Aucune demande en attente. Le flux médecin → laboratoire sera
          disponible en Phase 6.
        </p>
      </div>
    </div>
  )
}
