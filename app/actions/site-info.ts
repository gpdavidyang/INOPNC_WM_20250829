'use server'

import { createClient } from '@/lib/supabase/server'

const log = (...args: any[]) => {
  // Always log for debugging in both dev and production (for deployment troubleshooting)
  console.log('[SITE-INFO DEBUG]', ...args)
}

// 현재 사용자가 배정된 현장 정보 조회
export async function getCurrentUserSite() {
  const supabase = createClient()
  
  try {
    log('getCurrentUserSite: Starting... (env:', process.env.NODE_ENV, ')')
    
    // 배포 환경에서 쿠키 상태 확인
    try {
      const { data: session } = await supabase.auth.getSession()
      log('getCurrentUserSite: Session check result:', { 
        hasSession: !!session,
        hasAccessToken: !!session?.access_token,
        env: process.env.NODE_ENV
      })
    } catch (sessionError) {
      log('getCurrentUserSite: Session check error:', sessionError)
    }
    
    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    log('getCurrentUserSite: User check result:', { 
      user: user?.id, 
      email: user?.email,
      authError: authError?.message,
      timestamp: new Date().toISOString()
    })
    
    if (authError || !user) {
      log('getCurrentUserSite: Authentication failed - this is expected in deployment without session')
      return { success: false, error: 'Authentication required' }
    }

    // 먼저 간단한 쿼리로 테스트
    log('getCurrentUserSite: Testing sites table access...')
    const { data: sitesTest, error: sitesTestError } = await supabase
      .from('sites')
      .select('id, name')
      .limit(1)
    
    log('getCurrentUserSite: Sites test result:', { sitesTest, sitesTestError })

    // site_assignments 테이블도 직접 확인
    log('getCurrentUserSite: Testing site assignments...')
    const { data: assignmentsTest, error: assignmentsTestError } = await supabase
      .from('site_assignments')
      .select('id, user_id, site_id, is_active')
      .eq('user_id', user.id)
    
    log('getCurrentUserSite: Assignments test result:', { assignmentsTest, assignmentsTestError })

    // 만약 배정이 없다면 강남 A현장에 자동으로 배정 (개발/테스트용)
    if (!assignmentsTest || assignmentsTest.length === 0) {
      log('getCurrentUserSite: No assignments found, attempting auto-assignment...')
      
      // 강남 A현장 찾기
      const { data: testSite, error: testSiteError } = await supabase
        .from('sites')
        .select('id')
        .eq('name', '강남 A현장')
        .single()
      
      if (!testSiteError && testSite) {
        log('getCurrentUserSite: Auto-assigning to test site:', testSite.id)
        
        const { data: newAssignment, error: assignError } = await supabase
          .from('site_assignments')
          .insert({
            user_id: user.id,
            site_id: testSite.id,
            assigned_date: new Date().toISOString().split('T')[0],
            is_active: true,
            role: 'worker'
          })
          .select()
        
        log('getCurrentUserSite: Auto-assignment result:', { newAssignment, assignError })
      }
    }

    // Direct query approach - get active site assignment with site details
    log('getCurrentUserSite: Querying active assignment with site details...')
    
    const { data: assignments, error } = await supabase
      .from('site_assignments')
      .select(`
        *,
        sites (
          id,
          name,
          address,
          description,
          work_process,
          work_section,
          component_name,
          manager_name,
          construction_manager_phone,
          safety_manager_name,
          safety_manager_phone,
          accommodation_name,
          accommodation_address,
          status,
          start_date,
          end_date
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('assigned_date', { ascending: false })

    // Get the most recent active assignment
    const assignment = assignments?.[0] || null

    log('getCurrentUserSite: Direct query result:', { assignments: assignments?.length, error, timestamp: new Date().toISOString() })

    if (error) {
      console.error('getCurrentUserSite: Query error:', error)
      throw error
    }

    if (!assignment || !assignment.sites) {
      log('getCurrentUserSite: No assignment or site data')
      return { success: true, data: null }
    }

    // Convert to the expected format
    const site = assignment.sites
    const siteData = {
      site_id: site.id,
      site_name: site.name,
      site_address: site.address,
      site_status: site.status,
      start_date: site.start_date,
      end_date: site.end_date,
      assigned_date: assignment.assigned_date,
      unassigned_date: assignment.unassigned_date,
      user_role: assignment.role,
      work_process: site.work_process,
      work_section: site.work_section,
      component_name: site.component_name,
      manager_name: site.manager_name,
      construction_manager_phone: site.construction_manager_phone,
      safety_manager_name: site.safety_manager_name,
      safety_manager_phone: site.safety_manager_phone,
      accommodation_name: site.accommodation_name,
      accommodation_address: site.accommodation_address,
      is_active: assignment.is_active
    }
    
    log('getCurrentUserSite: Converted site data:', siteData)

    if (!siteData) {
      log('getCurrentUserSite: No site data returned')
      return { success: true, data: null }
    }

    // Fetch site documents (PTW and Blueprint) for the current site
    try {
      log('getCurrentUserSite: Fetching site documents for site_id:', siteData.site_id)
      
      const { data: documents, error: documentsError } = await supabase
        .from('site_documents')
        .select('id, title, file_name, file_url, document_type, description, created_at')
        .eq('site_id', siteData.site_id)
        .in('document_type', ['ptw', 'blueprint'])
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (documentsError) {
        log('getCurrentUserSite: Document query error (non-fatal):', documentsError)
      } else {
        log('getCurrentUserSite: Found documents:', documents?.length || 0)
        
        // Add documents to site data
        const ptwDocument = documents?.find(doc => doc.document_type === 'ptw')
        const blueprintDocument = documents?.find(doc => doc.document_type === 'blueprint')
        
        if (ptwDocument) {
          siteData.ptw_document = ptwDocument
          log('getCurrentUserSite: Added PTW document:', ptwDocument.title)
        }
        
        if (blueprintDocument) {
          siteData.blueprint_document = blueprintDocument
          log('getCurrentUserSite: Added blueprint document:', blueprintDocument.title)
        }
      }
    } catch (docError) {
      log('getCurrentUserSite: Error fetching documents (non-fatal):', docError)
    }

    log('getCurrentUserSite: Success')
    return { success: true, data: siteData }
  } catch (error) {
    console.error('Error fetching current user site:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch site information'
    return { success: false, error: errorMessage }
  }
}

// 사용자의 현장 참여 이력 조회
export async function getUserSiteHistory() {
  const supabase = createClient()
  
  try {
    log('getUserSiteHistory: Starting...')
    
    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    log('getUserSiteHistory: User check result:', { user: user?.id, authError })
    
    if (authError || !user) {
      log('getUserSiteHistory: Authentication failed')
      return { success: false, error: 'Authentication required' }
    }

    // Direct query approach - get all site assignments with site details
    log('getUserSiteHistory: Querying site assignment history...')
    
    const { data, error } = await supabase
      .from('site_assignments')
      .select(`
        *,
        sites (
          id,
          name,
          address,
          description,
          work_process,
          work_section,
          component_name,
          manager_name,
          construction_manager_phone,
          safety_manager_name,
          safety_manager_phone,
          accommodation_name,
          accommodation_address,
          status,
          start_date,
          end_date
        )
      `)
      .eq('user_id', user.id)
      .order('assigned_date', { ascending: false })

    log('getUserSiteHistory: Direct query result:', { data, error, dataLength: data?.length })

    if (error) {
      console.error('getUserSiteHistory: Query error:', error)
      throw error
    }

    // Convert to the expected format
    const historyData = data?.map(assignment => {
      const site = assignment.sites
      return {
        site_id: site.id,
        site_name: site.name,
        site_address: site.address,
        site_status: site.status,
        start_date: site.start_date,
        end_date: site.end_date,
        assigned_date: assignment.assigned_date,
        unassigned_date: assignment.unassigned_date,
        user_role: assignment.role,
        work_process: site.work_process,
        work_section: site.work_section,
        component_name: site.component_name,
        manager_name: site.manager_name,
        construction_manager_phone: site.construction_manager_phone,
        safety_manager_name: site.safety_manager_name,
        safety_manager_phone: site.safety_manager_phone,
        accommodation_name: site.accommodation_name,
        accommodation_address: site.accommodation_address,
        is_active: assignment.is_active
      }
    }) || []

    log('getUserSiteHistory: Converted history data:', historyData.length, 'records')

    // Return the converted data
    log('getUserSiteHistory: Success')
    return { success: true, data: historyData }
  } catch (error) {
    console.error('Error fetching user site history:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch site history'
    return { success: false, error: errorMessage }
  }
}

// 관리자용 - 현장 목록 조회
export async function getAllSites() {
  const supabase = createClient()
  
  try {
    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // 사용자 권한 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'system_admin'].includes(profile.role)) {
      return { success: false, error: 'Insufficient permissions' }
    }

    // 모든 현장 조회
    const { data, error } = await supabase
      .from('sites')
      .select(`
        id,
        name,
        address,
        description,
        work_process,
        work_section,
        component_name,
        manager_name,
        construction_manager_phone,
        safety_manager_name,
        safety_manager_phone,
        accommodation_name,
        accommodation_address,
        status,
        start_date,
        end_date,
        created_at
      `)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error fetching all sites:', error)
    return { success: false, error: 'Failed to fetch sites list' }
  }
}

// 관리자용 - 사용자에게 현장 배정
export async function assignUserToSite(userId: string, siteId: string, role: string = 'worker') {
  const supabase = createClient()
  
  try {
    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // 관리자 권한 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'system_admin'].includes(profile.role)) {
      return { success: false, error: 'Insufficient permissions' }
    }

    // 기존 활성 배정 비활성화
    await supabase
      .from('site_assignments')
      .update({ 
        is_active: false, 
        unassigned_date: new Date().toISOString().split('T')[0] 
      })
      .eq('user_id', userId)
      .eq('is_active', true)

    // 새 현장 배정
    const { data, error } = await supabase
      .from('site_assignments')
      .insert({
        user_id: userId,
        site_id: siteId,
        role: role,
        assigned_date: new Date().toISOString().split('T')[0],
        is_active: true
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error assigning user to site:', error)
    return { success: false, error: 'Failed to assign user to site' }
  }
}

// 관리자용 - 사용자 현장 배정 해제
export async function unassignUserFromSite(userId: string) {
  const supabase = createClient()
  
  try {
    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // 관리자 권한 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'system_admin'].includes(profile.role)) {
      return { success: false, error: 'Insufficient permissions' }
    }

    // 활성 배정 비활성화
    const { data, error } = await supabase
      .from('site_assignments')
      .update({ 
        is_active: false, 
        unassigned_date: new Date().toISOString().split('T')[0] 
      })
      .eq('user_id', userId)
      .eq('is_active', true)

    if (error) {
      throw error
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error unassigning user from site:', error)
    return { success: false, error: 'Failed to unassign user from site' }
  }
}

// 현장별 작업자 목록 조회
export async function getSiteWorkers(siteId: string) {
  const supabase = createClient()
  
  try {
    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // 현장의 작업자 목록 조회
    const { data, error } = await supabase
      .from('site_assignments')
      .select(`
        id,
        assigned_date,
        unassigned_date,
        role,
        is_active,
        profiles:user_id (
          id,
          full_name,
          email,
          phone,
          role,
          status
        )
      `)
      .eq('site_id', siteId)
      .order('assigned_date', { ascending: false })

    if (error) {
      throw error
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error fetching site workers:', error)
    return { success: false, error: 'Failed to fetch site workers' }
  }
}

// 사용자가 자신의 현장을 선택하는 함수 (권한 체크 없음)
export async function selectUserSite(siteId: string) {
  const supabase = createClient()
  
  try {
    log('selectUserSite: Starting...')
    
    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    log('selectUserSite: User ID:', user.id, 'Site ID:', siteId)

    // 사용자가 해당 사이트에 배정되어 있는지 확인
    const { data: assignment, error: checkError } = await supabase
      .from('site_assignments')
      .select('*')
      .eq('user_id', user.id)
      .eq('site_id', siteId)
      .single()

    if (checkError || !assignment) {
      log('selectUserSite: User not assigned to site, creating assignment...')
      
      // 기존 활성 배정 비활성화
      await supabase
        .from('site_assignments')
        .update({ 
          is_active: false, 
          unassigned_date: new Date().toISOString().split('T')[0] 
        })
        .eq('user_id', user.id)
        .eq('is_active', true)

      // 새 배정 생성
      const { data: newAssignment, error: assignError } = await supabase
        .from('site_assignments')
        .insert({
          user_id: user.id,
          site_id: siteId,
          assigned_date: new Date().toISOString().split('T')[0],
          is_active: true,
          role: 'worker'
        })
        .select()
        .single()

      if (assignError) {
        console.error('selectUserSite: Assignment error:', assignError)
        throw assignError
      }

      log('selectUserSite: New assignment created:', newAssignment)
      return { success: true, data: newAssignment }
    }

    // 이미 배정되어 있다면 활성화만
    if (!assignment.is_active) {
      // 기존 활성 배정 비활성화
      await supabase
        .from('site_assignments')
        .update({ 
          is_active: false, 
          unassigned_date: new Date().toISOString().split('T')[0] 
        })
        .eq('user_id', user.id)
        .eq('is_active', true)

      // 현재 배정 활성화
      const { data: updated, error: updateError } = await supabase
        .from('site_assignments')
        .update({ 
          is_active: true,
          unassigned_date: null
        })
        .eq('id', assignment.id)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      log('selectUserSite: Assignment activated:', updated)
      return { success: true, data: updated }
    }

    log('selectUserSite: Assignment already active')
    return { success: true, data: assignment }
  } catch (error) {
    console.error('Error in selectUserSite:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to select site' }
  }
}

// 개발/테스트용 - 현재 사용자를 강남 A현장에 강제 배정
export async function forceAssignCurrentUserToTestSite() {
  const supabase = createClient()
  
  try {
    log('forceAssignCurrentUserToTestSite: Starting...')
    
    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    log('forceAssignCurrentUserToTestSite: User ID:', user.id)

    // 기존 활성 배정 비활성화
    const { error: deactivateError } = await supabase
      .from('site_assignments')
      .update({ 
        is_active: false, 
        unassigned_date: new Date().toISOString().split('T')[0] 
      })
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (deactivateError) {
      log('forceAssignCurrentUserToTestSite: Deactivate error (might be expected):', deactivateError)
    }

    // 강남 A현장 찾기
    const { data: testSite, error: testSiteError } = await supabase
      .from('sites')
      .select('id')
      .eq('name', '강남 A현장')
      .single()

    if (testSiteError || !testSite) {
      console.error('forceAssignCurrentUserToTestSite: Test site not found:', testSiteError)
      return { success: false, error: 'Test site "강남 A현장" not found' }
    }

    log('forceAssignCurrentUserToTestSite: Found test site:', testSite.id)

    // 새 배정 생성
    const { data: newAssignment, error: assignError } = await supabase
      .from('site_assignments')
      .insert({
        user_id: user.id,
        site_id: testSite.id,
        assigned_date: new Date().toISOString().split('T')[0],
        is_active: true,
        role: 'worker'
      })
      .select()
      .single()

    if (assignError) {
      console.error('forceAssignCurrentUserToTestSite: Assignment error:', assignError)
      throw assignError
    }

    log('forceAssignCurrentUserToTestSite: Assignment created:', newAssignment)
    return { success: true, data: newAssignment }
  } catch (error) {
    console.error('Error in forceAssignCurrentUserToTestSite:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to assign test site' }
  }
}