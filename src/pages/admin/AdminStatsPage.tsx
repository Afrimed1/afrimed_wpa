import { PlaceholderPage } from '@/components/PlaceholderPage'

export function AdminStatsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Statistiques</h1>
        <p className="mt-1 text-sm text-primary/60">
          Pathologies fréquentes et indicateurs d&apos;activité
        </p>
      </div>
      <PlaceholderPage
        title="Statistiques établissement"
        description="Volume de consultations, répartition des pathologies diagnostiquées et qualité des dossiers. Disponible en Phase 8."
        phase="Phase 8"
      />
    </div>
  )
}
