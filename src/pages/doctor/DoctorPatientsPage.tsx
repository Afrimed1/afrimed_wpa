import { PlaceholderPage } from '@/components/PlaceholderPage'

export function DoctorPatientsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Patients</h1>
        <p className="mt-1 text-sm text-primary/60">
          Recherche et création de dossiers patients
        </p>
      </div>
      <PlaceholderPage
        title="Recherche et dossiers patients"
        description="Recherchez un patient par nom ou code, créez un nouveau dossier avec génération automatique du code patient. Disponible en Phase 2."
        phase="Phase 2"
      />
    </div>
  )
}
