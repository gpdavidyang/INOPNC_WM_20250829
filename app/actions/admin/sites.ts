'use server'

import type { SupabaseClient } from '@supabase/supabase-js'
import { assertOrgAccess, type SimpleAuth } from '@/lib/auth/ultra-simple'
import { AppError, ErrorType } from '@/lib/error-handling'
import type { Database } from '@/types/database'
import type { Profile, Site, SiteStatus } from '@/types'
import {
  withAdminAuth,
  AdminErrors,
  type AdminActionResult,
  validateRequired,
  requireRestrictedOrgId,
  resolveAdminError,
} from './common'

type AdminSupabaseClient = SupabaseClient<Database>

async function getSiteOrganization(
  supabase: AdminSupabaseClient,
  siteId?: string | null
): Promise<string | undefined> {
  if (!siteId) {
    return undefined
  }

  const { data, error } = await supabase
    .from('sites')
    .select('organization_id')
    .eq('id', siteId)
    .single()

  if (error || !data) {
    throw new AppError('현장 정보를 찾을 수 없습니다.', ErrorType.NOT_FOUND, 404)
  }

  return (data as { organization_id?: string | null }).organization_id ?? undefined
}

async function ensureSiteAccessible(
  supabase: AdminSupabaseClient,
  auth: SimpleAuth,
  siteId?: string | null
) {
  if (!auth.isRestricted || !siteId) {
    return
  }

  const restrictedOrgId = requireRestrictedOrgId(auth)
  const organizationId = await getSiteOrganization(supabase, siteId)

  await assertOrgAccess(auth, organizationId)

  if (organizationId !== restrictedOrgId) {
    throw new AppError('현장에 접근할 권한이 없습니다.', ErrorType.AUTHORIZATION, 403)
  }
}

async function ensureSitesAccessible(
  supabase: AdminSupabaseClient,
  auth: SimpleAuth,
  siteIds: string[]
) {
  if (!auth.isRestricted || siteIds.length === 0) {
    return
  }

  const restrictedOrgId = requireRestrictedOrgId(auth)

  const { data, error } = await supabase
    .from('sites')
    .select('id, organization_id')
    .in('id', siteIds)

  if (error) {
    throw new AppError('현장 정보를 확인할 수 없습니다.', ErrorType.SERVER_ERROR, 500)
  }

  const records = (data || []) as Array<{ id: string; organization_id?: string | null }>

  if (records.length !== siteIds.length) {
    throw new AppError('현장에 접근할 권한이 없습니다.', ErrorType.AUTHORIZATION, 403)
  }

  for (const record of records) {
    await assertOrgAccess(auth, record.organization_id ?? undefined)
    if (record.organization_id !== restrictedOrgId) {
      throw new AppError('현장에 접근할 권한이 없습니다.', ErrorType.AUTHORIZATION, 403)
    }
  }
}

async function ensureUserAccessible(
  supabase: AdminSupabaseClient,
  auth: SimpleAuth,
  userId?: string | null
) {
  if (!auth.isRestricted || !userId) {
    return
  }

  const restrictedOrgId = requireRestrictedOrgId(auth)

  const { data, error } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', userId)
    .single()

  if (error) {
    throw new AppError('사용자 정보를 확인할 수 없습니다.', ErrorType.SERVER_ERROR, 500)
  }

  const organizationId =
    (data as { organization_id?: string | null } | null)?.organization_id ?? undefined
  await assertOrgAccess(auth, organizationId)

  if (organizationId !== restrictedOrgId) {
    throw new AppError('사용자에 접근할 권한이 없습니다.', ErrorType.AUTHORIZATION, 403)
  }
}

