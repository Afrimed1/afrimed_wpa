import { useCallback, useEffect, useState } from 'react'
import { ArrowRight, Clock, FlaskConical, Inbox, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { listLabRequests, type LabRequest } from '@/services/clinical'

export function LabDashboard() {
  const { isDemoMode } = useAuth()
  const [requests, setRequests] = useState<LabRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

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

  const pending = requests.filter((request) => request.status === 'pending').length
  const inProgress = requests.filter((request) => request.status === 'in_progress').length
  const recent = requests.slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Tableau de bord</h1>
        <p className="mt-1 text-sm text-primary/60">
          Demandes d&apos;examens en attente de traitement
        </p>
      </div>

      {isDemoMode && <SupabaseNotice />}
      {error && <ErrorNotice message={error} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
              <Inbox className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm text-primary/60">En attente</p>
              <p className="text-2xl font-bold text-accent">{pending}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10">
              <Clock className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-primary/60">En cours</p>
              <p className="text-2xl font-bold text-primary">{inProgress}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-secondary" />
            <h2 className="font-semibold text-primary">Demandes récentes</h2>
          </div>
          <Link to="/lab/requests" className="inline-flex items-center gap-1 text-sm font-medium text-secondary hover:underline">
            Voir les demandes <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-secondary" /></div>
        ) : recent.length === 0 ? (
          <p className="text-sm text-primary/50">Aucune demande récente.</p>
        ) : (
          <div className="divide-y divide-primary-100">
            {recent.map((request) => (
              <div key={request.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-primary">{request.lab_exam_types?.name ?? 'Examen de laboratoire'}</p>
                  <p className="text-primary/60">{patientName(request)} · {formatDate(request.created_at)}</p>
                </div>
                <StatusBadge status={request.status} />
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value))
}

function StatusBadge({ status }: { status: LabRequest['status'] }) {
  const labels = { pending: 'En attente', in_progress: 'En cours', completed: 'Terminé', cancelled: 'Annulé' }
  return <span className="rounded-full bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary/70">{labels[status]}</span>
}

function SupabaseNotice() {
  return <div className="card border-secondary-200 bg-secondary-50 text-sm text-primary-700">Supabase est requis pour afficher les demandes réelles du laboratoire.</div>
}

function ErrorNotice({ message }: { message: string }) {
  return <div className="rounded-xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent">{message}</div>
}
