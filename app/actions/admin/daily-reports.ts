'use server'

import { assertOrgAccess, type SimpleAuth } from '@/lib/auth/ultra-simple'
import { mergeWorkers } from '@/lib/daily-reports/merge-workers'
import { AppError, ErrorType } from '@/lib/error-handling'
import { notifyDailyReportApproved } from '@/lib/notifications/triggers'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { DailyReport } from '@/types'
import type { Database } from '@/types/database'
import type { SupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { withAdminAuth } from './common'

interface DailyReportsFilter {
  site?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  component_name?: string
  work_process?: string
  work_section?: string
  created_by?: string
  page?: number
  itemsPerPage?: number
  sortField?: string
  sortDirection?: 'asc' | 'desc'
}

type AdminSupabaseClient = SupabaseClient<Database>

async function ensureSiteAccess(supabase: AdminSupabaseClient, auth: SimpleAuth, siteId?: string) {
  if (!siteId || !auth.isRestricted) {
    return
  }

  // For restricted users, validate the site belongs to their partner company via mapping
  if (auth.isRestricted && auth.restrictedOrgId) {
    const { data: mapping } = await supabase
      .from('partner_site_mappings')
      .select('site_id')
      .eq('partner_company_id', auth.restrictedOrgId)
      .eq('site_id', siteId)
      .maybeSingle()

    if (!mapping) {
      throw new AppError('현장 접근 권한이 없습니다.', ErrorType.AUTHORIZATION, 403)
    }
    return
  }

  const { data, error } = await supabase
    .from('sites')
    .select('organization_id')
    .eq('id', siteId)
    .single()

  if (error || !data) {
    throw new AppError('현장을 찾을 수 없습니다.', ErrorType.NOT_FOUND, 404)
  }

  await assertOrgAccess(auth, data.organization_id ?? undefined)
}

async function fetchReportWithAccess(
  supabase: AdminSupabaseClient,
  auth: SimpleAuth,
  reportId: string
) {
  const { data, error } = await supabase
    .from('daily_reports')
    .select(
      `
      id,
      site_id,
      created_by,
      site:sites(
        organization_id
      )
    `
    )
    .eq('id', reportId)
    .single()

  if (error || !data) {
    throw new AppError('작업일지를 찾을 수 없습니다.', ErrorType.NOT_FOUND, 404)
  }

  if (auth.isRestricted) {
    await assertOrgAccess(auth, data.site?.organization_id ?? undefined)

    if (data.created_by !== auth.userId) {
      throw new AppError('작업일지에 접근할 권한이 없습니다.', ErrorType.AUTHORIZATION, 403)
    }
  }

  return data
}

export async function getDailyReports(filters: DailyReportsFilter = {}) {
  return withAdminAuth(async (supabase, profile) => {
    const auth = profile.auth
    const {
      site,
      status,
      dateFrom,
      dateTo,
      search,
      created_by,
      page = 1,
      itemsPerPage = 20,
      sortField = 'work_date',
      sortDirection = 'desc',
    } = filters

    await ensureSiteAccess(supabase, auth, site)

    let query = supabase.from('daily_reports').select(
      `
        *,
        sites!inner(
          name, 
          address,
          manager_name,
          safety_manager_name,
          organization_id
        )
      `,
      { count: 'exact' }
    )

    // Apply filters
    if (site) {
      query = query.eq('site_id', site)
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (dateFrom) {
      query = query.gte('work_date', dateFrom)
    }
    if (dateTo) {
      query = query.lte('work_date', dateTo)
    }
    if (search) {
      const sanitized = search.replace(/'/g, "''")
      const pattern = `%${sanitized}%`

      // Resolve matches across related tables first, then combine into a single OR on the main table
      const [creatorMatchIds, workerMatchReportIds, siteMatchIds, orgSiteMatchIds] =
        await Promise.all([
          (async () => {
            const { data } = await supabase
              .from('profiles')
              .select('id, full_name, email')
              .or(`full_name.ilike.${pattern},email.ilike.${pattern}`)
              .limit(50)
            return (data || []).map(row => String((row as any).id)).filter(Boolean)
          })(),
          (async () => {
            const { data } = await supabase
              .from('daily_report_workers')
              .select('daily_report_id')
              .ilike('worker_name', pattern)
              .limit(200)
            return (data || []).map(row => String((row as any).daily_report_id)).filter(id => !!id)
          })(),
          (async () => {
            const { data } = await supabase
              .from('sites')
              .select('id')
              .or(`name.ilike.${pattern},address.ilike.${pattern}`)
              .limit(200)
            return (data || []).map(row => String((row as any).id)).filter(Boolean)
          })(),
          (async () => {
            const { data: orgs } = await supabase
              .from('organizations')
              .select('id')
              .ilike('name', pattern)
              .limit(100)
            const orgIds = (orgs || []).map(row => String((row as any).id)).filter(Boolean)
            if (orgIds.length === 0) return []
            const { data: sitesByOrg } = await supabase
              .from('sites')
              .select('id')
              .in('organization_id', orgIds)
              .limit(500)
            return (sitesByOrg || []).map(row => String((row as any).id)).filter(Boolean)
          })(),
        ])

      const combinedSiteMatchIds = Array.from(new Set([...siteMatchIds, ...orgSiteMatchIds]))

      const searchFilters = [
        `member_name.ilike.${pattern}`,
        `process_type.ilike.${pattern}`,
        `issues.ilike.${pattern}`,
      ]

      if (creatorMatchIds.length > 0) {
        searchFilters.push(`created_by.in.(${creatorMatchIds.join(',')})`)
      }
      if (workerMatchReportIds.length > 0) {
        searchFilters.push(`id.in.(${workerMatchReportIds.join(',')})`)
      }
      if (combinedSiteMatchIds.length > 0) {
        searchFilters.push(`site_id.in.(${combinedSiteMatchIds.join(',')})`)
      }

      if (searchFilters.length > 0) {
        query = query.or(searchFilters.join(','))
      }
    }
    if (auth.isRestricted) {
      if (!auth.restrictedOrgId) {
        throw new AppError('조직 정보가 필요합니다.', ErrorType.AUTHORIZATION, 403)
      }
      // Restrict by sites mapped to the partner company
      const { data: mappings } = await supabase
        .from('partner_site_mappings')
        .select('site_id')
        .eq('partner_company_id', auth.restrictedOrgId)
      const allowedSiteIds = (mappings || []).map(m => (m as any).site_id)
      if (allowedSiteIds.length === 0) {
        return {
          success: true,
          data: { reports: [], totalCount: 0, totalPages: 0, currentPage: page },
        }
      }
      query = query.in('site_id', allowedSiteIds).eq('created_by', auth.userId)
    } else if (created_by) {
      // Admin view: allow filtering by creator
      query = query.eq('created_by', created_by)
    }

    // Apply sorting
    const ascending = sortDirection === 'asc'
    switch (sortField) {
      case 'site_name':
        query = query.order('sites(name)', { ascending })
        break
      case 'work_date':
        query = query.order('work_date', { ascending })
        break
      case 'member_name':
        query = query.order('member_name', { ascending })
        break
      case 'total_workers':
        query = query.order('total_workers', { ascending })
        break
      case 'total_manhours':
        query = query.order('total_labor_hours', { ascending })
        break
      case 'status':
        query = query.order('status', { ascending })
        break
      case 'created_at':
        query = query.order('created_at', { ascending })
        break
      case 'component_name':
        query = query.order('component_name', { ascending, nullsFirst: false })
        break
      case 'work_process':
        query = query.order('work_process', { ascending, nullsFirst: false })
        break
      case 'work_section':
        query = query.order('work_section', { ascending, nullsFirst: false })
        break
      case 'organization':
        query = query.order('sites(organization_id)', { ascending })
        break
      default:
        query = query.order('work_date', { ascending: false })
    }

    // Add secondary sort for stability
    if (sortField !== 'created_at') {
      query = query.order('created_at', { ascending: false })
    }

    // Pagination
    const from = (page - 1) * itemsPerPage
    const to = from + itemsPerPage - 1

    const { data, error, count } = await query.range(from, to)

    if (error) throw error

    // Avoid N+1: bulk load related data
    const reports = (data || []) as any[]
    const reportIds = Array.from(new Set(reports.map(r => r.id)))
    const creatorIds = Array.from(new Set(reports.map(r => r.created_by).filter(Boolean)))
    const siteIds = Array.from(new Set(reports.map(r => r.site_id).filter(Boolean)))
    const organizationIds = Array.from(
      new Set(
        reports
          .map(r => (r as any)?.sites?.organization_id)
          .filter((org): org is string | number => Boolean(org))
          .map(org => String(org))
      )
    )

    // 1) Profiles (creators)
    let profiles: Array<{
      id: string
      full_name: string
      email?: string
      role?: string
      phone?: string
      last_login_at?: string | null
    }> = []
    if (creatorIds.length > 0) {
      const { data: p } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, phone, last_login_at')
        .in('id', creatorIds)
      profiles = (p as any) || []
    }
    const pMap = new Map(profiles.map(p => [String(p.id), p]))

    // 4) Documents count per site+date
    const docsCountMap = new Map<string, number>() // key: `${site_id}|${YYYY-MM-DD}`
    if (siteIds.length > 0 && reports.length > 0) {
      const minDate = reports.reduce<string | null>((acc, r: any) => {
        const d = String(r.work_date || r.report_date)
        return !acc || d < acc ? d : acc
      }, null)
      const maxDate = reports.reduce<string | null>((acc, r: any) => {
        const d = String(r.work_date || r.report_date)
        return !acc || d > acc ? d : acc
      }, null)
      if (minDate && maxDate) {
        const fromDate = `${minDate}T00:00:00`
        const toDate = `${maxDate}T23:59:59`
        const { data: docs } = await supabase
          .from('documents')
          .select('site_id, created_at')
          .in('site_id', siteIds)
          .gte('created_at', fromDate)
          .lt('created_at', toDate)
        for (const d of (docs as any[]) || []) {
          const sid = String((d as any).site_id)
          const date = new Date(String((d as any).created_at))
          const yyyy = date.getFullYear()
          const mm = String(date.getMonth() + 1).padStart(2, '0')
          const dd = String(date.getDate()).padStart(2, '0')
          const key = `${sid}|${yyyy}-${mm}-${dd}`
          docsCountMap.set(key, (docsCountMap.get(key) || 0) + 1)
        }
      }
    }

    let organizationMap = new Map<string, { id: string; name: string | null }>()
    if (organizationIds.length > 0) {
      const { data: orgData } = await supabase
        .from('organizations')
        .select('id,name')
        .in('id', organizationIds)
      if (orgData && Array.isArray(orgData)) {
        organizationMap = new Map(
          orgData.map(org => [
            String((org as any).id),
            { id: String((org as any).id), name: (org as any).name ?? null },
          ])
        )
      }
    }

    const enrichedReports = reports.map(r => {
      const rid = String(r.id)
      const sid = String(r.site_id)
      const dateStr = String(r.work_date || r.report_date)
      const docsKey = `${sid}|${dateStr}`
      const orgId = (r as any)?.sites?.organization_id
        ? String((r as any).sites.organization_id)
        : null

      // Resolve workers from DB summary columns (Database-based approach)
      let workerCount = Number(r.total_workers) || 0
      let totalManhours =
        Number((r as any).total_labor_hours) || Number((r as any).total_hours) || 0

      // Fallback: If relational tables are empty, check work_content JSON (Mobile V2 format)
      if (workerCount === 0 || totalManhours === 0) {
        let content: any = r.work_content
        if (typeof content === 'string' && content.trim()) {
          try {
            content = JSON.parse(content)
          } catch {
            content = null
          }
        }
        if (content && typeof content === 'object') {
          const jsonWorkers = content.workers || content.worker_entries || []
          if (Array.isArray(jsonWorkers) && jsonWorkers.length > 0) {
            let jCount = 0
            let jHours = 0
            for (const w of jsonWorkers) {
              jCount++
              const h = Number(w.hours ?? w.labor_hours ?? w.work_hours ?? 0)
              // If hours are missing but worker exists, default to 8 (standard day) as per detail view behavior
              jHours += h || 8
            }
            if (workerCount === 0) workerCount = jCount
            if (totalManhours === 0) totalManhours = Number(jHours.toFixed(1))
          }
        }
      }

      return {
        ...r,
        profiles: pMap.get(String(r.created_by)) || null,
        worker_details_count: workerCount || Number(r.total_workers) || 0,
        daily_documents_count: docsCountMap.get(docsKey) || 0,
        total_manhours:
          totalManhours || Number(r.total_labor_hours) || Number((r as any).total_hours) || 0,
        organization: orgId ? organizationMap.get(orgId) || null : null,
      }
    })

    return {
      success: true,
      data: {
        reports: enrichedReports,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / itemsPerPage),
        currentPage: page,
      },
    }
  })
}

export async function getDailyReportById(id: string) {
  return withAdminAuth(async (supabase, profile) => {
    const auth = profile.auth

    await fetchReportWithAccess(supabase, auth, id)

    const { data, error } = await supabase
      .from('daily_reports')
      .select(
        `
        *,
        sites(name, address)
      `
      )
      .eq('id', id)
      .single()

    if (error) throw error

    // Get profile separately
    let creatorProfile = null
    if (data?.created_by) {
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', data.created_by)
          .single()
        creatorProfile = profileData
      } catch (err) {
        // Profile not found, continue without it
      }
    }

    let workRecords: any[] = []
    try {
      const serviceSupabase = (() => {
        try {
          return createServiceRoleClient()
        } catch {
          return supabase
        }
      })()

      const [recordRes, assignmentRes, materialRes] = await Promise.all([
        serviceSupabase
          .from('work_records')
          .select(
            `
            id,
            user_id,
            labor_hours,
            work_hours,
            overtime_hours,
            notes,
            metadata,
            profiles:profiles!work_records_user_id_fkey(id, full_name, role, email)
          `
          )
          .eq('daily_report_id', id),
        serviceSupabase
          .from('worker_assignments')
          .select('*, profiles(id, full_name, role)')
          .eq('daily_report_id', id),
        serviceSupabase.from('material_usage').select('*').eq('daily_report_id', id),
      ])

      workRecords = recordRes.data || []
      const workerAssignments = assignmentRes.data || []
      const materialUsage = materialRes.data || []

      const mergedWorkers = workerAssignments.length
        ? workerAssignments
        : mergeWorkers([], workRecords)
      const totalHours = mergedWorkers.reduce(
        (sum, worker) =>
          sum +
          Number(
            (worker as any).hours ?? (worker as any).labor_hours ?? (worker as any).work_hours ?? 0
          ),
        0
      )

      return {
        success: true,
        data: {
          ...data,
          profiles: creatorProfile,
          workers: mergedWorkers,
          worker_assignments: workerAssignments,
          material_usage: materialUsage,
          worker_details_count: mergedWorkers.length,
          total_hours: totalHours,
        },
      }
    } catch (err) {
      console.error('Error fetching workers:', err)
    }
  })
}

export async function createDailyReport(reportData: any) {
  return withAdminAuth(async (supabase, profile) => {
    const auth = profile.auth

    await ensureSiteAccess(supabase, auth, reportData.site_id)

    // Strip fields that are not actual columns on daily_reports
    const { worker_ids, created_by, additional_photos, material_usage, ...reportFields } =
      reportData

    // Allow admin to override creator; restricted users cannot override
    const creatorId =
      !auth.isRestricted && typeof created_by === 'string' && created_by ? created_by : auth.userId

    // Create the daily report
    const { data, error } = await supabase
      .from('daily_reports')
      .insert({
        ...reportFields,
        created_by: creatorId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    // If worker IDs provided, add worker details
    if (worker_ids && worker_ids.length > 0 && data) {
      const workerDetails = worker_ids.map((worker_id: string) => ({
        daily_report_id: data.id,
        worker_id,
        created_at: new Date().toISOString(),
      }))

      await supabase.from('worker_details').insert(workerDetails)
    }

    return {
      success: true,
      data,
    }
  })
}

export async function updateDailyReport(id: string, updates: any) {
  return withAdminAuth(async (supabase, profile) => {
    const auth = profile.auth

    await fetchReportWithAccess(supabase, auth, id)

    // Prevent restricted users from reassigning creator
    if (auth.isRestricted && 'created_by' in updates) {
      delete updates.created_by
    }

    const { material_usage, additional_photos, ...updateFields } = updates

    const { data, error } = await supabase
      .from('daily_reports')
      .update({
        ...updateFields,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      data,
    }
  })
}

export async function setDailyReportApproval(id: string, nextStatus: 'approved' | 'submitted') {
  return withAdminAuth(async (supabase, profile) => {
    const auth = profile.auth

    await fetchReportWithAccess(supabase, auth, id)

    const now = new Date().toISOString()
    const payload =
      nextStatus === 'approved'
        ? {
            status: 'approved',
            approved_at: now,
            approved_by: auth.userId,
            updated_at: now,
          }
        : {
            status: 'submitted',
            approved_at: null,
            approved_by: null,
            updated_at: now,
          }

    const { data, error } = await supabase
      .from('daily_reports')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Send notification if approved
    if (nextStatus === 'approved' && data) {
      await notifyDailyReportApproved(data as unknown as DailyReport, auth.userId)
    }

    return {
      success: true,
      data,
      message: nextStatus === 'approved' ? '작업일지를 승인했습니다.' : '승인을 취소했습니다.',
    }
  })
}

export async function reorderAdditionalPhotos(
  reportId: string,
  updates: Array<{ id: string; upload_order: number }>
) {
  return withAdminAuth(async (supabase, profile) => {
    const auth = profile.auth

    if (!reportId) {
      throw new AppError('작업일지 ID가 필요합니다.', ErrorType.VALIDATION, 400)
    }
    if (!Array.isArray(updates) || updates.length === 0) {
      throw new AppError('재정렬할 사진이 없습니다.', ErrorType.VALIDATION, 400)
    }

    await fetchReportWithAccess(supabase, auth, reportId)

    const normalized = updates
      .map(update => ({
        id: typeof update?.id === 'string' ? update.id : '',
        upload_order: Number(update?.upload_order) || 0,
      }))
      .filter(item => item.id && item.upload_order > 0)

    if (normalized.length === 0) {
      throw new AppError('유효한 재정렬 정보가 없습니다.', ErrorType.VALIDATION, 400)
    }

    const ids = normalized.map(update => update.id)
    const { data: existing, error } = await supabase
      .from('daily_report_additional_photos')
      .select('id')
      .eq('daily_report_id', reportId)
      .in('id', ids)

    if (error) throw error
    if ((existing?.length || 0) !== normalized.length) {
      throw new AppError('일부 사진을 찾을 수 없습니다.', ErrorType.NOT_FOUND, 404)
    }

    for (const update of normalized) {
      const { error: updateError } = await supabase
        .from('daily_report_additional_photos')
        .update({ upload_order: update.upload_order })
        .eq('id', update.id)

      if (updateError) throw updateError
    }

    revalidatePath('/dashboard/admin/daily-reports')
    revalidatePath(`/dashboard/admin/daily-reports/${reportId}`)

    return { success: true }
  })
}

export async function deleteDailyReport(id: string) {
  return withAdminAuth(async (supabase, profile) => {
    const auth = profile.auth

    await fetchReportWithAccess(supabase, auth, id)

    const { error } = await supabase.from('daily_reports').delete().eq('id', id)

    if (error) throw error

    return {
      success: true,
      message: '작업일지가 삭제되었습니다.',
    }
  })
}

export async function deleteDailyReports(ids: string[]) {
  return withAdminAuth(async (supabase, profile) => {
    const auth = profile.auth

    const uniqueIds = Array.from(
      new Set(
        (ids || [])
          .map(id => (typeof id === 'number' || typeof id === 'string' ? String(id) : '').trim())
          .filter(Boolean)
      )
    )

    if (uniqueIds.length === 0) {
      throw new AppError('삭제할 작업일지를 선택하세요.', ErrorType.VALIDATION, 400)
    }

    for (const id of uniqueIds) {
      await fetchReportWithAccess(supabase, auth, id)
    }

    const { data, error } = await supabase
      .from('daily_reports')
      .delete()
      .in('id', uniqueIds)
      .select('id')

    if (error) throw error

    const deletedCount = Array.isArray(data) ? data.length : uniqueIds.length

    return {
      success: true,
      deletedCount,
      message: `${deletedCount}건의 작업일지를 삭제했습니다.`,
    }
  })
}

export async function getSites() {
  return withAdminAuth(async (supabase, profile) => {
    const auth = profile.auth

    if (auth.isRestricted && auth.restrictedOrgId) {
      // Map partner -> sites, then fetch those sites
      const { data: mappings } = await supabase
        .from('partner_site_mappings')
        .select('site_id')
        .eq('partner_company_id', auth.restrictedOrgId)

      const allowedSiteIds = (mappings || []).map(m => (m as any).site_id)
      if (allowedSiteIds.length === 0) {
        return { success: true, data: [] }
      }
      const { data, error } = await supabase
        .from('sites')
        .select('id, name')
        .eq('status', 'active')
        .in('id', allowedSiteIds)
        .order('name')
      if (error) throw error
      return {
        success: true,
        data: (data || []).map(siteRecord => ({ id: siteRecord.id, name: siteRecord.name })),
      }
    }

    const { data, error } = await supabase
      .from('sites')
      .select('id, name')
      .eq('status', 'active')
      .order('name')

    if (error) throw error

    return {
      success: true,
      data: (data || []).map(siteRecord => ({ id: siteRecord.id, name: siteRecord.name })),
    }
  })
}