async function filterUsersByOrganization<T extends { id?: string }>(
  supabase: AdminSupabaseClient,
  auth: SimpleAuth,
  users: T[] | null | undefined
) {
  if (!auth.isRestricted) {
    return users || []
  }

  const list = users || []
  if (list.length === 0) {
    return []
  }

  const restrictedOrgId = requireRestrictedOrgId(auth)
  const userIds = list.map(user => user.id).filter((id): id is string => Boolean(id))

  if (userIds.length === 0) {
    return []
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, organization_id')
    .in('id', userIds)

  if (error) {
    throw new AppError('사용자 정보를 확인할 수 없습니다.', ErrorType.SERVER_ERROR, 500)
  }

  const orgMap = new Map<string, string | null | undefined>()
  for (const profile of data || []) {
    orgMap.set(
      (profile as { id: string }).id,
      (profile as { organization_id?: string | null }).organization_id
    )
  }

  for (const [, organizationId] of orgMap) {
    await assertOrgAccess(auth, organizationId ?? undefined)
  }

  return list.filter(user => orgMap.get(user.id ?? '') === restrictedOrgId)
}

export interface CreateSiteData {
  name: string
  address: string
  description?: string
  construction_manager_phone?: string
  manager_phone?: string
  construction_manager_email?: string
  manager_email?: string
  safety_manager_phone?: string
  safety_manager_email?: string
  accommodation_name?: string
  accommodation_address?: string
  accommodation_phone?: string
  work_process?: string
  work_section?: string
  component_name?: string
  manager_name?: string
  safety_manager_name?: string
  status?: SiteStatus
  start_date: string
  end_date?: string
  organization_id?: string
}

export interface UpdateSiteData extends Partial<CreateSiteData> {
  id: string
}

export interface SiteAssignmentData {
  site_id: string
  user_id: string
  role: 'worker' | 'site_manager' | 'supervisor'
}

/**
 * Get all sites with pagination and filtering
 */
export async function getSites(
  page = 1,
  limit = 50,
  search = '',
  status?: SiteStatus,
  sortColumn = 'created_at',
  sortDirection: 'asc' | 'desc' = 'desc'
): Promise<AdminActionResult<{ sites: Site[]; total: number; pages: number }>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      const auth = profile.auth

      // Optimized query - only select needed columns for list view
      let query = supabase
        .from('sites')
        .select(
          `
          id,
          name,
          address,
          status,
          start_date,
          end_date,
          manager_name,
          manager_phone,
          created_at,
          updated_at,
          organization_id
        `,
          { count: 'exact' }
        )
        .order(sortColumn, { ascending: sortDirection === 'asc' })

      // Exclude soft-deleted sites by default
      query = query.eq('is_deleted', false)

      if (auth.isRestricted) {
        query = query.eq('organization_id', requireRestrictedOrgId(auth))
      }

      // Apply search filter
      if (search.trim()) {
        query = query.or(`name.ilike.%${search}%,address.ilike.%${search}%`)
      }

      // Apply status filter
      if (status) {
        query = query.eq('status', status)
      }

      // Apply pagination
      const offset = (page - 1) * limit
      query = query.range(offset, offset + limit - 1)

      const { data: sites, error, count } = await query

      if (error) {
        // Only log errors in development or for critical errors
        if (process.env.NODE_ENV === 'development' || error.code !== 'PGRST301') {
          console.error('Error fetching sites:', error)
        }
        return {
          success: false,
          error: AdminErrors.DATABASE_ERROR,
        }
      }

      const totalPages = Math.ceil((count || 0) / limit)
      const sanitizedSites = (sites || []).map(site => {
        const { organization_id: _organizationId, ...rest } = site as any
        return rest as Site
      })

      return {
        success: true,
        data: {
          sites: sanitizedSites,
          total: count || 0,
          pages: totalPages,
        },
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Sites fetch error:', error)
      }
      return {
        success: false,
        error: resolveAdminError(error),
      }
    }
  })
}

/**
 * Create a new site
 */
export async function createSite(data: CreateSiteData): Promise<AdminActionResult<Site>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      const auth = profile.auth

      // Validate required fields
      const nameError = validateRequired(data.name, '현장명')
      if (nameError) {
        return { success: false, error: nameError }
      }

      const addressError = validateRequired(data.address, '주소')
      if (addressError) {
        return { success: false, error: addressError }
      }

      const startDateError = validateRequired(data.start_date, '시작일')
      if (startDateError) {
        return { success: false, error: startDateError }
      }

      const organizationId = auth.isRestricted ? requireRestrictedOrgId(auth) : data.organization_id

      const { data: site, error } = await supabase
        .from('sites')
        .insert({
          ...data,
          organization_id: organizationId ?? null,
          status: data.status || 'active',
          created_by: profile.id,
        })
        .select()
        .single()

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error creating site:', error)
        }
        if (error.code === '23505') {
          return { success: false, error: AdminErrors.DUPLICATE_ERROR }
        }
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      return {
        success: true,
        data: site,
        message: '현장이 성공적으로 생성되었습니다.',
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Site creation error:', error)
      }
      return {
        success: false,
        error: resolveAdminError(error),
      }
    }
  })
}

