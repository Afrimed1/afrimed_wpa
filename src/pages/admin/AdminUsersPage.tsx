import { useCallback, useEffect, useState } from 'react'
import {
  Check,
  Copy,
  Loader2,
  Plus,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { STAFF_ROLE_OPTIONS } from '@/lib/auth'
import {
  createStaffAccount,
  fetchEstablishmentProfiles,
  setProfileActive,
} from '@/services/users'
import type { Profile } from '@/types/database'
import { ROLE_LABELS } from '@/types'

export function AdminUsersPage() {
  const { user, isDemoMode } = useAuth()
  const adminEstablishmentId = user?.establishmentId

  const [profiles, setProfiles] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createdPassword, setCreatedPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'doctor' | 'lab'>('doctor')

  const loadProfiles = useCallback(async () => {
    if (isDemoMode || !adminEstablishmentId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const data = await fetchEstablishmentProfiles(adminEstablishmentId)
      setProfiles(data)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Impossible de charger les utilisateurs.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [adminEstablishmentId, isDemoMode])

  useEffect(() => {
    void loadProfiles()
  }, [loadProfiles])

  const resetForm = () => {
    setFirstName('')
    setLastName('')
    setEmail('')
    setRole('doctor')
    setShowForm(false)
    setCreatedPassword(null)
    setCopied(false)
  }

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!adminEstablishmentId) return

    setIsCreating(true)
    setError('')

    const result = await createStaffAccount({
      firstName,
      lastName,
      email,
      role,
      establishmentId: adminEstablishmentId,
    })

    setIsCreating(false)

    if (!result.success) {
      setError(result.error ?? 'Création impossible.')
      return
    }

    setCreatedPassword(result.temporaryPassword ?? null)
    await loadProfiles()
  }

  const handleToggleActive = async (profile: Profile) => {
    if (profile.id === user?.id) return

    try {
      await setProfileActive(profile.id, !profile.is_active)
      await loadProfiles()
    } catch (toggleError) {
      setError(
        toggleError instanceof Error
          ? toggleError.message
          : 'Mise à jour impossible.',
      )
    }
  }

  const copyPassword = async () => {
    if (!createdPassword) return
    await navigator.clipboard.writeText(createdPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isDemoMode) {
    return (
      <div className="space-y-6">
        <Header onCreate={() => setShowForm(true)} disabled />
        <div className="card border-secondary-200 bg-secondary-50">
          <p className="text-sm text-primary-700">
            La gestion des comptes nécessite Supabase. Copiez{' '}
            <code>.env.example</code> vers <code>.env.local</code>, exécutez la
            migration SQL, puis créez le compte admin.
          </p>
        </div>
        <DemoUsersPreview />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Header onCreate={() => setShowForm(true)} />

      {error && (
        <div className="rounded-xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent">
          {error}
        </div>
      )}

      {createdPassword && (
        <div className="card border-secondary-200 bg-secondary-50">
          <p className="font-semibold text-primary">Compte créé avec succès</p>
          <p className="mt-1 text-sm text-primary-600">
            Communiquez ce mot de passe temporaire à l&apos;utilisateur. Il pourra
            le modifier lors de sa première connexion.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <code className="rounded-lg bg-white px-4 py-2 font-mono text-sm">
              {createdPassword}
            </code>
            <button type="button" onClick={() => void copyPassword()} className="btn-outline">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copié' : 'Copier'}
            </button>
            <button type="button" onClick={resetForm} className="btn-primary">
              Terminer
            </button>
          </div>
        </div>
      )}

      {showForm && !createdPassword && (
        <form onSubmit={(e) => void handleCreate(e)} className="card space-y-4">
          <h2 className="font-semibold text-primary">Nouveau compte</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Prénom</label>
              <input
                className="input-field"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Nom</label>
              <input
                className="input-field"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Email</label>
            <input
              type="email"
              className="input-field"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="prenom.nom@afrimed.bf"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Rôle</label>
            <select
              className="input-field"
              value={role}
              onChange={(e) => setRole(e.target.value as 'doctor' | 'lab')}
            >
              {STAFF_ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={isCreating} className="btn-primary">
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Création…
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Créer le compte
                </>
              )}
            </button>
            <button type="button" onClick={resetForm} className="btn-outline">
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="card overflow-hidden p-0">
        <div className="border-b border-primary-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary-500" />
            <h2 className="font-semibold text-primary">
              Utilisateurs ({profiles.length})
            </h2>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-secondary" />
          </div>
        ) : profiles.length === 0 ? (
          <p className="px-5 py-8 text-sm text-primary-500">
            Aucun utilisateur trouvé.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-surface-muted text-primary-600">
                <tr>
                  <th className="px-5 py-3 font-medium">Nom</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Rôle</th>
                  <th className="px-5 py-3 font-medium">Statut</th>
                  <th className="px-5 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((profile) => (
                  <tr key={profile.id} className="border-t border-primary-100">
                    <td className="px-5 py-4 font-medium text-primary">
                      {profile.first_name} {profile.last_name}
                    </td>
                    <td className="px-5 py-4 text-primary-600">{profile.email}</td>
                    <td className="px-5 py-4">{ROLE_LABELS[profile.role]}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          profile.is_active
                            ? 'bg-secondary-100 text-secondary-800'
                            : 'bg-primary-100 text-primary-600'
                        }`}
                      >
                        {profile.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {profile.id !== user?.id && profile.role !== 'admin' ? (
                        <button
                          type="button"
                          onClick={() => void handleToggleActive(profile)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-50"
                        >
                          {profile.is_active ? (
                            <>
                              <UserX className="h-4 w-4" />
                              Désactiver
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-4 w-4" />
                              Activer
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-xs text-primary-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function Header({
  onCreate,
  disabled = false,
}: {
  onCreate: () => void
  disabled?: boolean
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-primary">Gestion des comptes</h1>
        <p className="mt-1 text-sm text-primary-600">
          Création et gestion des médecins et laborantins
        </p>
      </div>
      <button
        type="button"
        onClick={onCreate}
        disabled={disabled}
        className="btn-primary"
      >
        <Plus className="h-4 w-4" />
        Nouveau compte
      </button>
    </div>
  )
}

function DemoUsersPreview() {
  return (
    <div className="card overflow-hidden p-0 opacity-75">
      <div className="border-b border-primary-100 px-5 py-4">
        <h2 className="font-semibold text-primary">Aperçu (mode démo)</h2>
      </div>
      <div className="space-y-3 px-5 py-4 text-sm text-primary-600">
        <p>Dr. Ouédraogo — medecin@afrimed.bf — Médecin — Actif</p>
        <p>Lab. Compaoré — labo@afrimed.bf — Laborantin — Actif</p>
      </div>
    </div>
  )
}
