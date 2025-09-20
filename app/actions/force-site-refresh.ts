import { createClient } from "@/lib/supabase/server"
import { getAuthForClient } from '@/lib/auth/ultra-simple'
'use server'


// 관리자나 현장관리자가 자신의 현장 정보를 강제로 새로고침하는 함수
export async function forceSiteRefresh() {
  const supabase = createClient()
  
  try {
    console.log('🔧 [FORCE-REFRESH] Starting force site refresh...')
    
    // 현재 사용자 확인
    const auth = await getAuthForClient(supabase)
    console.log('🔧 [FORCE-REFRESH] User check:', { user: auth?.userId })
    
    if (!auth) {
      return { success: false, error: 'Authentication required' }
    }

    // 사용자 프로필 확인
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, role, full_name')
      .eq('id', auth.userId)
      .single()

    if (profileError || !profile) {
      console.log('🔧 [FORCE-REFRESH] Profile error:', profileError)
      return { success: false, error: 'Profile not found' }
    }

    console.log('🔧 [FORCE-REFRESH] Profile found:', { email: profile.email, role: profile.role })

    // 모든 site_assignments 조회 (활성/비활성 모두)
    const { data: allAssignments, error: assignError } = await supabase
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
      .eq('user_id', auth.userId)
      .order('assigned_date', { ascending: false })

    console.log('🔧 [FORCE-REFRESH] All assignments:', { count: allAssignments?.length || 0, error: assignError })

    if (assignError) {
      return { success: false, error: `Assignment query error: ${assignError.message}` }
    }

    // 활성 배정 찾기
    const activeAssignment = allAssignments?.find((a: unknown) => a.is_active) || null
    console.log('🔧 [FORCE-REFRESH] Active assignment:', { 
      found: !!activeAssignment, 
      siteName: activeAssignment?.sites?.name 
    })

    if (activeAssignment && activeAssignment.sites) {
      const site = activeAssignment.sites
      const siteData = {
        site_id: site.id,
        site_name: site.name,
        site_address: site.address,
        site_status: site.status,
        start_date: site.start_date,
        end_date: site.end_date,
        assigned_date: activeAssignment.assigned_date,
        unassigned_date: activeAssignment.unassigned_date,
        user_role: activeAssignment.role,
        work_process: site.work_process,
        work_section: site.work_section,
        component_name: site.component_name,
        manager_name: site.manager_name,
        construction_manager_phone: site.construction_manager_phone,
        safety_manager_name: site.safety_manager_name,
        safety_manager_phone: site.safety_manager_phone,
        accommodation_name: site.accommodation_name,
        accommodation_address: site.accommodation_address,
        is_active: activeAssignment.is_active
      }

      console.log('🔧 [FORCE-REFRESH] Site data created:', siteData.site_name)
      return { success: true, data: siteData, profile }
    }

    // 활성 배정이 없다면 manager@inopnc.com이나 production@inopnc.com인 경우 강남 A현장에 자동 배정
    if (profile.email === 'manager@inopnc.com' || profile.email === 'production@inopnc.com') {
      console.log('🔧 [FORCE-REFRESH] Auto-assigning manager to test site...')

      // 강남 A현장 찾기
      const { data: testSite, error: testSiteError } = await supabase
        .from('sites')
        .select('*')
        .eq('name', '강남 A현장')
        .single()

      if (testSiteError || !testSite) {
        console.log('🔧 [FORCE-REFRESH] Test site not found:', testSiteError)
        return { success: false, error: 'Test site "강남 A현장" not found' }
      }

      // 기존 활성 배정 비활성화
      await supabase
        .from('site_assignments')
        .update({ 
          is_active: false, 
          unassigned_date: new Date().toISOString().split('T')[0] 
        })
        .eq('user_id', auth.userId)
        .eq('is_active', true)

      // 새 배정 생성
      const { data: newAssignment, error: newAssignError } = await supabase
        .from('site_assignments')
        .insert({
          user_id: auth.userId,
          site_id: testSite.id,
          assigned_date: new Date().toISOString().split('T')[0],
          is_active: true,
          role: profile.role === 'site_manager' ? 'site_manager' : 'worker'
        })
        .select()
        .single()

      if (newAssignError) {
        console.log('🔧 [FORCE-REFRESH] Auto-assignment failed:', newAssignError)
        return { success: false, error: `Auto-assignment failed: ${newAssignError.message}` }
      }

      console.log('🔧 [FORCE-REFRESH] Auto-assignment successful')

      const siteData = {
        site_id: testSite.id,
        site_name: testSite.name,
        site_address: testSite.address,
        site_status: testSite.status,
        start_date: testSite.start_date,
        end_date: testSite.end_date,
        assigned_date: newAssignment.assigned_date,
        unassigned_date: newAssignment.unassigned_date,
        user_role: newAssignment.role,
        work_process: testSite.work_process,
        work_section: testSite.work_section,
        component_name: testSite.component_name,
        manager_name: testSite.manager_name,
        construction_manager_phone: testSite.construction_manager_phone,
        safety_manager_name: testSite.safety_manager_name,
        safety_manager_phone: testSite.safety_manager_phone,
        accommodation_name: testSite.accommodation_name,
        accommodation_address: testSite.accommodation_address,
        is_active: newAssignment.is_active
      }

      return { success: true, data: siteData, profile, autoAssigned: true }
    }

    // 배정이 없고 자동 배정 대상도 아님
    console.log('🔧 [FORCE-REFRESH] No assignment found and not eligible for auto-assignment')
    return { 
      success: true, 
      data: null, 
      profile,
      message: 'No active site assignment found. Contact admin for site assignment.' 
    }

  } catch (error) {
    console.error('🔧 [FORCE-REFRESH] Error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
