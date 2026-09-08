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
        { label: 'Accueil', path: '/doctor', icon: 'Home' },
        { label: 'Nouveau patient', path: '/doctor/nouveau-patient', icon: 'UserPlus' },
        { label: 'Patients', path: '/doctor/patients', icon: 'UserSearch' },
        { label: 'Consultation', path: '/doctor/consultations', icon: 'Stethoscope' },
        { label: 'Rendez-vous', path: '/doctor/rendez-vous', icon: 'CalendarDays' },
        { label: 'Dossier médical', path: '/doctor/dossier-medical', icon: 'FolderHeart' },
        { label: 'Santé publique', path: '/doctor/sante-publique', icon: 'Globe2' },
        { label: 'Paramètres', path: '/doctor/parametres', icon: 'Settings' },
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
