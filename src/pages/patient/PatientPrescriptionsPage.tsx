import { PlaceholderPage } from '@/components/PlaceholderPage'

export function PatientPrescriptionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Ordonnances</h1>
        <p className="mt-1 text-sm text-primary/60">
          Vos prescriptions et traitements en cours
        </p>
      </div>
      <PlaceholderPage
        title="Historique des ordonnances"
        description="Consultez vos ordonnances passées et les médicaments prescrits. Disponible en Phase 7."
        phase="Phase 7"
      />
    </div>
  )
}