/**
 * Update an existing site
 */
export async function updateSite(data: UpdateSiteData): Promise<AdminActionResult<Site>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      const { id, ...updateData } = data
      const auth = profile.auth

      await ensureSiteAccessible(supabase, auth, id)

      // console.log('[SERVER-UPDATE] Received update request for site:', id)
      // console.log('[SERVER-UPDATE] Update data:', updateData)

      // First, verify the site exists
      const { data: existingSite, error: fetchError } = await supabase
        .from('sites')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) {
        console.error('[SERVER-UPDATE] Failed to fetch existing site:', fetchError)
        return { success: false, error: AdminErrors.NOT_FOUND }
      }

      // console.log('[SERVER-UPDATE] Existing site found:', existingSite.name)

      // Clean the update data - remove undefined values
      const cleanUpdateData = Object.entries(updateData).reduce<Record<string, unknown>>(
        (acc, [key, value]) => {
          if (value !== undefined) {
            acc[key] = value
          }
          return acc
        },
        {}
      )

      if (auth.isRestricted) {
        Object.assign(cleanUpdateData, {
          organization_id: requireRestrictedOrgId(auth),
        })
      }

      // console.log('[SERVER-UPDATE] Clean update data:', cleanUpdateData)

      // Perform the update without select first
      const { error: updateError } = await supabase
        .from('sites')
        .update({
          ...cleanUpdateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('is_deleted', false)

      if (updateError) {
        console.error('[SERVER-UPDATE] Database update error:', updateError)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      // Now fetch the updated site separately
      const { data: site, error: fetchUpdatedError } = await supabase
        .from('sites')
        .select('*')
        .eq('id', id)
        .eq('is_deleted', false)
        .single()

      if (fetchUpdatedError) {
        console.error('[SERVER-UPDATE] Failed to fetch updated site:', fetchUpdatedError)
        // Update succeeded but couldn't fetch - still return success
        return {
          success: true,
          data: {
            ...existingSite,
            ...cleanUpdateData,
            updated_at: new Date().toISOString(),
          } as Site,
          message: '현장 정보가 성공적으로 업데이트되었습니다.',
        }
      }

      // console.log('[SERVER-UPDATE] Update successful, returned site:', site)

      // Verify the update was actually saved
      const { data: verifiedSite, error: verifyError } = await supabase
        .from('sites')
        .select('*')
        .eq('id', id)
        .single()

      if (verifyError) {
        console.error('[SERVER-UPDATE] Failed to verify update:', verifyError)
      } else {
        // console.log('[SERVER-UPDATE] Verified updated site data:', {
        //   name: verifiedSite.name,
        //   address: verifiedSite.address,
        //   manager_name: verifiedSite.manager_name,
        //   updated_at: verifiedSite.updated_at
        // })
      }

      return {
        success: true,
        data: site,
        message: '현장 정보가 성공적으로 업데이트되었습니다.',
      }
    } catch (error) {
      console.error('[SERVER-UPDATE] Unexpected error:', error)
      return {
        success: false,
        error: resolveAdminError(error),
      }
    }
  })
}

/**
 * Delete sites (bulk operation)
 */
export async function deleteSites(siteIds: string[]): Promise<AdminActionResult<void>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      const auth = profile.auth

      await ensureSitesAccessible(supabase, auth, siteIds)

      // Soft delete: mark as deleted to preserve referential integrity
      const { error } = await supabase
        .from('sites')
        .update({ is_deleted: true, updated_at: new Date().toISOString() })
        .in('id', siteIds)
        .eq('is_deleted', false)

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error deleting sites:', error)
        }
        if (error.code === '23503') {
          return {
            success: false,
            error: '활성 배정이 있는 현장은 삭제할 수 없습니다.',
          }
        }
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      return {
        success: true,
        message: `${siteIds.length}개 현장이 성공적으로 삭제되었습니다.`,
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Sites deletion error:', error)
      }
      return {
        success: false,
        error: resolveAdminError(error),
      }
    }
  })
}

/**
 * Restore soft-deleted sites (bulk)
 */
export async function restoreSites(siteIds: string[]): Promise<AdminActionResult<void>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      const auth = profile.auth
      await ensureSitesAccessible(supabase, auth, siteIds)

      const { error } = await supabase
        .from('sites')
        .update({ is_deleted: false, updated_at: new Date().toISOString() })
        .in('id', siteIds)

      if (error) {
        if (process.env.NODE_ENV === 'development') console.error('Error restoring sites:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      return { success: true, message: `${siteIds.length}개 현장을 복구했습니다.` }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Sites restore error:', error)
      return { success: false, error: resolveAdminError(error) }
    }
  })
}

