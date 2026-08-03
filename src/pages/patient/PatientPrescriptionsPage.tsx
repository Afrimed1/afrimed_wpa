import { useCallback, useEffect, useState } from 'react'
import { FileText, Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { patientPortal, type PatientPortalData } from '@/services/clinical'

export function PatientPrescriptionsPage() {
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
      setError(loadError instanceof Error ? loadError.message : 'Impossible de charger les ordonnances.')
    } finally {
      setIsLoading(false)
    }
  }, [isDemoMode, user?.patientCode])

  useEffect(() => {
    void loadPortal()
  }, [loadPortal])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Ordonnances</h1>
        <p className="mt-1 text-sm text-primary/60">
          Vos prescriptions et traitements en cours
        </p>
      </div>
      {isDemoMode && <div className="card border-secondary-200 bg-secondary-50 text-sm text-primary-700">Supabase est requis pour consulter vos ordonnances réelles.</div>}
      {error && <div className="rounded-xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent">{error}</div>}

      {isLoading ? (
        <div className="card flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-secondary" /></div>
      ) : portal?.prescriptions.length ? (
        <div className="space-y-4">
          {portal.prescriptions.map((prescription) => (
            <article key={`${prescription.date}-${prescription.notes}`} className="card">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-secondary" />
                <h2 className="font-semibold text-primary">Ordonnance du {formatDate(prescription.date)}</h2>
              </div>
              {prescription.notes && <p className="mt-3 text-sm text-primary/70">{prescription.notes}</p>}
              <ul className="mt-4 divide-y divide-primary-100">
                {prescription.items.map((item) => (
                  <li key={`${item.prescription_id}-${item.medication_name}`} className="py-3 text-sm">
                    <p className="font-medium text-primary">{item.medication_name}</p>
                    <p className="text-primary/60">{item.posology}{item.duration ? ` · ${item.duration}` : ''}</p>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      ) : <div className="card text-sm text-primary/50">Aucune ordonnance disponible.</div>}
    </div>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date(value))
}
