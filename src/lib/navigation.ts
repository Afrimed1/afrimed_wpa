import type { UserRole } from '@/types'

export function getHomePath(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin'
    case 'doctor':
      return '/doctor'
    case 'lab':
      return '/lab'
    case 'patient':
      return '/patient'
  }
}

export function getNavItems(role: UserRole) {
  switch (role) {
    case 'admin':
      return [
        { label: 'Tableau de bord', path: '/admin', icon: 'LayoutDashboard' },
        { label: 'Utilisateurs', path: '/admin/users', icon: 'Users' },
        { label: 'Statistiques', path: '/admin/stats', icon: 'BarChart3' },
      ]
    case 'doctor':
      return [
        { label: 'Tableau de bord', path: '/doctor', icon: 'LayoutDashboard' },
        { label: 'Patients', path: '/doctor/patients', icon: 'UserSearch' },
        {
          label: 'Consultations',
          path: '/doctor/consultations',
          icon: 'Stethoscope',
        },
      ]
    case 'lab':
      return [
        { label: 'Tableau de bord', path: '/lab', icon: 'LayoutDashboard' },
        {
          label: 'Demandes d\'examens',
          path: '/lab/requests',
          icon: 'FlaskConical',
        },
      ]
    case 'patient':
      return [
        { label: 'Mon dossier', path: '/patient', icon: 'FolderHeart' },
        {
          label: 'Ordonnances',
          path: '/patient/prescriptions',
          icon: 'Pill',
        },
        { label: 'Suivi', path: '/patient/suivi', icon: 'CalendarCheck' },
      ]
  }
}