/**
 * Permanently delete sites (bulk purge)
 */
export async function purgeSites(siteIds: string[]): Promise<AdminActionResult<void>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      const auth = profile.auth
      await ensureSitesAccessible(supabase, auth, siteIds)

      const { error } = await supabase.from('sites').delete().in('id', siteIds)
      if (error) {
        if (process.env.NODE_ENV === 'development') console.error('Error purging sites:', error)
        if ((error as any).code === '23503') {
          return { success: false, error: '연관 데이터가 있어 완전 삭제할 수 없습니다.' }
        }
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }
      return { success: true, message: `${siteIds.length}개 현장을 영구 삭제했습니다.` }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Sites purge error:', error)
      return { success: false, error: resolveAdminError(error) }
    }
  })
}

/**
 * Update site status (bulk operation)
 */
export async function updateSiteStatus(
  siteIds: string[],
  status: SiteStatus
): Promise<AdminActionResult<void>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      const auth = profile.auth

      await ensureSitesAccessible(supabase, auth, siteIds)

      const { error } = await supabase
        .from('sites')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .in('id', siteIds)
        .eq('is_deleted', false)

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error updating site status:', error)
        }
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      const statusText =
        status === 'active' ? '활성화' : status === 'inactive' ? '비활성화' : '완료'

      return {
        success: true,
        message: `${siteIds.length}개 현장이 ${statusText}되었습니다.`,
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Site status update error:', error)
      }
      return {
        success: false,
        error: resolveAdminError(error),
      }
    }
  })
}

/**
 * Get site assignments
 */
export async function getSiteAssignments(siteId: string): Promise<AdminActionResult<any[]>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      const auth = profile.auth

      await ensureSiteAccessible(supabase, auth, siteId)

      // 1) Fetch raw assignments
      const { data: assigns, error: aErr } = await supabase
        .from('site_assignments')
        .select('*')
        .eq('site_id', siteId)
        .eq('is_active', true)

      if (aErr) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching site assignments:', aErr)
        }
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      const assignments = assigns || []
      if (assignments.length === 0) {
        return { success: true, data: [] }
      }

      // 2) Fetch related profiles
      const userIds = Array.from(new Set(assignments.map((a: any) => a.user_id).filter(Boolean)))
      let profiles: any[] = []
      if (userIds.length > 0) {
        const { data: profs, error: pErr } = await supabase
          .from('profiles')
          .select('id, full_name, email, role, organization_id')
          .in('id', userIds)
        if (pErr) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Error fetching profiles for assignments:', pErr)
          }
        } else {
          profiles = profs || []
        }
      }

      // 3) Fetch organizations for profiles
      const orgIds = Array.from(
        new Set(profiles.map(p => (p as any).organization_id).filter(Boolean))
      )
      let organizations: Record<string, { id: string; name?: string | null }> = {}
      if (orgIds.length > 0) {
        const { data: orgs, error: oErr } = await supabase
          .from('organizations')
          .select('id, name')
          .in('id', orgIds)
        if (!oErr) {
          for (const o of orgs || []) {
            organizations[(o as any).id] = { id: (o as any).id, name: (o as any).name }
          }
        }
      }

      const profMap = new Map<string, any>()
      for (const p of profiles) profMap.set((p as any).id, p)

      const enriched = assignments.map(a => {
        const p = profMap.get((a as any).user_id)
        const orgId = p?.organization_id || null
        const org = orgId ? organizations[orgId] : undefined
        return {
          ...a,
          profile: p
            ? {
                id: p.id,
                full_name: p.full_name,
                email: p.email,
                role: p.role,
                organization: org,
              }
            : null,
        }
      })

      return {
        success: true,
        data: enriched,
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Site assignments fetch error:', error)
      }
      return {
        success: false,
        error: resolveAdminError(error),
      }
    }
  })
}

/**
 * Assign user to site
 */
