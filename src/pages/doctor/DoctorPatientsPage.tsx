import { useCallback, useEffect, useState } from 'react'
import { Check, Copy, Loader2, Plus, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { createPatient, searchPatients } from '@/services/clinical'
import type { Patient } from '@/types/database'

type AllergyDraft = { substance: string; severity: 'mild' | 'moderate' | 'severe'; notes: null }
type PatientFormData = {
  first_name: string
  last_name: string
  birth_date: string
  age_years: string
  sex: 'M' | 'F' | 'U'
  phone: string
  emergency_contact_name: string
  emergency_contact_phone: string
  motif: string
  history_of_illness: string
  personal_history: string
  medical_history: string
  family_history: string
  chronic_treatments: string
}

const emptyForm = (): PatientFormData => ({
  first_name: '',
  last_name: '',
  birth_date: '',
  age_years: '',
  sex: 'U',
  phone: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  motif: '',
  history_of_illness: '',
  personal_history: '',
  medical_history: '',
  family_history: '',
  chronic_treatments: '',
})

function ageFromBirthDate(birthDate: string): string {
  if (!birthDate) return ''
  const birth = new Date(`${birthDate}T00:00:00`)
  if (Number.isNaN(birth.getTime())) return ''
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age -= 1
  return age >= 0 ? String(age) : ''
}

function birthDateFromAge(ageYears: number): string {
  const year = new Date().getFullYear() - ageYears
  return `${year}-01-01`
}

export function DoctorPatientsPage() {
  const { isDemoMode } = useAuth()
  const navigate = useNavigate()
  const [patients, setPatients] = useState<Patient[]>([])
  const [query, setQuery] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [allergies, setAllergies] = useState<AllergyDraft[]>([])
  const [showForm, setShowForm] = useState(false)
  const [createdCode, setCreatedCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const loadPatients = useCallback(async (term = '') => {
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
  }, [isDemoMode])

  useEffect(() => {
    void loadPatients()
  }, [loadPatients])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const patient = await createPatient({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        birth_date: form.birth_date || null,
        sex: form.sex,
        phone: form.phone || null,
        emergency_contact_name: form.emergency_contact_name || null,
        emergency_contact_phone: form.emergency_contact_phone || null,
        personal_history: form.personal_history,
        medical_history: form.medical_history,
        family_history: form.family_history,
        chronic_treatments: form.chronic_treatments,
        motif: form.motif.trim() || undefined,
        history_of_illness: form.history_of_illness.trim() || undefined,
        allergies: allergies
          .map((allergy) => ({
            substance: allergy.substance.trim(),
            severity: allergy.severity,
            notes: allergy.notes,
          }))
          .filter((allergy) => allergy.substance),
      })
      setCreatedCode(patient.access_code)
      if (patient.warning) setError(`Dossier créé, mais: ${patient.warning}`)
      setForm(emptyForm())
      setAllergies([])
      setShowForm(false)
      await loadPatients(query)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Création du dossier impossible.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isDemoMode) return <DemoNotice title="Les dossiers patients nécessitent Supabase." />

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Patients</h1>
          <p className="mt-1 text-sm text-primary/60">Recherche et création de dossiers patients</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((value) => !value)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          Nouveau dossier
        </button>
      </div>

      {createdCode && (
        <div className="card border-secondary-200 bg-secondary-50">
          <p className="text-sm font-semibold text-primary">Code d’accès patient</p>
          <div className="mt-2 flex items-center gap-3">
            <code className="text-xl font-bold tracking-widest text-secondary">{createdCode}</code>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(createdCode)
                setCopied(true)
              }}
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copié' : 'Copier'}
            </button>
          </div>
          <p className="mt-2 text-xs text-primary/60">Communiquez ce code au patient de façon confidentielle.</p>
        </div>
      )}

      {showForm && (
        <PatientForm
          form={form}
          setForm={setForm}
          allergies={allergies}
          setAllergies={setAllergies}
          onSubmit={submit}
          busy={isLoading}
          error={error}
        />
      )}

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
        {!showForm && error && <p className="mt-3 text-sm text-red-700">{error}</p>}
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
            <button
              key={patient.id}
              type="button"
              onClick={() => navigate(`/doctor/patients/${patient.id}`)}
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

