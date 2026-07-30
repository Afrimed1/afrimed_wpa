import { Bell, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Logo } from '@/components/Logo'
import { NavIcon } from '@/components/NavIcon'
import { useAuth } from '@/context/AuthContext'
import { getNavItems } from '@/lib/navigation'
import { ROLE_LABELS } from '@/types'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!user) return null

  const navItems = getNavItems(user.role)

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 px-5 py-5">
        <Logo variant="light" size="sm" />
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path.split('/').length <= 2}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-white/75 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <NavIcon name={item.icon} className="h-5 w-5 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="mb-3 rounded-xl bg-white/10 px-3 py-2.5">
          <p className="truncate text-sm font-semibold text-white">{user.name}</p>
          <p className="text-xs text-white/60">{ROLE_LABELS[user.role]}</p>
          {user.patientCode && (
            <p className="mt-1 font-mono text-xs text-secondary-200">
              Code : {user.patientCode}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/15 text-sm font-medium text-white/90 transition hover:bg-white/10"
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="hidden w-64 shrink-0 bg-primary lg:block">{sidebar}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-primary/60 backdrop-blur-sm"
            aria-label="Fermer le menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative h-full w-72 max-w-[85vw] bg-primary shadow-elevated">
            <button
              type="button"
              className="absolute right-3 top-3 rounded-lg p-2 text-white/80 hover:bg-white/10"
              onClick={() => setMobileOpen(false)}
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex min-h-14 items-center justify-between border-b border-primary/8 bg-white/90 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-xl p-2 text-primary hover:bg-primary/5 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="lg:hidden">
              <Logo size="sm" showText={false} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="relative rounded-xl p-2.5 text-primary/70 hover:bg-primary/5"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent" />
            </button>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-primary">{user.name}</p>
              <p className="text-xs text-primary/55">{ROLE_LABELS[user.role]}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}
