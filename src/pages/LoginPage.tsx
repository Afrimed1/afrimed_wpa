import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '@/components/Logo'
import { useAuth } from '@/context/AuthContext'
import { getHomePath } from '@/lib/navigation'
import { DEMO_ACCOUNTS } from '@/types'
import {
  Eye,
  EyeOff,
  FlaskConical,
  KeyRound,
  Loader2,
  ShieldCheck,
  Stethoscope,
  UserCircle,
} from 'lucide-react'

type LoginTab = 'staff' | 'patient'

export function LoginPage() {
  const navigate = useNavigate()
  const { loginStaff, loginPatient, isDemoMode } = useAuth()
  const [tab, setTab] = useState<LoginTab>('staff')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [patientCode, setPatientCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleStaffSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    const result = await loginStaff(email, password)
    setIsSubmitting(false)

    if (result.success && result.role) {
      navigate(getHomePath(result.role), { replace: true })
    } else {
      setError(result.error ?? 'Connexion impossible.')
    }
  }

  const handlePatientSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    const result = await loginPatient(patientCode)
    setIsSubmitting(false)

    if (result.success) {
      navigate('/patient', { replace: true })
    } else {
      setError(result.error ?? 'Code invalide.')
    }
  }

  const fillDemo = (role: keyof typeof DEMO_ACCOUNTS) => {
    const account = DEMO_ACCOUNTS[role]
    setEmail(account.email)
    setPassword(account.password)
    setError('')
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-primary via-primary-700 to-secondary-800 p-10 text-white lg:flex">
        <Logo variant="light" />

        <div>
          <h1 className="text-3xl font-bold leading-tight">
            Moderniser la consultation médicale au Burkina Faso
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/75">
            AFRIMED structure la collecte d&apos;informations médicales, facilite
            la prise de décision clinique et génère un dossier numérique complet.
          </p>

          <div className="mt-8 space-y-4">
            {[
              {
                icon: Stethoscope,
                title: 'Médecin',
                text: 'Consultation guidée, IA, prescriptions',
              },
              {
                icon: ShieldCheck,
                title: 'Administrateur',
                text: 'Gestion des comptes et pilotage',
              },
              {
                icon: FlaskConical,
                title: 'Laborantin',
                text: 'Demandes et résultats d\'examens',
              },
            ].map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="flex items-start gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur-sm"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-white/70">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm text-white/50">
          {isDemoMode ? 'Mode démo: Phase 0' : 'Authentification Supabase: Phase 1'}
        </p>
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-10 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>

          <h2 className="text-2xl font-bold text-primary">Connexion</h2>
          <p className="mt-1 text-sm text-primary-600">
            Accédez à votre espace professionnel ou patient
          </p>

          {isDemoMode && (
            <div className="mt-4 rounded-xl border border-secondary-200 bg-secondary-50 px-4 py-3 text-sm text-secondary-800">
              Mode démo actif
            </div>
          )}

          <div className="mt-6 flex rounded-xl bg-surface-muted p-1">
            <button
              type="button"
              onClick={() => {
                setTab('staff')
                setError('')
              }}
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition ${
                tab === 'staff'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-primary-600 hover:text-primary'
              }`}
            >
              Personnel de santé
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('patient')
                setError('')
              }}
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition ${
                tab === 'patient'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-primary-600 hover:text-primary'
              }`}
            >
              Patient
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent">
              {error}
            </div>
          )}

          {tab === 'staff' ? (
            <form onSubmit={handleStaffSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-primary">
                  Adresse email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="medecin@afrimed.bf"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-primary"
                >
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pr-12"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-400 hover:text-primary"
                    aria-label={showPassword ? 'Masquer' : 'Afficher'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Connexion…
                  </>
                ) : (
                  'Se connecter'
                )}
              </button>

              {isDemoMode && (
                <div className="rounded-2xl border border-primary-100 bg-primary-50/50 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-primary-500">
                    Comptes de démonstration
                  </p>
                  <div className="space-y-2">
                    {(Object.keys(DEMO_ACCOUNTS) as Array<keyof typeof DEMO_ACCOUNTS>).map(
                      (role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => fillDemo(role)}
                          className="flex w-full items-center gap-3 rounded-xl bg-white px-3 py-2.5 text-left text-sm transition hover:shadow-sm"
                        >
                          <UserCircle className="h-5 w-5 shrink-0 text-secondary" />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium capitalize text-primary">{role}</p>
                            <p className="truncate text-xs text-primary-500">
                              {DEMO_ACCOUNTS[role].email}
                            </p>
                          </div>
                        </button>
                      ),
                    )}
                  </div>
                </div>
              )}
            </form>
          ) : (
            <form onSubmit={handlePatientSubmit} className="mt-6 space-y-4">
              <div className="rounded-2xl border border-secondary-200 bg-secondary-50 p-4">
                <div className="flex items-start gap-3">
                  <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
                  <p className="text-sm leading-relaxed text-primary-700">
                    Entrez le code unique communiqué par votre médecin lors de
                    votre première visite. Aucun compte à créer.
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="patientCode"
                  className="mb-1.5 block text-sm font-medium text-primary"
                >
                  Code patient
                </label>
                <input
                  id="patientCode"
                  type="text"
                  required
                  value={patientCode}
                  onChange={(e) => setPatientCode(e.target.value.toUpperCase())}
                  className="input-field font-mono uppercase tracking-widest"
                  placeholder="Ex. AF7K2M"
                  maxLength={12}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-secondary w-full"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Vérification…
                  </>
                ) : (
                  'Accéder à mon dossier'
                )}
              </button>

              <p className="text-center text-xs text-primary-500">
                {isDemoMode
                  ? 'Mode démo : tout code de 4+ caractères fonctionne'
                  : 'Code démo Supabase : AF7K2M'}
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
