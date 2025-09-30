'use server'

import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { requireServerActionAuth, assertOrgAccess, type SimpleAuth } from '@/lib/auth/ultra-simple'
import { AppError, ErrorType, logError } from '@/lib/error-handling'
import type { Database } from '@/types/database'

const log = (...args: unknown[]) => {
  // Enable logging to debug site info issues
  console.log('[SITE-INFO DEBUG]', ...args)
}

type SupabaseServerClient = SupabaseClient<Database>

async function getSiteOrganization(
  supabase: SupabaseServerClient,
  siteId: string
): Promise<string | undefined> {
  const { data, error } = await supabase
    .from('sites')
    .select('organization_id')
    .eq('id', siteId)
    .single()

  if (error || !data) {
    throw new AppError('현장 정보를 찾을 수 없습니다.', ErrorType.NOT_FOUND, 404)
  }

  return data.organization_id ?? undefined
}

async function ensureSiteAccess(supabase: SupabaseServerClient, auth: SimpleAuth, siteId?: string) {
  if (!siteId || !auth.isRestricted) {
    return
  }

  const organizationId = await getSiteOrganization(supabase, siteId)
  await assertOrgAccess(auth, organizationId)
}

function requireAdminRole(auth: SimpleAuth) {
  if (!auth.role || !['admin', 'system_admin'].includes(auth.role)) {
    throw new AppError('관리자 권한이 필요합니다.', ErrorType.AUTHORIZATION, 403)
  }
}

