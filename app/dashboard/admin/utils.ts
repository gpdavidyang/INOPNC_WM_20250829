import { redirect } from 'next/navigation'
import { getProfile } from '@/app/actions/shared/profile'
import type { Profile } from '@/types'

export async function requireAdminProfile(): Promise<Profile> {
  const result = await getProfile()

  if (!result.success || !result.data) {
    redirect('/auth/login')
  }

  const profile = result.data

  if (profile.role !== 'admin' && profile.role !== 'system_admin') {
    redirect('/dashboard')
  }

  return profile
}
