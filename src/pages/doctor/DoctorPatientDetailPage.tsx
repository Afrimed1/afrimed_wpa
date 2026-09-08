import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Edit3, Loader2, Plus } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import {
  packAdministrativeInfo,
  packAntecedentsIntoHistories,
  unpackAdministrativeInfo,
  unpackAntecedentsFromPatient,
  type AdministrativeInfo,
  type AntecedentsState,
} from '@/lib/clinicalForms'
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

function sexLabel(sex: string | null | undefined) {
  if (sex === 'M') return 'Masculin'
  if (sex === 'F') return 'Féminin'
  return 'Non précisé'
}

function formatEntry(admin: AdministrativeInfo) {
  if (!admin.entry_date && !admin.entry_time) return ''
  if (admin.entry_date && admin.entry_time) return `${admin.entry_date} à ${admin.entry_time}`
  return admin.entry_date || admin.entry_time
}

export function DoctorPatientDetailPage() {
  const { id } = useParams()
  const { isDemoMode } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const fromDossier = (location.state as { from?: string } | null)?.from === 'dossier'
  const backPath = fromDossier ? '/doctor/dossier-medical' : '/doctor/patients'
  const backLabel = fromDossier ? 'Dossier médical' : 'Patients'

  const [dossier, setDossier] = useState<PatientDossier | null>(null)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!id || isDemoMode) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      setDossier(await getPatient(id))
    } catch (cause) {
      setDossier(null)
      setError(cause instanceof Error ? cause.message : 'Dossier inaccessible.')
    } finally {
      setLoading(false)
    }
  }, [id, isDemoMode])

  useEffect(() => {
    void load()
  }, [load])

  if (isDemoMode) return <DemoNotice title="Les dossiers cliniques nécessitent Supabase." />
  if (loading) {
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
        <button
          type="button"
          onClick={() => navigate(backPath)}
          className="text-sm font-semibold text-primary"
        >
          <ArrowLeft className="mr-1 inline h-4 w-4" />
          Retour — {backLabel}
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
          <button
            type="button"
            onClick={() => navigate(backPath)}
            className="mb-3 text-sm font-semibold text-primary"
          >
            <ArrowLeft className="mr-1 inline h-4 w-4" />
            {backLabel}
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
                <span className="text-sm text-primary/70">
                  {consultation.diagnosis || consultation.status}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function DossierSummary({ dossier }: { dossier: PatientDossier }) {
  const { personalHistory, admin } = unpackAdministrativeInfo(dossier.personal_history)
  const antecedents = unpackAntecedentsFromPatient({
    ...dossier,
    personal_history: personalHistory,
  })
  const age = ageFromBirthDate(dossier.birth_date)

  return (
    <>
      <div className="card space-y-4">
        <h2 className="font-semibold text-primary">Informations administratives</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Info label="Nom" value={`${dossier.last_name} ${dossier.first_name}`} />
          <Info label="Date de naissance" value={dossier.birth_date || '—'} />
          <Info label="Âge" value={age ? `${age} ans` : '—'} />
          <Info label="Sexe" value={sexLabel(dossier.sex)} />
          <Info label="Téléphone" value={dossier.phone || '—'} />
          <Info label="Profession" value={admin.profession || '—'} />
          <Info label="Lieu de naissance" value={admin.birth_place || '—'} />
          <Info label="Province" value={admin.province || '—'} />
          <Info label="Adresse famille" value={admin.family_address || '—'} />
          <Info label="Religion" value={admin.religion || '—'} />
          <Info label="N° I.U.P" value={admin.iup_number || '—'} />
          <Info label="Service" value={admin.service || '—'} />
          <Info label="N° d’enregistrement" value={admin.registration_number || '—'} />
          <Info label="Catégorie" value={admin.category || '—'} />
          <Info label="Date d’entrée" value={formatEntry(admin) || '—'} />
          <Info label="Date de sortie" value={admin.exit_date || '—'} />
          <Info label="Contact d’urgence" value={dossier.emergency_contact_name || '—'} />
          <Info label="Tél. urgence" value={dossier.emergency_contact_phone || '—'} />
        </div>
      </div>

      <AntecedentsSummary antecedents={antecedents} />

      <div className="card">
        <h2 className="font-semibold text-primary">Allergies déclarées</h2>
        {dossier.allergies.length ? (
          <ul className="mt-3 space-y-2">
            {dossier.allergies.map((allergy) => (
              <li key={allergy.id} className="text-sm text-primary">
                <span className="font-semibold">{allergy.substance}</span>{' '}
                <span className="text-primary/60">— {allergy.severity}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-primary/60">
            {antecedents.personnels.allergiques
              ? antecedents.personnels.allergiques
              : 'Aucune allergie renseignée.'}
          </p>
        )}
      </div>
    </>
  )
}

function AntecedentsSummary({ antecedents }: { antecedents: AntecedentsState }) {
  const personal = [
    ['Médicaux', antecedents.personnels.medicaux],
    ['Chirurgicaux', antecedents.personnels.chirurgicaux],
    ['Vaccinaux', antecedents.personnels.vaccinaux],
    ['Allergiques', antecedents.personnels.allergiques],
    ['Autres', antecedents.personnels.autres],
  ]
  const family = [
    ['Ascendants', antecedents.familiaux.ascendants],
    ['Collatéraux', antecedents.familiaux.collateraux],
    ['Descendants', antecedents.familiaux.descendants],
  ]

  return (
    <div className="card space-y-5">
      <h2 className="font-semibold text-primary">Antécédents</h2>
      <div>
        <h3 className="mb-2 text-sm font-semibold text-primary/80">Personnels</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {personal.map(([label, value]) => (
            <div key={label} className="rounded-lg border border-primary/10 p-3">
              <p className="text-xs uppercase tracking-wide text-primary/50">{label}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-primary/80">{value || '—'}</p>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold text-primary/80">Familiaux</h3>
        <div className="grid gap-3 md:grid-cols-3">
          {family.map(([label, value]) => (
            <div key={label} className="rounded-lg border border-primary/10 p-3">
              <p className="text-xs uppercase tracking-wide text-primary/50">{label}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-primary/80">{value || '—'}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-primary/10 p-3">
        <p className="text-xs uppercase tracking-wide text-primary/50">
          Habitudes alimentaires et mode de vie
        </p>
        <p className="mt-1 whitespace-pre-wrap text-sm text-primary/80">
          {antecedents.habitudes || '—'}
        </p>
      </div>
    </div>
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
  const unpacked = unpackAdministrativeInfo(dossier.personal_history)
  const antecedents = unpackAntecedentsFromPatient({
    ...dossier,
    personal_history: unpacked.personalHistory,
  })

  const [form, setForm] = useState({
    first_name: dossier.first_name,
    last_name: dossier.last_name,
    birth_date: dossier.birth_date || '',
    sex: (dossier.sex || 'U') as 'M' | 'F' | 'U',
    phone: dossier.phone || '',
    emergency_contact_name: dossier.emergency_contact_name || '',
    emergency_contact_phone: dossier.emergency_contact_phone || '',
    admin: unpacked.admin,
    antecedents,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const setAdmin = (key: keyof AdministrativeInfo, value: string) => {
    setForm((current) => ({ ...current, admin: { ...current.admin, [key]: value } }))
  }

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const histories = packAntecedentsIntoHistories(form.antecedents)
      onSaved(
        await updatePatient(dossier.id, {
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          birth_date: form.birth_date || null,
          sex: form.sex,
          phone: form.phone || null,
          emergency_contact_name: form.emergency_contact_name || null,
          emergency_contact_phone: form.emergency_contact_phone || null,
          personal_history: packAdministrativeInfo(histories.personal_history, form.admin),
          medical_history: histories.medical_history,
          family_history: histories.family_history,
          chronic_treatments: histories.chronic_treatments,
        }),
      )
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Enregistrement impossible.')
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'mt-1 w-full rounded-lg border border-primary/15 px-3 py-2 font-normal outline-none focus:border-secondary'

  return (
    <form onSubmit={(event) => void save(event)} className="card space-y-5">
      <h2 className="font-semibold text-primary">Modifier le dossier</h2>
      {error && <p className="text-sm text-red-700">{error}</p>}

      <div className="grid gap-3 md:grid-cols-3">
        <label className="text-sm font-medium text-primary">
          Nom
          <input
            required
            value={form.last_name}
            onChange={(e) => setForm((c) => ({ ...c, last_name: e.target.value }))}
            className={inputClass}
          />
        </label>
        <label className="text-sm font-medium text-primary">
          Prénom(s)
          <input
            required
            value={form.first_name}
            onChange={(e) => setForm((c) => ({ ...c, first_name: e.target.value }))}
            className={inputClass}
          />
        </label>
        <label className="text-sm font-medium text-primary">
          Date de naissance
          <input
            type="date"
            value={form.birth_date}
            onChange={(e) => setForm((c) => ({ ...c, birth_date: e.target.value }))}
            className={inputClass}
          />
        </label>
        <label className="text-sm font-medium text-primary">
          Sexe
          <select
            value={form.sex}
            onChange={(e) => setForm((c) => ({ ...c, sex: e.target.value as 'M' | 'F' | 'U' }))}
            className={inputClass}
          >
            <option value="U">Non précisé</option>
            <option value="M">Masculin</option>
            <option value="F">Féminin</option>
          </select>
        </label>
        <label className="text-sm font-medium text-primary">
          Téléphone
          <input
            value={form.phone}
            onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))}
            className={inputClass}
          />
        </label>
        <label className="text-sm font-medium text-primary">
          Profession
          <input
            value={form.admin.profession}
            onChange={(e) => setAdmin('profession', e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="text-sm font-medium text-primary">
          Lieu de naissance
          <input
            value={form.admin.birth_place}
            onChange={(e) => setAdmin('birth_place', e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="text-sm font-medium text-primary">
          Province
          <input
            value={form.admin.province}
            onChange={(e) => setAdmin('province', e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="text-sm font-medium text-primary">
          Adresse famille
          <input
            value={form.admin.family_address}
            onChange={(e) => setAdmin('family_address', e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="text-sm font-medium text-primary">
          Religion
          <input
            value={form.admin.religion}
            onChange={(e) => setAdmin('religion', e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="text-sm font-medium text-primary">
          N° I.U.P
          <input
            value={form.admin.iup_number}
            onChange={(e) => setAdmin('iup_number', e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="text-sm font-medium text-primary">
          Service
          <input
            value={form.admin.service}
            onChange={(e) => setAdmin('service', e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="text-sm font-medium text-primary">
          N° d’enregistrement
          <input
            value={form.admin.registration_number}
            onChange={(e) => setAdmin('registration_number', e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="text-sm font-medium text-primary">
          Catégorie
          <input
            value={form.admin.category}
            onChange={(e) => setAdmin('category', e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="text-sm font-medium text-primary">
          Date d’entrée
          <input
            type="date"
            value={form.admin.entry_date}
            onChange={(e) => setAdmin('entry_date', e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="text-sm font-medium text-primary">
          Heure d’entrée
          <input
            type="time"
            value={form.admin.entry_time}
            onChange={(e) => setAdmin('entry_time', e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="text-sm font-medium text-primary">
          Date de sortie
          <input
            type="date"
            value={form.admin.exit_date}
            onChange={(e) => setAdmin('exit_date', e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="text-sm font-medium text-primary">
          Contact d’urgence
          <input
            value={form.emergency_contact_name}
            onChange={(e) => setForm((c) => ({ ...c, emergency_contact_name: e.target.value }))}
            className={inputClass}
          />
        </label>
        <label className="text-sm font-medium text-primary">
          Tél. urgence
          <input
            value={form.emergency_contact_phone}
            onChange={(e) => setForm((c) => ({ ...c, emergency_contact_phone: e.target.value }))}
            className={inputClass}
          />
        </label>
      </div>

      <div className="flex gap-2">
        <button
          disabled={saving}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? 'Enregistrement…' : 'Enregistrer'}
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
