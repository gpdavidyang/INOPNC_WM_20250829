'use client'

// Ultimate fallback for production environment
// Uses client-side Supabase to get user ID, then calls direct server action

import { createClient } from '@/lib/supabase/client'
import { getCurrentUserSiteDirect, getUserSiteHistoryDirect } from './site-info-direct'
import { getCurrentUserSite, getUserSiteHistory } from './site-info'

const log = (...args: any[]) => {
  console.log('[SITE-INFO-FALLBACK]', ...args)
}

export async function getCurrentUserSiteUltimate() {
  const supabase = createClient()
  
  try {
    log('Starting ultimate fallback...')
    
    // 1. First try regular server action
    log('Trying regular server action...')
    const regularResult = await getCurrentUserSite()
    
    if (regularResult.success) {
      log('Regular server action succeeded')
      return regularResult
    }
    
    log('Regular server action failed, trying fallback...')
    
    // 2. Get user from client
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      log('No client user, cannot proceed')
      return { success: false, error: 'Not authenticated' }
    }
    
    log('Got client user:', user.email)
    
    // 3. Call direct server action with user ID
    const directResult = await getCurrentUserSiteDirect(user.id)
    
    if (directResult.success) {
      log('Direct query succeeded')
      return directResult
    }
    
    // 4. Last resort - query directly from client
    log('Server actions failed, querying from client...')
    
    const { data: assignments, error: clientError } = await supabase
      .from('site_assignments')
      .select(`
        *,
        sites:site_id (
          id,
          name,
          address,
          description,
          status,
          manager_name,
          construction_manager_phone,
          safety_manager_name,
          safety_manager_phone,
          accommodation_name,
          accommodation_address,
          work_process,
          work_section,
          component_name
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('assigned_date', { ascending: false })
      .limit(1)
      .single()
    
    if (clientError || !assignments) {
      log('Client query failed:', clientError)
      return { success: false, error: 'No site assignment found' }
    }
    
    const site = assignments.sites
    
    const result = {
      site_id: site.id,
      site_name: site.name,
      site_address: site.address,
      site_status: site.status,
      manager_name: site.manager_name || '김현장',
      manager_phone: site.construction_manager_phone || '010-1234-5678',
      safety_manager_name: site.safety_manager_name || '이안전',
      safety_manager_phone: site.safety_manager_phone || '010-2345-6789',
      accommodation_name: site.accommodation_name || '현장 숙소',
      accommodation_address: site.accommodation_address || site.address,
      work_instructions: site.work_process || '일반 건설 작업',
      work_section: site.work_section || 'A구역',
      component_name: site.component_name || '주요 시설물',
      assigned_date: assignments.assigned_date,
      role: assignments.role
    }
    
    log('Client query succeeded:', result.site_name)
    return { success: true, data: result, isClientFallback: true }
    
  } catch (error) {
    log('Ultimate fallback error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export async function getUserSiteHistoryUltimate() {
  const supabase = createClient()
  
  try {
    // 1. Try regular server action first
    const regularResult = await getUserSiteHistory()
    
    if (regularResult.success) {
      return regularResult
    }
    
    // 2. Get user from client
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { success: false, error: 'Not authenticated' }
    }
    
    // 3. Try direct server action
    const directResult = await getUserSiteHistoryDirect(user.id)
    
    if (directResult.success) {
      return directResult
    }
    
    // 4. Last resort - client query
    const { data: assignments, error } = await supabase
      .from('site_assignments')
      .select(`
        *,
        sites:site_id (
          id,
          name,
          address,
          status
        )
      `)
      .eq('user_id', user.id)
      .order('assigned_date', { ascending: false })
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    const history = assignments?.map(a => ({
      site_id: a.sites?.id,
      site_name: a.sites?.name,
      site_address: a.sites?.address,
      assigned_date: a.assigned_date,
      unassigned_date: a.unassigned_date,
      is_active: a.is_active,
      role: a.role
    })) || []
    
    return { success: true, data: history, isClientFallback: true }
    
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}