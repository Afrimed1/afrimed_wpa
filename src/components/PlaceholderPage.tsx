import { Construction } from 'lucide-react'

interface PlaceholderPageProps {
  title: string
  description: string
  phase?: string
}

export function PlaceholderPage({
  title,
  description,
  phase = 'Phase 1+',
}: PlaceholderPageProps) {
  return (
    <div className="card flex min-h-[320px] flex-col items-center justify-center text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/10">
        <Construction className="h-8 w-8 text-secondary" />
      </div>
      <h2 className="text-xl font-semibold text-primary">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-primary/65">
        {description}
      </p>
      <span className="mt-4 inline-flex rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
        Disponible en {phase}
      </span>
    </div>
  )
}
