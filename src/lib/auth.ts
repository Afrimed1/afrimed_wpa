import type { Profile, StaffRole } from '@/types/database'
import type { AuthUser } from '@/types'

export function profileToAuthUser(profile: Profile): AuthUser {
  return {
    id: profile.id,
    role: profile.role,
    email: profile.email,
    name: `${profile.first_name} ${profile.last_name}`.trim(),
    firstName: profile.first_name,
    lastName: profile.last_name,
    establishmentId: profile.establishment_id,
  }
}

export function generateTemporaryPassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let password = ''
  for (let i = 0; i < length; i += 1) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export const STAFF_ROLE_OPTIONS: Array<{
  value: Exclude<StaffRole, 'admin'>
  label: string
}> = [
  { value: 'doctor', label: 'Médecin' },
  { value: 'lab', label: 'Laborantin' },
]