export async function assignUserToSite(data: SiteAssignmentData): Promise<AdminActionResult<void>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      const auth = profile.auth

      await ensureSiteAccessible(supabase, auth, data.site_id)
      await ensureUserAccessible(supabase, auth, data.user_id)

      // Check if assignment already exists
      const { data: existing, error: checkError } = await supabase
        .from('site_assignments')
        .select('id')
        .eq('site_id', data.site_id)
        .eq('user_id', data.user_id)
        .eq('is_active', true)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error checking existing assignment:', checkError)
        }
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      if (existing) {
        return {
          success: false,
          error: '사용자가 이미 해당 현장에 배정되어 있습니다.',
        }
      }

      const { error } = await supabase.from('site_assignments').insert({
        site_id: data.site_id,
        user_id: data.user_id,
        role: data.role,
        assigned_date: new Date().toISOString(),
        is_active: true,
      })

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error assigning user to site:', error)
        }
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      return {
        success: true,
        message: '사용자가 현장에 성공적으로 배정되었습니다.',
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Site assignment error:', error)
      }
      return {
        success: false,
        error: resolveAdminError(error),
      }
    }
  })
}

/**
 * Remove user from site
 */
export async function removeUserFromSite(
  siteId: string,
  userId: string
): Promise<AdminActionResult<void>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      const auth = profile.auth

      await ensureSiteAccessible(supabase, auth, siteId)

      const { error } = await supabase
        .from('site_assignments')
        .update({
          is_active: false,
          unassigned_date: new Date().toISOString(),
        })
        .eq('site_id', siteId)
        .eq('user_id', userId)
        .eq('is_active', true)

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error removing user from site:', error)
        }
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      return {
        success: true,
        message: '사용자가 현장에서 성공적으로 해제되었습니다.',
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Site assignment removal error:', error)
      }
      return {
        success: false,
        error: resolveAdminError(error),
      }
    }
  })
}

/**
 * Search available users for site assignment
 */
export async function searchAvailableUsers(
  siteId: string,
  search = '',
  role?: string,
  limit = 20,
  offset = 0
): Promise<AdminActionResult<{ users: Profile[]; total: number }>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      const auth = profile.auth

      await ensureSiteAccessible(supabase, auth, siteId)

      // Use the database function for searching available workers
      const { data: users, error } = await supabase.rpc('get_available_workers_for_site', {
        p_site_id: siteId,
        p_search: search.trim() || null,
        p_role_filter: role || null,
        p_limit: limit,
        p_offset: offset,
      })

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error searching available users:', error)
        }
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      // Get total count for pagination
      const { count, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .in('role', ['worker', 'site_manager', 'customer_manager'])
        .not(
          'id',
          'in',
          `(
          SELECT user_id FROM site_assignments 
          WHERE site_id = '${siteId}' AND is_active = true
        )`
        )

      let totalCount = count || 0

      if (auth.isRestricted) {
        const orgFilter = requireRestrictedOrgId(auth)
        // To avoid altering existing query semantics, re-run count with organization filter when restricted.
        const { count: restrictedCount, error: restrictedCountError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')
          .eq('organization_id', orgFilter)
          .in('role', ['worker', 'site_manager', 'customer_manager'])
          .not(
            'id',
            'in',
            `(
            SELECT user_id FROM site_assignments 
            WHERE site_id = '${siteId}' AND is_active = true
          )`
          )

        if (!restrictedCountError) {
          totalCount = restrictedCount ?? 0
        }
      }

      if (countError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error counting available users:', countError)
        }
      }

      const filteredUsers = await filterUsersByOrganization(
        supabase,
        auth,
        users as Profile[] | null
      )

      return {
        success: true,
        data: {
          users: filteredUsers,
          total: totalCount,
        },
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Available users search error:', error)
      }
      return {
        success: false,
        error: resolveAdminError(error),
      }
    }
  })
}

/**
 * Update user role in site assignment
 */
export async function updateSiteAssignmentRole(
  siteId: string,
  userId: string,
  newRole: string
): Promise<AdminActionResult<void>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      const auth = profile.auth

      await ensureSiteAccessible(supabase, auth, siteId)
      await ensureUserAccessible(supabase, auth, userId)

      const { error } = await supabase
        .from('site_assignments')
        .update({
          role: newRole,
          updated_at: new Date().toISOString(),
        })
        .eq('site_id', siteId)
        .eq('user_id', userId)
        .eq('is_active', true)

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error updating assignment role:', error)
        }
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      return {
        success: true,
        message: '사용자 역할이 성공적으로 변경되었습니다.',
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Assignment role update error:', error)
      }
      return {
        success: false,
        error: resolveAdminError(error),
      }
    }
  })
}
