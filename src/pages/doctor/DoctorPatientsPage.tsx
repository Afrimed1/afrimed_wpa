import { useCallback, useEffect, useState } from 'react'
import { Check, Copy, Loader2, Search } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { searchPatients } from '@/services/clinical'
import type { Patient } from '@/types/database'

export function DoctorPatientsPage() {
  const { isDemoMode } = useAuth()
  const navigate = useNavigate()
  const [patients, setPatients] = useState<Patient[]>([])
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [copiedId, setCopiedId] = useState('')

  const loadPatients = useCallback(
    async (term = '') => {
      if (isDemoMode) return
      setIsLoading(true)
      setError('')
      try {
        setPatients(await searchPatients({ query: term }))
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Recherche impossible.')
      } finally {
        setIsLoading(false)
      }
    },
    [isDemoMode],
  )

  useEffect(() => {
    void loadPatients()
  }, [loadPatients])

  if (isDemoMode) return <DemoNotice title="Les dossiers patients nécessitent Supabase." />

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Patients</h1>
          <p className="mt-1 text-sm text-primary/60">Liste des patients enregistrés</p>
        </div>
        <Link
          to="/doctor/nouveau-patient"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          Nouveau patient
        </Link>
      </div>

      <div className="card">
        <label className="relative block">
          <Search className="absolute left-3 top-3 h-4 w-4 text-primary/50" />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              void loadPatients(event.target.value)
            }}
            placeholder="Nom, prénom ou code patient"
            className="w-full rounded-lg border border-primary/15 py-2 pl-9 pr-3 text-sm outline-none focus:border-secondary"
          />
        </label>
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
        <div className="mt-4 divide-y divide-primary/10">
          {isLoading && (
            <p className="py-5 text-sm text-primary/60">
              <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
              Chargement…
            </p>
          )}
          {!isLoading && patients.length === 0 && (
            <p className="py-5 text-sm text-primary/60">Aucun patient trouvé.</p>
          )}
          {patients.map((patient) => (
            <div
              key={patient.id}
              className="flex w-full items-center justify-between gap-3 py-4"
            >
              <button
                type="button"
                onClick={() => navigate(`/doctor/patients/${patient.id}`)}
                className="min-w-0 flex-1 text-left hover:opacity-80"
              >
                <span className="block font-semibold text-primary">
                  {patient.last_name} {patient.first_name}
                </span>
                <span className="text-sm text-primary/60">
                  {patient.birth_date || 'Date de naissance non renseignée'}
                </span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(patient.access_code)
                  setCopiedId(patient.id)
                }}
                className="inline-flex items-center gap-1 text-sm font-semibold text-secondary"
                title="Copier le code"
              >
                {copiedId === patient.id ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <code>{patient.access_code}</code>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function DemoNotice({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Espace médecin</h1>
      </div>
      <div className="card border-secondary-200 bg-secondary-50">
        <p className="font-semibold text-primary">{title}</p>
        <p className="mt-2 text-sm text-primary/70">
          Configurez Supabase pour accéder aux données cliniques et aux workflows médicaux.
        </p>
      </div>
    </div>
  )
}
