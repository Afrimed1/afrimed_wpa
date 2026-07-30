import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LoadingScreen } from '@/components/LoadingScreen'
import { Logo } from '@/components/Logo'
import { useAuth } from '@/context/AuthContext'
import { getHomePath } from '@/lib/navigation'
import { HeartPulse, Shield, Sparkles } from 'lucide-react'

export function SplashPage() {
  const navigate = useNavigate()
  const { isAuthenticated, user, isLoading } = useAuth()
  const [visible, setVisible] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(showTimer)
  }, [])

  useEffect(() => {
    if (isLoading) return

    const redirectTimer = setTimeout(() => {
      setReady(true)
      if (isAuthenticated && user) {
        navigate(getHomePath(user.role), { replace: true })
      } else {
        navigate('/login', { replace: true })
      }
    }, 2200)

    return () => clearTimeout(redirectTimer)
  }, [isAuthenticated, user, isLoading, navigate])

  if (isLoading) {
    return <LoadingScreen message="Initialisation d'AFRIMED…" />
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-primary via-primary-700 to-secondary-800 px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-20 h-64 w-64 rounded-full bg-secondary/20 blur-3xl" />
        <div className="absolute -right-16 bottom-16 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
      </div>

      <div
        className={`relative z-10 flex flex-col items-center text-center transition-all duration-700 ${
          visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        <Logo size="lg" variant="light" />

        <p className="mt-8 max-w-sm text-base leading-relaxed text-white/80">
          La tablette médicale intelligente au service des professionnels de
          santé et de la santé publique
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-white/70">
          <div className="flex items-center gap-2 text-sm">
            <HeartPulse className="h-4 w-4 text-secondary-300" />
            Consultation guidée
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-secondary-300" />
            Aide à la décision
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-secondary-300" />
            Dossier sécurisé
          </div>
        </div>

        <div className="mt-12 flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-secondary-300" />
          <span className="text-sm text-white/60">
            {ready ? 'Redirection…' : 'Chargement…'}
          </span>
        </div>
      </div>
    </div>
  )
}