function PatientForm({
  form,
  setForm,
  allergies,
  setAllergies,
  onSubmit,
  busy,
  error,
}: {
  form: PatientFormData
  setForm: React.Dispatch<React.SetStateAction<PatientFormData>>
  allergies: AllergyDraft[]
  setAllergies: React.Dispatch<React.SetStateAction<AllergyDraft[]>>
  onSubmit: (event: React.FormEvent) => Promise<void>
  busy: boolean
  error: string
}) {
  const field = (key: keyof PatientFormData, label: string, type = 'text', required = false) => (
    <label className="block text-sm font-medium text-primary">
      {label}
      <input
        required={required}
        type={type}
        value={form[key]}
        onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
        className="mt-1 w-full rounded-lg border border-primary/15 px-3 py-2 font-normal outline-none focus:border-secondary"
      />
    </label>
  )

  const setBirthDate = (value: string) => {
    setForm((current) => ({
      ...current,
      birth_date: value,
      age_years: ageFromBirthDate(value),
    }))
  }

  const setAgeYears = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    const age = Number(cleaned)
    setForm((current) => ({
      ...current,
      age_years: cleaned,
      birth_date: cleaned && age >= 0 && age <= 130 ? birthDateFromAge(age) : current.birth_date,
    }))
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="card space-y-5">
      <h2 className="font-semibold text-primary">Nouveau dossier patient</h2>
      {error && <p className="text-sm text-red-700">{error}</p>}

      <div className="grid gap-4 md:grid-cols-3">
        {field('first_name', 'Prénom', 'text', true)}
        {field('last_name', 'Nom', 'text', true)}
        <label className="block text-sm font-medium text-primary">
          Date de naissance
          <input
            type="date"
            value={form.birth_date}
            onChange={(event) => setBirthDate(event.target.value)}
            className="mt-1 w-full rounded-lg border border-primary/15 px-3 py-2 font-normal outline-none focus:border-secondary"
          />
        </label>
        <label className="block text-sm font-medium text-primary">
          Âge révolu (années)
          <input
            type="number"
            min={0}
            max={130}
            inputMode="numeric"
            placeholder="Ex. 45"
            value={form.age_years}
            onChange={(event) => setAgeYears(event.target.value)}
            className="mt-1 w-full rounded-lg border border-primary/15 px-3 py-2 font-normal outline-none focus:border-secondary"
          />
          <span className="mt-1 block text-xs font-normal text-primary/50">
            Remplit automatiquement la date (1er janvier de l’année calculée).
          </span>
        </label>
        <label className="text-sm font-medium text-primary">
          Sexe
          <select
            value={form.sex}
            onChange={(event) =>
              setForm((current) => ({ ...current, sex: event.target.value as 'M' | 'F' | 'U' }))
            }
            className="mt-1 w-full rounded-lg border border-primary/15 px-3 py-2 font-normal"
          >
            <option value="U">Non précisé</option>
            <option value="M">Masculin</option>
            <option value="F">Féminin</option>
          </select>
        </label>
        {field('phone', 'Téléphone')}
        {field('emergency_contact_name', 'Contact d’urgence')}
        {field('emergency_contact_phone', 'Téléphone urgence')}
      </div>

      <div className="space-y-4 border-t border-primary/10 pt-4">
        <label className="block text-sm font-medium text-primary">
          Motif de consultation
          <span className="mt-0.5 block text-xs font-normal text-primary/50">
            Ce qui amène à l’hôpital (douleur, fièvre, céphalées, etc.)
          </span>
          <input
            value={form.motif}
            onChange={(event) => setForm((current) => ({ ...current, motif: event.target.value }))}
            placeholder="Douleur, fièvre, céphalées…"
            className="mt-1 w-full rounded-lg border border-primary/15 px-3 py-2 font-normal outline-none focus:border-secondary"
          />
        </label>
        <label className="block text-sm font-medium text-primary">
          Histoire de la maladie
          <textarea
            value={form.history_of_illness}
            onChange={(event) =>
              setForm((current) => ({ ...current, history_of_illness: event.target.value }))
            }
            rows={6}
            className="mt-1 w-full rounded-lg border border-primary/15 px-3 py-2 font-normal outline-none focus:border-secondary"
          />
        </label>
      </div>

      <div className="space-y-3 border-t border-primary/10 pt-4">
        <h3 className="text-sm font-semibold text-primary">Antécédents</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-primary">
            Antécédents personnels
            <textarea
              value={form.personal_history}
              onChange={(event) =>
                setForm((current) => ({ ...current, personal_history: event.target.value }))
              }
              className="mt-1 min-h-24 w-full rounded-lg border border-primary/15 px-3 py-2 font-normal"
            />
          </label>
          <label className="text-sm font-medium text-primary">
            Antécédents médicaux
            <textarea
              value={form.medical_history}
              onChange={(event) =>
                setForm((current) => ({ ...current, medical_history: event.target.value }))
              }
              className="mt-1 min-h-24 w-full rounded-lg border border-primary/15 px-3 py-2 font-normal"
            />
          </label>
          <label className="text-sm font-medium text-primary">
            Antécédents familiaux
            <textarea
              value={form.family_history}
              onChange={(event) =>
                setForm((current) => ({ ...current, family_history: event.target.value }))
              }
              className="mt-1 min-h-24 w-full rounded-lg border border-primary/15 px-3 py-2 font-normal"
            />
          </label>
          <label className="text-sm font-medium text-primary">
            Traitements chroniques
            <textarea
              value={form.chronic_treatments}
              onChange={(event) =>
                setForm((current) => ({ ...current, chronic_treatments: event.target.value }))
              }
              className="mt-1 min-h-24 w-full rounded-lg border border-primary/15 px-3 py-2 font-normal"
            />
          </label>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-primary">Allergies</span>
          <button
            type="button"
            onClick={() =>
              setAllergies((items) => [...items, { substance: '', severity: 'mild', notes: null }])
            }
            className="text-sm font-semibold text-secondary"
          >
            Ajouter
          </button>
        </div>
        {allergies.map((allergy, index) => (
          <div key={index} className="mb-2 flex gap-2">
            <input
              placeholder="Substance"
              value={allergy.substance}
              onChange={(event) =>
                setAllergies((items) =>
                  items.map((item, i) =>
                    i === index ? { ...item, substance: event.target.value } : item,
                  ),
                )
              }
              className="flex-1 rounded-lg border border-primary/15 px-3 py-2 text-sm"
            />
            <select
              value={allergy.severity}
              onChange={(event) =>
                setAllergies((items) =>
                  items.map((item, i) =>
                    i === index
                      ? { ...item, severity: event.target.value as AllergyDraft['severity'] }
                      : item,
                  ),
                )
              }
              className="rounded-lg border border-primary/15 px-3 py-2 text-sm"
            >
              <option value="mild">Légère</option>
              <option value="moderate">Modérée</option>
              <option value="severe">Sévère</option>
            </select>
            <button
              type="button"
              onClick={() => setAllergies((items) => items.filter((_, i) => i !== index))}
              className="px-2 text-sm text-red-700"
            >
              Retirer
            </button>
          </div>
        ))}
      </div>

      <button
        disabled={busy}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {busy ? 'Création…' : 'Créer le dossier'}
      </button>
    </form>
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
