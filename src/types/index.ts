export type UserRole = 'admin' | 'doctor' | 'lab' | 'patient'

export interface AuthUser {
  id?: string
  role: UserRole
  email?: string
  name: string
  firstName?: string
  lastName?: string
  patientCode?: string
  patientId?: string
  establishmentId?: string
}

export interface NavItem {
  label: string
  path: string
  icon: string
  description?: string
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrateur',
  doctor: 'Médecin',
  lab: 'Laborantin',
  patient: 'Patient',
}

export const DEMO_ACCOUNTS: Record<
  Exclude<UserRole, 'patient'>,
  { email: string; password: string; name: string }
> = {
  admin: {
    email: 'admin@afrimed.bf',
    password: 'demo1234',
    name: 'Admin Établissement',
  },
  doctor: {
    email: 'medecin@afrimed.bf',
    password: 'demo1234',
    name: 'Dr. Ouédraogo',
  },
  lab: {
    email: 'labo@afrimed.bf',
    password: 'demo1234',
    name: 'Lab. Compaoré',
  },
}

export interface LoginResult {
  success: boolean
  error?: string
  role?: UserRole
}
