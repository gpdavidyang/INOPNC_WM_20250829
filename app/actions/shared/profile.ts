import { createClient } from '@/lib/supabase/server'
import { getAuthForClient } from '@/lib/auth/ultra-simple'
;('use server')

import type { Profile } from '@/types'

export async function getProfile() {
  try {
    const supabase = createClient()
    const auth = await getAuthForClient(supabase)

    if (!auth) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data, error } = await supabase.from('profiles').select('*').eq('id', auth.userId).single()

    if (error) throw error

    return { success: true, data: data as Profile }
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message }
  }
}

export async function updateProfile(updates: Partial<Profile>) {
  try {
    const supabase = createClient()
    const auth = await getAuthForClient(supabase)

    if (!auth) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', auth.userId)
      .select()
      .single()

    if (error) throw error

    return { success: true, data: data as Profile }
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message }
  }
}

export async function getProfiles(filters?: {
  role?: string
  organization_id?: string
  site_id?: string
}) {
  try {
    const supabase = createClient()

    let query = supabase.from('profiles').select('*').eq('is_active', true)

    if (filters?.role) {
      query = query.eq('role', filters.role)
    }
    if (filters?.organization_id) {
      query = query.eq('organization_id', filters.organization_id)
    }
    if (filters?.site_id) {
      query = query.eq('site_id', filters.site_id)
    }

    const { data, error } = await query.order('full_name')

    if (error) throw error

    return { success: true, data: data as Profile[] }
  } catch (error: unknown) {
    return { success: false, error: error.message }
  }
}