// 현재 사용자가 배정된 현장 정보 조회
export async function getCurrentUserSite() {
  try {
    const supabase = createClient()

    log('getCurrentUserSite: Starting... (env:', process.env.NODE_ENV, ')')

    // 배포 환경에서 쿠키 상태 확인
    const auth = await requireServerActionAuth(supabase)
    log('getCurrentUserSite: Auth check:', {
      user: auth?.userId,
      email: auth?.email,
      timestamp: new Date().toISOString(),
    })

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
      .eq('user_id', auth.userId)

    log('getCurrentUserSite: Assignments test result:', { assignmentsTest, assignmentsTestError })

    // 만약 배정이 없다면 강남 A현장에 자동으로 배정 (개발/테스트용)
    if (!assignmentsTest || assignmentsTest.length === 0) {
      log('getCurrentUserSite: No assignments found, attempting auto-assignment...')

      // 강남 A현장 찾기
      const { data: testSite, error: testSiteError } = await supabase
        .from('sites')
        .select('id, organization_id')
        .eq('name', '강남 A현장')
        .single()

      if (!testSiteError && testSite) {
        log('getCurrentUserSite: Auto-assigning to test site:', testSite.id)

        if (auth.isRestricted) {
          await assertOrgAccess(auth, testSite.organization_id ?? undefined)
        }

        const { data: newAssignment, error: assignError } = await supabase
          .from('site_assignments')
          .insert({
            user_id: auth.userId,
            site_id: testSite.id,
            assigned_date: new Date().toISOString().split('T')[0],
            is_active: true,
            role: 'worker',
          })
          .select()

        log('getCurrentUserSite: Auto-assignment result:', { newAssignment, assignError })
      }
    }

    // Direct query approach - get active site assignment with site details
    log('getCurrentUserSite: Querying active assignment with site details...')

    const { data: assignments, error } = await supabase
      .from('site_assignments')
      .select(
        `
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
          manager_phone,
          construction_manager_phone,
          safety_manager_name,
          safety_manager_phone,
          accommodation_name,
          accommodation_address,
          status,
          start_date,
          end_date,
          organization_id
        )
      `
      )
      .eq('user_id', auth.userId)
      .eq('is_active', true)
      .order('assigned_date', { ascending: false })

    // Get the most recent active assignment
    const assignment = assignments?.[0] || null

    log('getCurrentUserSite: Direct query result:', {
      assignments: assignments?.length,
      error,
      timestamp: new Date().toISOString(),
    })

    if (error) {
      throw new AppError('현장 정보를 불러오지 못했습니다.', ErrorType.SERVER_ERROR)
    }

    if (!assignment || !assignment.sites) {
      log('getCurrentUserSite: No assignment or site data - this is expected for some users')
      return { success: true, data: null }
    }

    if (auth.isRestricted) {
      await assertOrgAccess(auth, assignment.sites.organization_id ?? undefined)
    }

    // Convert to the expected format
    const site = assignment.sites as any
    const siteData: unknown = {
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
      manager_phone: site.manager_phone || site.construction_manager_phone,
      // Backward compat for consumers expecting construction_manager_phone
      construction_manager_phone: site.manager_phone || site.construction_manager_phone,
      safety_manager_name: site.safety_manager_name,
      safety_manager_phone: site.safety_manager_phone,
      accommodation_name: site.accommodation_name,
      accommodation_address: site.accommodation_address,
      is_active: assignment.is_active,
    }

    log('getCurrentUserSite: Converted site data:', siteData)

    if (!siteData) {
      log('getCurrentUserSite: No site data returned')
      return { success: true, data: null }
    }

    // Fetch site documents (PTW and Blueprint) for the current site
    try {
      log('getCurrentUserSite: Fetching site documents for site_id:', siteData.site_id)

      // Use documents table instead of site_documents
      const { data: documents, error: documentsError } = await supabase
        .from('documents')
        .select('id, title, file_name, file_url, document_type, created_at, updated_at')
        .eq('site_id', siteData.site_id)
        .in('document_type', ['ptw', 'blueprint'])
        .order('created_at', { ascending: false })

      if (documentsError) {
        log('getCurrentUserSite: Document query error (non-fatal):', documentsError)
      } else {
        log('getCurrentUserSite: Found documents:', documents?.length || 0)

        // Add documents to site data using the getSiteDocumentsPTWAndBlueprint logic
        const ptwDocument = documents?.find(
          (doc: unknown) =>
            doc.document_type === 'ptw' ||
            (doc.title && (doc.title.includes('PTW') || doc.title.includes('작업허가서')))
        )
        const blueprintDocument = documents?.find(
          (doc: unknown) =>
            doc.document_type === 'blueprint' ||
            doc.document_type === 'drawing' ||
            (doc.title && (doc.title.includes('도면') || doc.title.includes('blueprint')))
        )

        if (ptwDocument) {
          siteData.ptw_document = {
            id: ptwDocument.id,
            title: ptwDocument.title || ptwDocument.file_name,
            file_name: ptwDocument.file_name,
            file_url: ptwDocument.file_url,
            document_type: 'ptw',
            created_at: ptwDocument.created_at,
          }
          log('getCurrentUserSite: Added PTW document:', ptwDocument.title)
        }

        if (blueprintDocument) {
          siteData.blueprint_document = {
            id: blueprintDocument.id,
            title: blueprintDocument.title || blueprintDocument.file_name,
            file_name: blueprintDocument.file_name,
            file_url: blueprintDocument.file_url,
            document_type: 'blueprint',
            created_at: blueprintDocument.created_at,
          }
          log('getCurrentUserSite: Added blueprint document:', blueprintDocument.title)
        }
      }
    } catch (docError) {
      log('getCurrentUserSite: Error fetching documents (non-fatal):', docError)
    }

    log('getCurrentUserSite: Success')
    return { success: true, data: siteData }
  } catch (error) {
    logError(error, 'getCurrentUserSite')
    log('getCurrentUserSite: Caught error:', error)

    // Provide more helpful error messages
    if (error instanceof AppError) {
      return { success: false, error: error.message }
    }

    let errorMessage = 'Failed to fetch site information'
    if (error instanceof Error) {
      if (error.message.includes('JWT')) {
        errorMessage = 'Authentication session expired. Please refresh the page.'
      } else if (error.message.includes('connect') || error.message.includes('network')) {
        errorMessage = 'Network connection error. Please check your internet connection.'
      } else {
        errorMessage = error.message
      }
    }

    return { success: false, error: errorMessage }
  }
}

