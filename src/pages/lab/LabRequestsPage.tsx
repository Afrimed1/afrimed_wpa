import { PlaceholderPage } from '@/components/PlaceholderPage'

export function LabRequestsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Demandes d&apos;examens</h1>
        <p className="mt-1 text-sm text-primary/60">
          Réception et saisie des résultats de laboratoire
        </p>
      </div>
      <PlaceholderPage
        title="Flux laboratoire"
        description="Recevez les demandes des médecins, saisissez les résultats et notifiez le prescripteur en temps réel. Disponible en Phase 6."
        phase="Phase 6"
      />
    </div>
  )
}
