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

function findDemoStaffAccount(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase()

  for (const [role, account] of Object.entries(DEMO_ACCOUNTS)) {
    if (
      account.email === normalizedEmail &&
      account.password === password
    ) {
      return {
        role: role as Exclude<UserRole, 'patient'>,
        name: account.name,
        email: account.email,
      }
    }
  }

  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const isDemoMode = !isSupabaseConfigured

  const persistDemoUser = useCallback((next: AuthUser | null) => {
    setUser(next)
    if (next) {
      sessionStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(next))
    } else {
      sessionStorage.removeItem(DEMO_STORAGE_KEY)
    }
  }, [])

  const loadSupabaseProfile = useCallback(async (userId: string) => {
    const { data, error } = await getSupabase()
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !data) {
      throw new Error('Profil introuvable ou inactif.')
    }

    if (!data.is_active) {
      await getSupabase().auth.signOut()
      throw new Error('Ce compte a été désactivé.')
    }

    return profileToAuthUser(data)
  }, [])

  const refreshUser = useCallback(async () => {
    if (isDemoMode) return

    const { data } = await getSupabase().auth.getSession()
    if (!data.session?.user) {
      setUser(null)
      return
    }

    const profile = await loadSupabaseProfile(data.session.user.id)
    setUser(profile)
  }, [isDemoMode, loadSupabaseProfile])

  useEffect(() => {
    let mounted = true

    async function bootstrap() {
      if (isDemoMode) {
        const stored = sessionStorage.getItem(DEMO_STORAGE_KEY)
        if (stored && mounted) {
          setUser(JSON.parse(stored) as AuthUser)
        }
        if (mounted) setIsLoading(false)
        return
      }

      const { data } = await getSupabase().auth.getSession()

      if (data.session?.user) {
        try {
          const profile = await loadSupabaseProfile(data.session.user.id)
          if (mounted) setUser(profile)
        } catch {
          await getSupabase().auth.signOut()
          if (mounted) setUser(null)
        }
      }

      if (mounted) setIsLoading(false)
    }

    bootstrap()

    if (!isDemoMode) {
      const {
        data: { subscription },
      } = getSupabase().auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return

        if (event === 'SIGNED_OUT' || !session?.user) {
          setUser(null)
          return
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          try {
            const profile = await loadSupabaseProfile(session.user.id)
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
            error: 'Identifiants incorrects. Utilisez un compte de démonstration.',
          }
        }

        persistDemoUser({
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
          error: 'Email ou mot de passe incorrect.',
        }
      }

      try {
        const profile = await loadSupabaseProfile(data.user.id)
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
    [isDemoMode, loadSupabaseProfile, persistDemoUser],
  )

  const loginPatient = useCallback(
    async (code: string): Promise<LoginResult> => {
      const normalized = code.trim().toUpperCase()
      if (normalized.length < 4) {
        return { success: false, error: 'Code invalide. Minimum 4 caractères.' }
      }

      if (isDemoMode) {
        persistDemoUser({
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
          error: 'Code patient inconnu. Vérifiez auprès de votre médecin.',
        }
      }

      persistDemoUser({
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
    [isDemoMode, persistDemoUser],
  )

  const logout = useCallback(async () => {
    if (isDemoMode) {
      persistDemoUser(null)
      return
    }

    await getSupabase().auth.signOut()
    setUser(null)
    sessionStorage.removeItem(DEMO_STORAGE_KEY)
  }, [isDemoMode, persistDemoUser])

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