// 사용자의 현장 참여 이력 조회
export async function getUserSiteHistory() {
  try {
    const supabase = createClient()

    log('getUserSiteHistory: Starting...')

    const auth = await requireServerActionAuth(supabase)
    log('getUserSiteHistory: Auth check result:', { user: auth?.userId })

    // Direct query approach - get all site assignments with site details
    log('getUserSiteHistory: Querying site assignment history...')

    const { data, error } = await supabase
      .from('site_assignments')
      .select(
        `
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
      `
      )
      .eq('user_id', auth.userId)
      .order('assigned_date', { ascending: false })

    log('getUserSiteHistory: Direct query result:', { data, error, dataLength: data?.length })

    if (error) {
      log('getUserSiteHistory: Query error:', error)
      throw new AppError('현장 이력을 불러오지 못했습니다.', ErrorType.SERVER_ERROR)
    }

    // Convert to the expected format
    const historyData =
      data?.map((assignment: unknown) => {
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
          is_active: assignment.is_active,
        }
      }) || []

    log('getUserSiteHistory: Converted history data:', historyData.length, 'records')

    // Return the converted data
    log('getUserSiteHistory: Success')
    return { success: true, data: historyData }
  } catch (error) {
    logError(error, 'getUserSiteHistory')
    const errorMessage = error instanceof AppError ? error.message : 'Failed to fetch site history'
    return { success: false, error: errorMessage, data: [] }
  }
}

// 관리자용 - 현장 목록 조회
export async function getAllSites() {
  const supabase = createClient()

  try {
    const auth = await requireServerActionAuth(supabase)
    requireAdminRole(auth)

    // 모든 현장 조회
    const { data, error } = await supabase
      .from('sites')
      .select(
        `
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
      `
      )
      .order('created_at', { ascending: false })

    if (error) {
      throw new AppError('현장 목록을 불러오지 못했습니다.', ErrorType.SERVER_ERROR)
    }

    return { success: true, data: data || [] }
  } catch (error) {
    logError(error, 'getAllSites')
    return {
      success: false,
      error: error instanceof AppError ? error.message : 'Failed to fetch sites list',
    }
  }
}

