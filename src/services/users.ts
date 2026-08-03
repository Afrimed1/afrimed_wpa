import { getAccessToken, isSupabaseConfigured } from '@/lib/supabase'
import type { Profile, StaffRole } from '@/types/database'

export interface CreateStaffInput {
  firstName: string
  lastName: string
  email: string
  role: Exclude<StaffRole, 'admin'>
  establishmentId: string
}

export interface CreateStaffResult {
  success: boolean
  temporaryPassword?: string
  error?: string
}

async function adminFetch(path: string, init: RequestInit = {}) {
  const token = await getAccessToken()
  if (!token) {
    throw new Error('Session expiree. Reconnectez-vous.')
  }

  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload.error || `Erreur API (${response.status})`)
  }
  return payload
}

export async function fetchEstablishmentProfiles(
  establishmentId: string,
): Promise<Profile[]> {
  if (!isSupabaseConfigured) return []

  const payload = await adminFetch(
    `/api/admin/profiles?establishmentId=${encodeURIComponent(establishmentId)}`,
  )
  return (payload.data as Profile[]) ?? []
}

export async function createStaffAccount(
  input: CreateStaffInput,
): Promise<CreateStaffResult> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase non configure.' }
  }

  try {
    const payload = await adminFetch('/api/admin/staff', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return {
      success: true,
      temporaryPassword: payload.temporaryPassword as string,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Creation impossible.',
    }
  }
}

export async function setProfileActive(
  profileId: string,
  isActive: boolean,
): Promise<void> {
  await adminFetch(`/api/admin/staff/${encodeURIComponent(profileId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  })
}
