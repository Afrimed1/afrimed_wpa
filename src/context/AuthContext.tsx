import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { profileToAuthUser } from '@/lib/auth'
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'
import type { LoginResult, AuthUser, UserRole } from '@/types'
import { DEMO_ACCOUNTS } from '@/types'
import type { Profile } from '@/types/database'

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  isDemoMode: boolean
  loginStaff: (email: string, password: string) => Promise<LoginResult>
  loginPatient: (code: string) => Promise<LoginResult>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const DEMO_STORAGE_KEY = 'afrimed_demo_user'
const PATIENT_STORAGE_KEY = 'afrimed_patient_user'

function findDemoStaffAccount(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase()

  for (const [role, account] of Object.entries(DEMO_ACCOUNTS)) {
    if (account.email === normalizedEmail && account.password === password) {
      return {
        role: role as Exclude<UserRole, 'patient'>,
        name: account.name,
        email: account.email,
      }
    }
  }

  return null
}

function readStoredUser(key: string): AuthUser | null {
  const raw = sessionStorage.getItem(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    sessionStorage.removeItem(key)
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const isDemoMode = !isSupabaseConfigured

  const setDemoUser = useCallback((next: AuthUser | null) => {
    setUser(next)
    if (next) {
      sessionStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(next))
    } else {
      sessionStorage.removeItem(DEMO_STORAGE_KEY)
    }
  }, [])

  const setPatientUser = useCallback((next: AuthUser | null) => {
    setUser(next)
    if (next) {
      sessionStorage.setItem(PATIENT_STORAGE_KEY, JSON.stringify(next))
    } else {
      sessionStorage.removeItem(PATIENT_STORAGE_KEY)
    }
  }, [])

  const loadSupabaseProfile = useCallback(async () => {
    const { data, error } = await getSupabase().rpc('current_profile')
    const profile = data as Profile | null

    if (error || !profile) {
      throw new Error(
        error?.message
          ? `Profil inaccessible : ${error.message}`
          : 'Profil introuvable ou inactif.',
      )
    }

    if (!profile.is_active) {
      await getSupabase().auth.signOut()
      throw new Error('Ce compte a ete desactive.')
    }

    return profileToAuthUser(profile)
  }, [])

  const refreshUser = useCallback(async () => {
    if (isDemoMode) return

    const { data } = await getSupabase().auth.getSession()
    if (!data.session?.user) {
      const patient = readStoredUser(PATIENT_STORAGE_KEY)
      setUser(patient)
      return
    }

    const profile = await loadSupabaseProfile()
    setUser(profile)
  }, [isDemoMode, loadSupabaseProfile])

  useEffect(() => {
    let mounted = true

    async function bootstrap() {
      if (isDemoMode) {
        if (mounted) setUser(readStoredUser(DEMO_STORAGE_KEY))
        if (mounted) setIsLoading(false)
        return
      }

      const { data } = await getSupabase().auth.getSession()

      if (data.session?.user) {
        try {
          const profile = await loadSupabaseProfile()
          if (mounted) setUser(profile)
        } catch {
          await getSupabase().auth.signOut()
          if (mounted) setUser(null)
        }
      } else if (mounted) {
        setUser(readStoredUser(PATIENT_STORAGE_KEY))
      }

      if (mounted) setIsLoading(false)
    }

    void bootstrap()

    if (!isDemoMode) {
      const {
        data: { subscription },
      } = getSupabase().auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return

        if (event === 'SIGNED_OUT') {
          setUser(readStoredUser(PATIENT_STORAGE_KEY))
          return
        }

        if (!session?.user) return

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          try {
            const profile = await loadSupabaseProfile()
            sessionStorage.removeItem(PATIENT_STORAGE_KEY)
            setUser(profile)
          } catch {
            setUser(null)
          }
        }
      })

      return () => {
        mounted = false
        subscription.unsubscribe()
      }
    }

    return () => {
      mounted = false
    }
  }, [isDemoMode, loadSupabaseProfile])

  const loginStaff = useCallback(
    async (email: string, password: string): Promise<LoginResult> => {
      if (isDemoMode) {
        const account = findDemoStaffAccount(email, password)
        if (!account) {
          return {
            success: false,
            error: 'Identifiants incorrects. Utilisez un compte de demonstration.',
          }
        }

        setDemoUser({
          role: account.role,
          email: account.email,
          name: account.name,
        })

        return { success: true, role: account.role }
      }

      const { data, error } = await getSupabase().auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (error || !data.user) {
        return {
          success: false,
          error: error?.message
            ? `Connexion refusee : ${error.message}`
            : 'Email ou mot de passe incorrect.',
        }
      }

      try {
        sessionStorage.removeItem(PATIENT_STORAGE_KEY)
        const profile = await loadSupabaseProfile()
        setUser(profile)
        return { success: true, role: profile.role }
      } catch (profileError) {
        await getSupabase().auth.signOut()
        return {
          success: false,
          error:
            profileError instanceof Error
              ? profileError.message
              : 'Profil inaccessible.',
        }
      }
    },
    [isDemoMode, loadSupabaseProfile, setDemoUser],
  )

  const loginPatient = useCallback(
    async (code: string): Promise<LoginResult> => {
      const normalized = code.trim().toUpperCase()
      if (normalized.length < 4) {
        return { success: false, error: 'Code invalide. Minimum 4 caracteres.' }
      }

      if (isDemoMode) {
        setDemoUser({
          role: 'patient',
          name: 'Patient',
          patientCode: normalized,
        })
        return { success: true, role: 'patient' }
      }

      const { data, error } = await getSupabase()
        .from('patients')
        .select('id, first_name, last_name, access_code, establishment_id')
        .eq('access_code', normalized)
        .eq('is_active', true)
        .maybeSingle()

      if (error || !data) {
        return {
          success: false,
          error: 'Code patient inconnu. Verifiez aupres de votre medecin.',
        }
      }

      await getSupabase().auth.signOut()
      setPatientUser({
        role: 'patient',
        name: `${data.first_name} ${data.last_name}`,
        firstName: data.first_name,
        lastName: data.last_name,
        patientCode: data.access_code,
        patientId: data.id,
        establishmentId: data.establishment_id,
      })

      return { success: true, role: 'patient' }
    },
    [isDemoMode, setDemoUser, setPatientUser],
  )

  const logout = useCallback(async () => {
    if (isDemoMode) {
      setDemoUser(null)
      return
    }

    sessionStorage.removeItem(PATIENT_STORAGE_KEY)
    await getSupabase().auth.signOut()
    setUser(null)
  }, [isDemoMode, setDemoUser])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      isDemoMode,
      loginStaff,
      loginPatient,
      logout,
      refreshUser,
    }),
    [user, isLoading, isDemoMode, loginStaff, loginPatient, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
