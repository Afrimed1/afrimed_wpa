import { Loader2 } from 'lucide-react'

interface LoadingScreenProps {
  message?: string
}

export function LoadingScreen({
  message = 'Chargement…',
}: LoadingScreenProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-6">
      <Loader2 className="h-10 w-10 animate-spin text-secondary" />
      <p className="mt-4 text-sm text-primary-600">{message}</p>
    </div>
  )
}
