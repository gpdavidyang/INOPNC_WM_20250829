import { createClient } from "@/lib/supabase/server"
'use server'


const log = (...args: unknown[]) => {
  console.log('[SITE-INFO-DIRECT]', ...args)
}

// Direct database query using user ID (bypasses cookie issues)
export async function getCurrentUserSiteDirect(userId?: string) {
  try {
    log('Starting direct query...')
    
    // First try with regular client to get user ID
    let actualUserId = userId
    
    if (!actualUserId) {
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        log('No authenticated user found, trying service role...')
        // If no user from cookies, we can't proceed without userId
        return { success: false, error: 'User ID required for direct query' }
      }
      
      actualUserId = user.id
    }
    
    log('Using user ID:', actualUserId)
    
    // Use service role client for direct database access
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Get user profile first
    const { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('*')
      .eq('id', actualUserId)
      .single()
    
    if (profileError || !profile) {
      log('Profile not found:', profileError)
      return { success: false, error: 'Profile not found' }
    }
    
    log('Found profile:', profile.email, profile.role)
    
    // Get active site assignment
    const { data: assignments, error: assignmentError } = await serviceClient
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
          component_name,
          blueprint_document_id,
          ptw_document_id
        )
      `)
      .eq('user_id', actualUserId)
      .eq('is_active', true)
      .order('assigned_date', { ascending: false })
      .limit(1)
    
    if (assignmentError) {
      log('Assignment query error:', assignmentError)
      return { success: false, error: assignmentError.message }
    }
    
    if (!assignments || assignments.length === 0) {
      log('No active assignments found')
      return { success: false, error: 'No active site assignment' }
    }
    
    const assignment = assignments[0]
    const site = assignment.sites
    
    if (!site) {
      log('Site data missing in assignment')
      return { success: false, error: 'Site data not found' }
    }
    
    // Format the response
    const result = {
      site_id: site.id,
      site_name: site.name,
      site_address: site.address,
      site_status: site.status,
      manager_name: site.manager_name || site.description?.split('담당: ')[1]?.split(',')[0] || '김현장',
      manager_phone: site.construction_manager_phone || '010-1234-5678',
      safety_manager_name: site.safety_manager_name || '이안전',
      safety_manager_phone: site.safety_manager_phone || '010-2345-6789',
      accommodation_name: site.accommodation_name || '현장 숙소',
      accommodation_address: site.accommodation_address || site.address,
      work_instructions: site.work_process || '일반 건설 작업',
      work_section: site.work_section || 'A구역',
      component_name: site.component_name || '주요 시설물',
      blueprint_document_id: site.blueprint_document_id,
      ptw_document_id: site.ptw_document_id,
      assigned_date: assignment.assigned_date,
      role: assignment.role || profile.role
    }
    
    log('Successfully retrieved site data:', result.site_name)
    return { success: true, data: result }
    
  } catch (error) {
    log('Unexpected error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Get user site history using direct query
export async function getUserSiteHistoryDirect(userId?: string) {
  try {
    log('Getting site history...')
    
    // First try with regular client to get user ID
    let actualUserId = userId
    
    if (!actualUserId) {
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        return { success: false, error: 'User ID required for direct query' }
      }
      
      actualUserId = user.id
    }
    
    // Use service role client
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Get all site assignments (including inactive)
    const { data: assignments, error } = await serviceClient
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
      .eq('user_id', actualUserId)
      .order('assigned_date', { ascending: false })
    
    if (error) {
      log('History query error:', error)
      return { success: false, error: error.message }
    }
    
    const history = assignments?.map((a: unknown) => ({
      site_id: a.sites?.id,
      site_name: a.sites?.name,
      site_address: a.sites?.address,
      assigned_date: a.assigned_date,
      unassigned_date: a.unassigned_date,
      is_active: a.is_active,
      role: a.role
    })) || []
    
    log('Found', history.length, 'site history records')
    return { success: true, data: history }
    
  } catch (error) {
    log('Unexpected error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}