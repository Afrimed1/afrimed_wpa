import { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { listConsultations } from '@/services/clinical'
import type { Consultation } from '@/types/database'
import { DemoNotice } from './DoctorPatientsPage'

const labels = { in_progress: 'En cours', awaiting_labs: 'En attente laboratoire', closed: 'Clôturée', deferred: 'Reportée' }
const colors = { in_progress: 'bg-primary/10 text-primary', awaiting_labs: 'bg-accent/15 text-accent', closed: 'bg-secondary/15 text-secondary', deferred: 'bg-red-50 text-red-700' }

export function DoctorConsultationsPage() {
  const { isDemoMode } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState<Consultation['status'] | ''>('')
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    if (isDemoMode) return
    setLoading(true); setError('')
    try { setConsultations(await listConsultations({ status: status || undefined, mine: true })) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Chargement impossible.') }
    finally { setLoading(false) }
  }, [isDemoMode, status])
  useEffect(() => { void load() }, [load])
  if (isDemoMode) return <DemoNotice title="Les consultations nécessitent Supabase." />
  return <div className="space-y-6"><div><h1 className="text-2xl font-bold text-primary">Consultations</h1><p className="mt-1 text-sm text-primary/60">Parcours guidé de la consultation médicale</p></div><div className="card"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold text-primary">Mes consultations</h2><label className="text-sm text-primary/70">Statut <select value={status} onChange={(event) => setStatus(event.target.value as Consultation['status'] | '')} className="ml-2 rounded-lg border border-primary/15 px-3 py-2"><option value="">Tous</option>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>{error && <p className="mt-4 text-sm text-red-700">{error}</p>}<div className="mt-4 divide-y divide-primary/10">{loading && <p className="py-5 text-sm text-primary/60"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Chargement…</p>}{!loading && consultations.length === 0 && <p className="py-5 text-sm text-primary/60">Aucune consultation trouvée.</p>}{consultations.map((consultation) => <button key={consultation.id} type="button" onClick={() => navigate(`/doctor/consultations/${consultation.id}`)} className="flex w-full items-center justify-between gap-3 py-4 text-left hover:bg-primary/[.02]"><span><span className="block font-semibold text-primary">{consultation.motif || 'Motif non renseigné'}</span><span className="text-sm text-primary/60">{new Date(consultation.started_at).toLocaleString('fr-FR')}</span></span><span className={`rounded-full px-3 py-1 text-xs font-semibold ${colors[consultation.status]}`}>{labels[consultation.status]}</span></button>)}</div></div></div>
}