// 관리자용 - 사용자에게 현장 배정
export async function assignUserToSite(userId: string, siteId: string, role: string = 'worker') {
  const supabase = createClient()

  try {
    const auth = await requireServerActionAuth(supabase)
    requireAdminRole(auth)

    // 기존 활성 배정 비활성화
    await supabase
      .from('site_assignments')
      .update({
        is_active: false,
        unassigned_date: new Date().toISOString().split('T')[0],
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
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      throw new AppError('사용자를 현장에 배정하지 못했습니다.', ErrorType.SERVER_ERROR)
    }

    return { success: true, data }
  } catch (error) {
    logError(error, 'assignUserToSite')
    return {
      success: false,
      error: error instanceof AppError ? error.message : 'Failed to assign user to site',
    }
  }
}

// 관리자용 - 사용자 현장 배정 해제
export async function unassignUserFromSite(userId: string) {
  const supabase = createClient()

  try {
    const auth = await requireServerActionAuth(supabase)
    requireAdminRole(auth)

    // 활성 배정 비활성화
    const { data, error } = await supabase
      .from('site_assignments')
      .update({
        is_active: false,
        unassigned_date: new Date().toISOString().split('T')[0],
      })
      .eq('user_id', userId)
      .eq('is_active', true)

    if (error) {
      throw new AppError('사용자 현장 배정을 해제하지 못했습니다.', ErrorType.SERVER_ERROR)
    }

    return { success: true, data }
  } catch (error) {
    logError(error, 'unassignUserFromSite')
    return {
      success: false,
      error: error instanceof AppError ? error.message : 'Failed to unassign user from site',
    }
  }
}

// 현장별 작업자 목록 조회
export async function getSiteWorkers(siteId: string) {
  const supabase = createClient()

  try {
    const auth = await requireServerActionAuth(supabase)
    await ensureSiteAccess(supabase, auth, siteId)

    // 현장의 작업자 목록 조회
    const { data, error } = await supabase
      .from('site_assignments')
      .select(
        `
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
      `
      )
      .eq('site_id', siteId)
      .order('assigned_date', { ascending: false })

    if (error) {
      throw new AppError('현장 작업자 목록을 불러오지 못했습니다.', ErrorType.SERVER_ERROR)
    }

    return { success: true, data: data || [] }
  } catch (error) {
    logError(error, 'getSiteWorkers')
    return {
      success: false,
      error: error instanceof AppError ? error.message : 'Failed to fetch site workers',
    }
  }
}

// 사용자가 자신의 현장을 선택하는 함수 (권한 체크 없음)
export async function selectUserSite(siteId: string) {
  const supabase = createClient()

  try {
    log('selectUserSite: Starting...')

    const auth = await requireServerActionAuth(supabase)
    await ensureSiteAccess(supabase, auth, siteId)

    log('selectUserSite: User ID:', auth.userId, 'Site ID:', siteId)

    // 사용자가 해당 사이트에 배정되어 있는지 확인
    const { data: assignment, error: checkError } = await supabase
      .from('site_assignments')
      .select('*')
      .eq('user_id', auth.userId)
      .eq('site_id', siteId)
      .single()

    if (checkError || !assignment) {
      log('selectUserSite: User not assigned to site, creating assignment...')

      // 기존 활성 배정 비활성화
      await supabase
        .from('site_assignments')
        .update({
          is_active: false,
          unassigned_date: new Date().toISOString().split('T')[0],
        })
        .eq('user_id', auth.userId)
        .eq('is_active', true)

      // 새 배정 생성
      const { data: newAssignment, error: assignError } = await supabase
        .from('site_assignments')
        .insert({
          user_id: auth.userId,
          site_id: siteId,
          assigned_date: new Date().toISOString().split('T')[0],
          is_active: true,
          role: 'worker',
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
          unassigned_date: new Date().toISOString().split('T')[0],
        })
        .eq('user_id', auth.userId)
        .eq('is_active', true)

      // 현재 배정 활성화
      const { data: updated, error: updateError } = await supabase
        .from('site_assignments')
        .update({
          is_active: true,
          unassigned_date: null,
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
    logError(error, 'selectUserSite')
    return {
      success: false,
      error: error instanceof AppError ? error.message : 'Failed to select site',
    }
  }
}

// 개발/테스트용 - 현재 사용자를 강남 A현장에 강제 배정
export async function forceAssignCurrentUserToTestSite() {
  const supabase = createClient()

  try {
    log('forceAssignCurrentUserToTestSite: Starting...')

    const auth = await requireServerActionAuth(supabase)

    log('forceAssignCurrentUserToTestSite: User ID:', auth.userId)

    // 기존 활성 배정 비활성화
    const { error: deactivateError } = await supabase
      .from('site_assignments')
      .update({
        is_active: false,
        unassigned_date: new Date().toISOString().split('T')[0],
      })
      .eq('user_id', auth.userId)
      .eq('is_active', true)

    if (deactivateError) {
      log(
        'forceAssignCurrentUserToTestSite: Deactivate error (might be expected):',
        deactivateError
      )
    }

    // 강남 A현장 찾기
    const { data: testSite, error: testSiteError } = await supabase
      .from('sites')
      .select('id, organization_id')
      .eq('name', '강남 A현장')
      .single()

    if (testSiteError || !testSite) {
      console.error('forceAssignCurrentUserToTestSite: Test site not found:', testSiteError)
      return { success: false, error: 'Test site "강남 A현장" not found' }
    }

    log('forceAssignCurrentUserToTestSite: Found test site:', testSite.id)

    if (auth.isRestricted) {
      await assertOrgAccess(auth, testSite.organization_id ?? undefined)
    }

    // 새 배정 생성
    const { data: newAssignment, error: assignError } = await supabase
      .from('site_assignments')
      .insert({
        user_id: auth.userId,
        site_id: testSite.id,
        assigned_date: new Date().toISOString().split('T')[0],
        is_active: true,
        role: 'worker',
      })
      .select()
      .single()

    if (assignError) {
      console.error('forceAssignCurrentUserToTestSite: Assignment error:', assignError)
      throw new AppError('테스트 현장 배정에 실패했습니다.', ErrorType.SERVER_ERROR)
    }

    log('forceAssignCurrentUserToTestSite: Assignment created:', newAssignment)
    return { success: true, data: newAssignment }
  } catch (error) {
    logError(error, 'forceAssignCurrentUserToTestSite')
    return {
      success: false,
      error: error instanceof AppError ? error.message : 'Failed to assign test site',
    }
  }
}
