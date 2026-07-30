import { PlaceholderPage } from '@/components/PlaceholderPage'

export function PatientSuiviPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Suivi</h1>
        <p className="mt-1 text-sm text-primary/60">
          Rendez-vous et consignes de suivi thérapeutique
        </p>
      </div>
      <PlaceholderPage
        title="Suivi thérapeutique"
        description="Date du prochain rendez-vous et consignes laissées par votre médecin. Disponible en Phase 7."
        phase="Phase 7"
      />
    </div>
  )
}
