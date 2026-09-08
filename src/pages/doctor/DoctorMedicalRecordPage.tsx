import { useCallback, useEffect, useState } from 'react'
import { FolderHeart, Loader2, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { searchPatients } from '@/services/clinical'
import type { Patient } from '@/types/database'
import { DemoNotice } from './DoctorPatientsPage'

/** Hub Dossier médical → ouvre la fiche patient existante */
export function DoctorMedicalRecordPage() {
  const { isDemoMode } = useAuth()
  const navigate = useNavigate()
  const [patients, setPatients] = useState<Patient[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(
    async (term = '') => {
      if (isDemoMode) return
      setLoading(true)
      setError('')
      try {
        setPatients(await searchPatients({ query: term, limit: 30 }))
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Recherche impossible.')
      } finally {
        setLoading(false)
      }
    },
    [isDemoMode],
  )

  useEffect(() => {
    void load()
  }, [load])

  if (isDemoMode) return <DemoNotice title="Le dossier médical nécessite Supabase." />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-primary">
          <FolderHeart className="h-6 w-6 text-secondary" />
          Dossier médical
        </h1>
        <p className="mt-1 text-sm text-primary/60">
          Recherchez un patient pour consulter ou modifier son dossier clinique
        </p>
      </div>

      <div className="card">
        <label className="relative block">
          <Search className="absolute left-3 top-3 h-4 w-4 text-primary/50" />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              void load(event.target.value)
            }}
            placeholder="Nom, prénom ou code patient"
            className="w-full rounded-lg border border-primary/15 py-2 pl-9 pr-3 text-sm outline-none focus:border-secondary"
          />
        </label>
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
        <div className="mt-4 divide-y divide-primary/10">
          {loading && (
            <p className="py-5 text-sm text-primary/60">
              <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
              Chargement…
            </p>
          )}
          {!loading && patients.length === 0 && (
            <p className="py-5 text-sm text-primary/60">Aucun dossier trouvé.</p>
          )}
          {patients.map((patient) => (
            <button
              key={patient.id}
              type="button"
              onClick={() =>
                navigate(`/doctor/patients/${patient.id}`, { state: { from: 'dossier' } })
              }
              className="flex w-full items-center justify-between py-4 text-left hover:bg-primary/[.02]"
            >
              <span>
                <span className="block font-semibold text-primary">
                  {patient.last_name} {patient.first_name}
                </span>
                <span className="text-sm text-primary/60">
                  {patient.birth_date || 'Date de naissance non renseignée'}
                </span>
              </span>
              <code className="text-sm font-semibold text-secondary">{patient.access_code}</code>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
