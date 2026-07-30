import { PlaceholderPage } from '@/components/PlaceholderPage'

export function DoctorConsultationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Consultations</h1>
        <p className="mt-1 text-sm text-primary/60">
          Parcours guidé de la consultation médicale
        </p>
      </div>
      <PlaceholderPage
        title="Consultation guidée"
        description="Motif, constantes, revue des systèmes, examen physique, diagnostic et prescription. Disponible en Phase 3."
        phase="Phase 3"
      />
    </div>
  )
}
