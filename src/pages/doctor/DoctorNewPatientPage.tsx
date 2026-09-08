import { useState } from 'react'
import { Check, Copy, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import {
  emptyAdministrativeInfo,
  packAdministrativeInfo,
  type AdministrativeInfo,
} from '@/lib/clinicalForms'
import { createConsultation, createPatient } from '@/services/clinical'
import { DemoNotice } from './DoctorPatientsPage'

type FormState = {
  last_name: string
  first_name: string
  birth_date: string
  sex: 'M' | 'F' | 'U'
  phone: string
  admin: AdministrativeInfo
}

const emptyForm = (): FormState => ({
  last_name: '',
  first_name: '',
  birth_date: '',
  sex: 'U',
  phone: '',
  admin: emptyAdministrativeInfo(),
})

export function DoctorNewPatientPage() {
  const { isDemoMode } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [createdCode, setCreatedCode] = useState('')
  const [copied, setCopied] = useState(false)

  if (isDemoMode) return <DemoNotice title="La création de patient nécessite Supabase." />

  const setAdmin = (key: keyof AdministrativeInfo, value: string) => {
    setForm((current) => ({
      ...current,
      admin: { ...current.admin, [key]: value },
    }))
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const patient = await createPatient({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        birth_date: form.birth_date || null,
        sex: form.sex,
        phone: form.phone.trim() || null,
        emergency_contact_name: null,
        emergency_contact_phone: null,
        personal_history: packAdministrativeInfo('', form.admin),
        medical_history: '',
        family_history: '',
        chronic_treatments: '',
      })
      setCreatedCode(patient.access_code)
      const consultation = await createConsultation({ patientId: patient.id })
      navigate(`/doctor/consultations/${consultation.id}`, {
        state: { fromNewPatient: true, patientName: `${patient.last_name} ${patient.first_name}` },
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Enregistrement impossible.')
    } finally {
      setBusy(false)
    }
  }

  const field = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    options?: { type?: string; required?: boolean; placeholder?: string },
  ) => (
    <label className="block text-sm font-medium text-primary">
      {label}
      <input
        required={options?.required}
        type={options?.type || 'text'}
        value={value}
        placeholder={options?.placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-primary/15 px-3 py-2 font-normal outline-none focus:border-secondary"
      />
    </label>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Nouveau patient</h1>
        <p className="mt-1 text-sm text-primary/60">
          Informations administratives (feuille de clinique) — sans diagnostic
        </p>
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
        </div>
      )}

      <form onSubmit={(event) => void submit(event)} className="card space-y-5">
        <h2 className="font-semibold text-primary">Informations administratives</h2>
        {error && <p className="text-sm text-red-700">{error}</p>}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            {field('Nom', form.last_name, (value) => setForm((c) => ({ ...c, last_name: value })), {
              required: true,
            })}
            {field('Prénom(s)', form.first_name, (value) => setForm((c) => ({ ...c, first_name: value })), {
              required: true,
            })}
            <label className="block text-sm font-medium text-primary">
              Sexe
              <select
                value={form.sex}
                onChange={(event) =>
                  setForm((c) => ({ ...c, sex: event.target.value as 'M' | 'F' | 'U' }))
                }
                className="mt-1 w-full rounded-lg border border-primary/15 px-3 py-2 font-normal outline-none focus:border-secondary"
              >
                <option value="U">Non précisé</option>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </label>
            {field('Téléphone', form.phone, (value) => setForm((c) => ({ ...c, phone: value })), {
              type: 'tel',
              placeholder: 'Ex. 70 00 00 00',
            })}
            {field('Profession', form.admin.profession, (value) => setAdmin('profession', value))}
            {field('Lieu de naissance', form.admin.birth_place, (value) =>
              setAdmin('birth_place', value),
            )}
            {field(
              'Date de naissance',
              form.birth_date,
              (value) => setForm((c) => ({ ...c, birth_date: value })),
              { type: 'date' },
            )}
            {field('Province', form.admin.province, (value) => setAdmin('province', value))}
            {field(
              'Dernière adresse de la famille',
              form.admin.family_address,
              (value) => setAdmin('family_address', value),
            )}
            {field('Religion', form.admin.religion, (value) => setAdmin('religion', value))}
          </div>

          <div className="space-y-4">
            {field('N° I.U.P', form.admin.iup_number, (value) => setAdmin('iup_number', value))}
            {field('Service', form.admin.service, (value) => setAdmin('service', value), {
              placeholder: 'Ex. urgences chirurgicales',
            })}
            {field('N° d’enregistrement', form.admin.registration_number, (value) =>
              setAdmin('registration_number', value),
            )}
            {field('Catégorie', form.admin.category, (value) => setAdmin('category', value))}
            {field('Date d’entrée', form.admin.entry_date, (value) => setAdmin('entry_date', value), {
              type: 'date',
            })}
            {field('Heure d’entrée', form.admin.entry_time, (value) => setAdmin('entry_time', value), {
              type: 'time',
            })}
            {field('Date de sortie', form.admin.exit_date, (value) => setAdmin('exit_date', value), {
              type: 'date',
            })}
          </div>
        </div>

        <p className="text-xs text-primary/50">
          Le diagnostic n’est pas saisi ici — il appartient à la consultation.
        </p>

        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {busy ? 'Enregistrement…' : 'Enregistrer et ouvrir la consultation'}
        </button>
      </form>
    </div>
  )
}
