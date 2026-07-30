import { generateTemporaryPassword } from '@/lib/auth'
import {
  getSupabase,
  getSupabaseAuthHelper,
  isSupabaseConfigured,
} from '@/lib/supabase'
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

export async function fetchEstablishmentProfiles(
  establishmentId: string,
): Promise<Profile[]> {
  const { data, error } = await getSupabase()
    .from('profiles')
    .select('*')
    .eq('establishment_id', establishmentId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function createStaffAccount(
  input: CreateStaffInput,
): Promise<CreateStaffResult> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase non configuré.' }
  }

  const email = input.email.trim().toLowerCase()
  const temporaryPassword = generateTemporaryPassword()

  const { data: signUpData, error: signUpError } =
    await getSupabaseAuthHelper().auth.signUp({
      email,
      password: temporaryPassword,
      options: {
        data: {
          first_name: input.firstName,
          last_name: input.lastName,
          role: input.role,
        },
      },
    })

  if (signUpError || !signUpData.user) {
    return {
      success: false,
      error: signUpError?.message ?? 'Impossible de créer le compte.',
    }
  }

  const { error: profileError } = await getSupabase().from('profiles').insert({
    id: signUpData.user.id,
    establishment_id: input.establishmentId,
    role: input.role,
    first_name: input.firstName.trim(),
    last_name: input.lastName.trim(),
    email,
    is_active: true,
  })

  if (profileError) {
    return {
      success: false,
      error: profileError.message,
    }
  }

  return { success: true, temporaryPassword }
}

export async function setProfileActive(
  profileId: string,
  isActive: boolean,
): Promise<void> {
  const { error } = await getSupabase()
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', profileId)

  if (error) throw error
}
