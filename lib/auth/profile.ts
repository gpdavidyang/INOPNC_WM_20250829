import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from './server'
import type { Profile } from '@/types'

export async function getProfile(): Promise<Profile | null> {
  try {
    const supabase = createClient()
    const user = await getAuthenticatedUser()

    if (!user) {
      return null
    }

    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()

    if (error) {
      console.error('Error fetching profile:', error)
      return null
    }

    return data as Profile
  } catch (error) {
    console.error('Error getting profile:', error)
    return null
  }
}
