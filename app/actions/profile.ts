'use server'

import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth/session'
import type { Profile } from '@/types'

export async function getProfile() {
  try {
    const supabase = createClient()
    const user = await getAuthenticatedUser()
    
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) throw error

    return { success: true, data: data as Profile }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateProfile(updates: Partial<Profile>) {
  try {
    const supabase = createClient()
    const user = await getAuthenticatedUser()
    
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error

    return { success: true, data: data as Profile }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getProfiles(filters?: {
  role?: string
  organization_id?: string
  site_id?: string
}) {
  try {
    const supabase = createClient()
    
    let query = supabase
      .from('profiles')
      .select('*')
      .eq('is_active', true)
    
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
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}