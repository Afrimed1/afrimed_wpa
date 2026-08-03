import { useCallback, useEffect, useState } from 'react'
import { Calendar, Loader2, MessageSquareText } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { patientPortal, type PatientPortalData } from '@/services/clinical'

export function PatientSuiviPage() {
  const { user, isDemoMode } = useAuth()
  const [portal, setPortal] = useState<PatientPortalData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadPortal = useCallback(async () => {
    if (isDemoMode || !user?.patientCode) {
      setIsLoading(false)
      return
    }
    try {
      setError('')
      setPortal(await patientPortal(user.patientCode))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Impossible de charger votre suivi.')
    } finally {
      setIsLoading(false)
    }
  }, [isDemoMode, user?.patientCode])

  useEffect(() => {
    void loadPortal()
  }, [loadPortal])

  const followUp = portal?.followUp[0]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Suivi</h1>
        <p className="mt-1 text-sm text-primary/60">
          Rendez-vous et consignes de suivi thérapeutique
        </p>
      </div>
      {isDemoMode && <div className="card border-secondary-200 bg-secondary-50 text-sm text-primary-700">Supabase est requis pour consulter les informations de suivi réelles.</div>}
      {error && <div className="rounded-xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent">{error}</div>}

      {isLoading ? (
        <div className="card flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-secondary" /></div>
      ) : followUp ? (
        <div className="space-y-4">
          <section className="card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10">
                <Calendar className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-primary/60">Prochain rendez-vous</p>
                <p className="font-semibold text-primary">{followUp.date ? formatDate(followUp.date) : 'Date non programmée'}</p>
              </div>
            </div>
          </section>
          <section className="card">
            <div className="flex items-center gap-2">
              <MessageSquareText className="h-5 w-5 text-secondary" />
              <h2 className="font-semibold text-primary">Consignes de suivi</h2>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm text-primary/70">{followUp.notes || 'Aucune consigne renseignée.'}</p>
          </section>
        </div>
      ) : <div className="card text-sm text-primary/50">Aucun suivi programmé.</div>}
    </div>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date(value))
}
