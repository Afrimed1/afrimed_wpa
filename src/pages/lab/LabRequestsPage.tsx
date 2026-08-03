import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { completeLabRequest, listLabRequests, type LabRequest } from '@/services/clinical'

export function LabRequestsPage() {
  const { isDemoMode } = useAuth()
  const [requests, setRequests] = useState<LabRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [resultText, setResultText] = useState('')
  const [submittingId, setSubmittingId] = useState<string | null>(null)

  const loadRequests = useCallback(async () => {
    if (isDemoMode) {
      setIsLoading(false)
      return
    }
    try {
      setError('')
      setRequests(await listLabRequests())
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Impossible de charger les demandes.')
    } finally {
      setIsLoading(false)
    }
  }, [isDemoMode])

  useEffect(() => {
    void loadRequests()
  }, [loadRequests])

  const submitResult = async (event: React.FormEvent, requestId: string) => {
    event.preventDefault()
    if (!resultText.trim()) return
    setSubmittingId(requestId)
    setError('')
    try {
      await completeLabRequest(requestId, { result_text: resultText.trim(), status: 'completed' })
      setActiveId(null)
      setResultText('')
      await loadRequests()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Enregistrement du résultat impossible.')
    } finally {
      setSubmittingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Demandes d&apos;examens</h1>
        <p className="mt-1 text-sm text-primary/60">
          Réception et saisie des résultats de laboratoire
        </p>
      </div>
      {isDemoMode && <div className="card border-secondary-200 bg-secondary-50 text-sm text-primary-700">Supabase est requis pour afficher et traiter les demandes réelles du laboratoire.</div>}
      {error && <div className="rounded-xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent">{error}</div>}

      <div className="card overflow-hidden p-0">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-secondary" /></div>
        ) : requests.length === 0 ? (
          <p className="px-5 py-10 text-sm text-primary/50">Aucune demande à afficher.</p>
        ) : (
          <div className="divide-y divide-primary-100">
            {requests.map((request) => (
              <div key={request.id} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-primary">{request.lab_exam_types?.name ?? 'Examen de laboratoire'}</h2>
                    <p className="mt-1 text-sm text-primary/60">
                      {patientName(request)} · Prescrit par {doctorName(request)} · {formatDate(request.created_at)}
                    </p>
                  </div>
                  <StatusBadge status={request.status} />
                </div>
                {request.status === 'completed' && request.result_text && (
                  <p className="mt-3 rounded-lg bg-primary/5 px-3 py-2 text-sm text-primary/75">{request.result_text}</p>
                )}
                {(request.status === 'pending' || request.status === 'in_progress') && (
                  activeId === request.id ? (
                    <form onSubmit={(event) => void submitResult(event, request.id)} className="mt-4 space-y-3">
                      <label className="block text-sm font-medium text-primary">Résultat</label>
                      <textarea className="input-field min-h-28" required value={resultText} onChange={(event) => setResultText(event.target.value)} />
                      <div className="flex gap-3">
                        <button type="submit" disabled={submittingId === request.id} className="btn-primary">
                          {submittingId === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                          Valider le résultat
                        </button>
                        <button type="button" onClick={() => { setActiveId(null); setResultText('') }} className="btn-outline">Annuler</button>
                      </div>
                    </form>
                  ) : (
                    <button type="button" onClick={() => setActiveId(request.id)} className="btn-outline mt-4">Saisir le résultat</button>
                  )
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function patientName(request: LabRequest) {
  return request.patients ? `${request.patients.first_name} ${request.patients.last_name}` : 'Patient non renseigné'
}

function doctorName(request: LabRequest) {
  const doctor = request.requested_by_profile
  return doctor ? `${doctor.first_name} ${doctor.last_name}` : 'Médecin non renseigné'
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value))
}

function StatusBadge({ status }: { status: LabRequest['status'] }) {
  const labels = { pending: 'En attente', in_progress: 'En cours', completed: 'Terminé', cancelled: 'Annulé' }
  return <span className="rounded-full bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary/70">{labels[status]}</span>
}
