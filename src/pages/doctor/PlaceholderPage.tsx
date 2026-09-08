import { Construction } from 'lucide-react'

export function PlaceholderPage({
  title,
  description = 'Cette rubrique sera disponible dans une prochaine version.',
}: {
  title: string
  description?: string
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">{title}</h1>
        <p className="mt-1 text-sm text-primary/60">{description}</p>
      </div>
      <div className="card flex items-start gap-4 border-secondary-200 bg-secondary-50">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
          <Construction className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-primary">Rubrique non fonctionnelle pour l’instant</p>
          <p className="mt-1 text-sm text-primary/70">
            Le menu est déjà en place pour la navigation. Les écrans opérationnels de la V1 portent
            sur Accueil, Nouveau patient, Patients et Consultation.
          </p>
        </div>
      </div>
    </div>
  )
}
