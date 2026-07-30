import { Navigate, Outlet } from 'react-router-dom'
import { LoadingScreen } from '@/components/LoadingScreen'
import { AppShell } from '@/components/layout/AppShell'
import { useAuth } from '@/context/AuthContext'
import { getHomePath } from '@/lib/navigation'
import type { UserRole } from '@/types'

interface ProtectedRouteProps {
  allowedRoles: UserRole[]
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={getHomePath(user.role)} replace />
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}

export function PublicOnlyRoute() {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (isAuthenticated && user) {
    return <Navigate to={getHomePath(user.role)} replace />
  }

  return <Outlet />
}
