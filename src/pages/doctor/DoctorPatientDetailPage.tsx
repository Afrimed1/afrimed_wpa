import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Edit3, Loader2, Plus } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { createConsultation, getPatient, updatePatient } from '@/services/clinical'
import type { PatientDossier } from '@/services/clinical'
import { DemoNotice } from './DoctorPatientsPage'

function ageFromBirthDate(birthDate: string | null): string {
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
  return `${new Date().getFullYear() - ageYears}-01-01`
}

export function DoctorPatientDetailPage() {
  const { id } = useParams()
  const { isDemoMode } = useAuth()
  const navigate = useNavigate()
  const [dossier, setDossier] = useState<PatientDossier | null>(null)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!id || isDemoMode) return
    setBusy(true)
    try {
      setDossier(await getPatient(id))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Dossier inaccessible.')
    } finally {
      setBusy(false)
    }
  }, [id, isDemoMode])

  useEffect(() => {
    void load()
  }, [load])

  if (isDemoMode) return <DemoNotice title="Les dossiers cliniques nécessitent Supabase." />
  if (busy && !dossier) {
    return (
      <div className="card text-sm text-primary/60">
        <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
        Chargement du dossier…
      </div>
    )
  }
  if (!dossier) {
    return (
      <div className="space-y-4">
        <button type="button" onClick={() => navigate('/doctor/patients')} className="text-sm font-semibold text-primary">
          <ArrowLeft className="mr-1 inline h-4 w-4" />
          Retour aux patients
        </button>
        <div className="card text-sm text-red-700">{error || 'Dossier introuvable.'}</div>
      </div>
    )
  }

  const startConsultation = async () => {
    setBusy(true)
    setError('')
    try {
      const consultation = await createConsultation({ patientId: dossier.id })
      navigate(`/doctor/consultations/${consultation.id}`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Création de consultation impossible.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <button type="button" onClick={() => navigate('/doctor/patients')} className="mb-3 text-sm font-semibold text-primary">
            <ArrowLeft className="mr-1 inline h-4 w-4" />
            Patients
          </button>
          <h1 className="text-2xl font-bold text-primary">
            {dossier.last_name} {dossier.first_name}
          </h1>
          <p className="mt-1 text-sm text-primary/60">
            Code patient : <code>{dossier.access_code}</code>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-primary/20 px-4 py-2 text-sm font-semibold text-primary"
          >
            <Edit3 className="h-4 w-4" />
            Modifier dossier
          </button>
          <button
            type="button"
            onClick={() => void startConsultation()}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            Nouvelle consultation
          </button>
        </div>
      </div>
      {error && <div className="card text-sm text-red-700">{error}</div>}
      {editing ? (
        <DossierEditor
          dossier={dossier}
          onCancel={() => setEditing(false)}
          onSaved={(next) => {
            setDossier(next)
            setEditing(false)
          }}
        />
      ) : (
        <DossierSummary dossier={dossier} />
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <h2 className="font-semibold text-primary">Vaccination</h2>
          <p className="mt-3 text-sm text-primary/60">Disponible prochainement.</p>
        </div>
        <div className="card">
          <h2 className="font-semibold text-primary">Imagerie</h2>
          <p className="mt-3 text-sm text-primary/60">Disponible prochainement.</p>
        </div>
      </div>
      <div className="card">
        <h2 className="font-semibold text-primary">Consultations antérieures</h2>
        <div className="mt-3 divide-y divide-primary/10">
          {dossier.recentConsultations.length === 0 ? (
            <p className="py-3 text-sm text-primary/60">Aucune consultation enregistrée.</p>
          ) : (
            dossier.recentConsultations.map((consultation) => (
              <button
                key={consultation.id}
                type="button"
                onClick={() => navigate(`/doctor/consultations/${consultation.id}`)}
                className="flex w-full justify-between py-3 text-left"
              >
                <span>
                  <span className="block text-sm font-semibold text-primary">
                    {consultation.motif || 'Consultation sans motif renseigné'}
                  </span>
                  <span className="text-xs text-primary/60">
                    {new Date(consultation.started_at).toLocaleDateString('fr-FR')}
                  </span>
                </span>
                <span className="text-sm text-primary/70">{consultation.diagnosis || consultation.status}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function DossierSummary({ dossier }: { dossier: PatientDossier }) {
  const age = ageFromBirthDate(dossier.birth_date)
  const latestClinical = dossier.recentConsultations.find(
    (consultation) => consultation.motif || consultation.history_of_illness,
  )
  const clinicalCards = [
    ['Motif de consultation', latestClinical?.motif || ''],
    ['Histoire de la maladie', latestClinical?.history_of_illness || ''],
  ]
  const history = [
    ['Antécédents personnels', dossier.personal_history],
    ['Antécédents médicaux', dossier.medical_history || ''],
    ['Antécédents familiaux', dossier.family_history],
    ['Traitements chroniques', dossier.chronic_treatments],
  ]
  return (
    <>
      <div className="card grid gap-4 sm:grid-cols-3">
        <Info label="Date de naissance" value={dossier.birth_date || 'Non renseignée'} />
        <Info label="Âge révolu" value={age ? `${age} ans` : 'Non renseigné'} />
        <Info
          label="Sexe"
          value={dossier.sex === 'M' ? 'Masculin' : dossier.sex === 'F' ? 'Féminin' : 'Non précisé'}
        />
        <Info label="Téléphone" value={dossier.phone || 'Non renseigné'} />
        <Info label="Contact d’urgence" value={dossier.emergency_contact_name || 'Non renseigné'} />
        <Info label="Téléphone urgence" value={dossier.emergency_contact_phone || 'Non renseigné'} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {clinicalCards.map(([label, value]) => (
          <div key={label} className="card">
            <h2 className="font-semibold text-primary">{label}</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm text-primary/70">{value || 'Non renseigné'}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {history.map(([label, value]) => (
          <div key={label} className="card">
            <h2 className="font-semibold text-primary">{label}</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm text-primary/70">{value || 'Non renseigné'}</p>
          </div>
        ))}
      </div>
      <div className="card">
        <h2 className="font-semibold text-primary">Allergies</h2>
        {dossier.allergies.length ? (
          <ul className="mt-3 space-y-2">
            {dossier.allergies.map((allergy) => (
              <li key={allergy.id} className="text-sm text-primary">
                <span className="font-semibold">{allergy.substance}</span>{' '}
                <span className="text-primary/60">- {allergy.severity}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-primary/60">Aucune allergie renseignée.</p>
        )}
      </div>
    </>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-primary/50">{label}</p>
      <p className="mt-1 text-sm font-medium text-primary">{value}</p>
    </div>
  )
}

function DossierEditor({
  dossier,
  onCancel,
  onSaved,
}: {
  dossier: PatientDossier
  onCancel: () => void
  onSaved: (patient: PatientDossier) => void
}) {
  const [form, setForm] = useState({
    first_name: dossier.first_name,
    last_name: dossier.last_name,
    birth_date: dossier.birth_date || '',
    age_years: ageFromBirthDate(dossier.birth_date),
    sex: (dossier.sex || 'U') as 'M' | 'F' | 'U',
    phone: dossier.phone || '',
    emergency_contact_name: dossier.emergency_contact_name || '',
    emergency_contact_phone: dossier.emergency_contact_phone || '',
    personal_history: dossier.personal_history,
    medical_history: dossier.medical_history || '',
    family_history: dossier.family_history,
    chronic_treatments: dossier.chronic_treatments,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      onSaved(
        await updatePatient(dossier.id, {
          first_name: form.first_name,
          last_name: form.last_name,
          birth_date: form.birth_date || null,
          sex: form.sex,
          phone: form.phone || null,
          emergency_contact_name: form.emergency_contact_name || null,
          emergency_contact_phone: form.emergency_contact_phone || null,
          personal_history: form.personal_history,
          medical_history: form.medical_history,
          family_history: form.family_history,
          chronic_treatments: form.chronic_treatments,
        }),
      )
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Enregistrement impossible.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={(event) => void save(event)} className="card space-y-4">
      <h2 className="font-semibold text-primary">Modifier le dossier</h2>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="grid gap-3 md:grid-cols-3">
        <label className="text-sm text-primary">
          Prénom
          <input
            value={form.first_name}
            onChange={(e) => setForm((c) => ({ ...c, first_name: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-primary/15 px-3 py-2"
            required
          />
        </label>
        <label className="text-sm text-primary">
          Nom
          <input
            value={form.last_name}
            onChange={(e) => setForm((c) => ({ ...c, last_name: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-primary/15 px-3 py-2"
            required
          />
        </label>
        <label className="text-sm text-primary">
          Date de naissance
          <input
            type="date"
            value={form.birth_date}
            onChange={(e) =>
              setForm((c) => ({
                ...c,
                birth_date: e.target.value,
                age_years: ageFromBirthDate(e.target.value),
              }))
            }
            className="mt-1 w-full rounded-lg border border-primary/15 px-3 py-2"
          />
        </label>
        <label className="text-sm text-primary">
          Âge révolu
          <input
            type="number"
            min={0}
            max={130}
            value={form.age_years}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/\D/g, '')
              const age = Number(cleaned)
              setForm((c) => ({
                ...c,
                age_years: cleaned,
                birth_date: cleaned && age >= 0 && age <= 130 ? birthDateFromAge(age) : c.birth_date,
              }))
            }}
            className="mt-1 w-full rounded-lg border border-primary/15 px-3 py-2"
          />
        </label>
        <label className="text-sm text-primary">
          Sexe
          <select
            value={form.sex}
            onChange={(e) => setForm((c) => ({ ...c, sex: e.target.value as 'M' | 'F' | 'U' }))}
            className="mt-1 w-full rounded-lg border border-primary/15 px-3 py-2"
          >
            <option value="U">Non précisé</option>
            <option value="M">Masculin</option>
            <option value="F">Féminin</option>
          </select>
        </label>
        <label className="text-sm text-primary">
          Téléphone
          <input
            value={form.phone}
            onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-primary/15 px-3 py-2"
          />
        </label>
        <label className="text-sm text-primary">
          Contact d’urgence
          <input
            value={form.emergency_contact_name}
            onChange={(e) => setForm((c) => ({ ...c, emergency_contact_name: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-primary/15 px-3 py-2"
          />
        </label>
        <label className="text-sm text-primary">
          Téléphone urgence
          <input
            value={form.emergency_contact_phone}
            onChange={(e) => setForm((c) => ({ ...c, emergency_contact_phone: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-primary/15 px-3 py-2"
          />
        </label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {(
          [
            ['personal_history', 'Antécédents personnels'],
            ['medical_history', 'Antécédents médicaux'],
            ['family_history', 'Antécédents familiaux'],
            ['chronic_treatments', 'Traitements chroniques'],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="text-sm text-primary">
            {label}
            <textarea
              value={form[key]}
              onChange={(e) => setForm((c) => ({ ...c, [key]: e.target.value }))}
              className="mt-1 min-h-24 w-full rounded-lg border border-primary/15 px-3 py-2"
            />
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        <button disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">
          Enregistrer
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-primary/20 px-4 py-2 text-sm font-semibold text-primary"
        >
          Annuler
        </button>
      </div>
    </form>
  )
}
