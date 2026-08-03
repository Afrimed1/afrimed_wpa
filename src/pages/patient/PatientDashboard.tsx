import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { AlertTriangle, Calendar, FileText, Heart, Loader2 } from 'lucide-react'
import { patientPortal, type PatientPortalData } from '@/services/clinical'

export function PatientDashboard() {
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
      setError(loadError instanceof Error ? loadError.message : 'Impossible de charger votre dossier.')
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
        <h1 className="text-2xl font-bold text-primary">Mon dossier</h1>
        <p className="mt-1 text-sm text-primary/60">
          Consultation en lecture seule de vos informations médicales
        </p>
      </div>

      {isDemoMode && <div className="card border-secondary-200 bg-secondary-50 text-sm text-primary-700">Supabase est requis pour consulter votre dossier médical réel.</div>}
      {error && <div className="rounded-xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent">{error}</div>}

      {user?.patientCode && (
        <div className="rounded-2xl border border-secondary/20 bg-secondary/5 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-secondary-700">
            Votre code patient
          </p>
          <p className="mt-1 font-mono text-xl font-bold tracking-widest text-primary">
            {user.patientCode}
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
              <AlertTriangle className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm text-primary/60">Allergies déclarées</p>
              <p className="font-semibold text-primary">{isLoading ? 'Chargement…' : portal?.allergies.length ?? 0}</p>
            </div>
          </div>
          {!isLoading && portal?.allergies.length ? (
            <p className="mt-3 text-sm text-primary/70">
              {portal.allergies.map((allergy) => allergy.substance).join(', ')}
            </p>
          ) : null}
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10">
              <Heart className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-primary/60">Traitements en cours</p>
              <p className="font-semibold text-primary">{isLoading ? 'Chargement…' : portal?.chronic.treatments || 'Aucun traitement renseigné'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="mb-3 flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary/50" />
          <h2 className="font-semibold text-primary">Dernières consultations</h2>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-secondary" /></div>
        ) : portal?.pastConsultations.length ? (
          <div className="divide-y divide-primary-100">
            {portal.pastConsultations.slice(0, 5).map((consultation) => (
              <div key={`${consultation.date}-${consultation.motif}`} className="py-3 text-sm">
                <p className="font-medium text-primary">{consultation.motif || 'Consultation'}</p>
                <p className="mt-1 text-primary/60">{formatDate(consultation.date)} · {consultation.diagnosis || 'Diagnostic non renseigné'}</p>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-primary/50">Aucune consultation récente.</p>}
      </div>

      <div className="card border-secondary/20 bg-secondary/5">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-secondary" />
          <div>
            <p className="font-semibold text-primary">Prochain rendez-vous</p>
            <p className="text-sm text-primary/60">{nextFollowUp(portal) ? formatDate(nextFollowUp(portal)!) : 'Non programmé'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function nextFollowUp(portal: PatientPortalData | null) {
  return portal?.followUp
    .map((followUp) => followUp.date)
    .filter((date): date is string => Boolean(date))
    .filter((date) => new Date(date) >= new Date())
    .sort()[0]
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value))
}
