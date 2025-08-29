'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export async function getSignupRequests(filter: 'all' | 'pending' | 'approved' | 'rejected' = 'pending') {
  const supabase = createClient()
  
  try {
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (!profile || (profile.role !== 'admin' && profile.role !== 'system_admin')) {
      return { success: false, error: 'Forbidden' }
    }
    
    // Get signup requests
    let query = supabase
      .from('signup_requests')
      .select(`
        *,
        approver:profiles!signup_requests_approved_by_fkey(
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false })
    
    if (filter !== 'all') {
      query = query.eq('status', filter)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error('Error fetching signup requests:', error)
    return { success: false, error: error.message }
  }
}

export async function approveSignupRequest(
  requestId: string, 
  organizationId?: string, 
  siteIds?: string[]
) {
  const supabase = createClient()
  const serviceClient = createServiceRoleClient()
  
  try {
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (!profile || (profile.role !== 'admin' && profile.role !== 'system_admin')) {
      return { success: false, error: 'Forbidden' }
    }
    
    // Get the signup request
    const { data: request, error: fetchError } = await supabase
      .from('signup_requests')
      .select('*')
      .eq('id', requestId)
      .single()
    
    if (fetchError || !request) {
      throw new Error('Signup request not found')
    }
    
    if (request.status !== 'pending') {
      throw new Error('Request has already been processed')
    }
    
    // Validate required assignments based on role
    if ((request.requested_role === 'worker' || request.requested_role === 'site_manager') && !organizationId) {
      throw new Error('작업자와 현장관리자는 소속 업체가 필요합니다.')
    }
    
    if (request.requested_role === 'worker' && (!siteIds || siteIds.length === 0)) {
      throw new Error('작업자는 최소 1개 이상의 현장 배정이 필요합니다.')
    }
    
    // Generate a temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase()
    
    // Create user with service role client
    const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
      email: request.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: request.full_name,
        phone: request.phone,
        company_name: request.company_name
      }
    })
    
    if (authError) throw authError
    
    // Create profile for the new user
    const { error: profileError } = await serviceClient
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: request.email,
        full_name: request.full_name,
        role: request.requested_role,
        phone: request.phone,
        company_name: request.company_name,
        organization_id: organizationId
      })
    
    if (profileError && profileError.code !== '23505') { // Ignore duplicate key error
      console.error('Profile creation error:', profileError)
    }
    
    // Create site assignments if provided
    if (siteIds && siteIds.length > 0) {
      const siteAssignments = siteIds.map(siteId => ({
        user_id: authData.user.id,
        site_id: siteId,
        role: request.requested_role,
        assigned_date: new Date().toISOString(),
        assigned_by: user.id,
        status: 'active'
      }))
      
      const { error: assignmentError } = await serviceClient
        .from('site_assignments')
        .insert(siteAssignments)
      
      if (assignmentError) {
        console.error('Site assignment error:', assignmentError)
        // Don't fail the whole process, just log the error
      }
    }
    
    // Update signup request status
    const { error: updateError } = await supabase
      .from('signup_requests')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: user.id
      })
      .eq('id', requestId)
    
    if (updateError) throw updateError
    
    // Get organization and site names for the response message
    let organizationName = ''
    let siteNames: string[] = []
    
    if (organizationId) {
      const { data: org } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', organizationId)
        .single()
      organizationName = org?.name || ''
    }
    
    if (siteIds && siteIds.length > 0) {
      const { data: sites } = await supabase
        .from('sites')
        .select('name')
        .in('id', siteIds)
      siteNames = sites?.map(s => s.name) || []
    }
    
    // Build success message
    let message = `${request.full_name}님의 가입이 승인되었습니다.`
    if (organizationName) {
      message += ` (소속: ${organizationName})`
    }
    if (siteNames.length > 0) {
      message += ` (배정 현장: ${siteNames.join(', ')})`
    }
    
    // TODO: Send welcome email with temporary password
    console.log('Welcome email would be sent to:', request.email, 'with password:', tempPassword)
    
    return { 
      success: true, 
      message,
      tempPassword // In production, this should be sent via email
    }
  } catch (error: any) {
    console.error('Error approving signup request:', error)
    return { success: false, error: error.message }
  }
}

export async function rejectSignupRequest(requestId: string, reason: string) {
  const supabase = createClient()
  
  try {
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (!profile || (profile.role !== 'admin' && profile.role !== 'system_admin')) {
      return { success: false, error: 'Forbidden' }
    }
    
    // Get the signup request
    const { data: request, error: fetchError } = await supabase
      .from('signup_requests')
      .select('*')
      .eq('id', requestId)
      .single()
    
    if (fetchError || !request) {
      throw new Error('Signup request not found')
    }
    
    if (request.status !== 'pending') {
      throw new Error('Request has already been processed')
    }
    
    // Update signup request status
    const { error: updateError } = await supabase
      .from('signup_requests')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        approved_at: new Date().toISOString(),
        approved_by: user.id
      })
      .eq('id', requestId)
    
    if (updateError) throw updateError
    
    return { 
      success: true, 
      message: `${request.full_name}님의 가입이 거절되었습니다.`
    }
  } catch (error: any) {
    console.error('Error rejecting signup request:', error)
    return { success: false, error: error.message }
  }
}