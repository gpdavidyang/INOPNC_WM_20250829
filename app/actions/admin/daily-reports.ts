'use server'

import type { SupabaseClient } from '@supabase/supabase-js'
import { assertOrgAccess, type SimpleAuth } from '@/lib/auth/ultra-simple'
import { AppError, ErrorType } from '@/lib/error-handling'
import type { Database } from '@/types/database'
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
      component_name,
      work_process,
      work_section,
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
          work_process,
          work_section,
          component_name,
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
      // Search in daily_reports fields and joined sites fields
      query = query.or(
        `
        member_name.ilike.%${search}%,
        process_type.ilike.%${search}%,
        issues.ilike.%${search}%,
        component_name.ilike.%${search}%,
        work_process.ilike.%${search}%,
        work_section.ilike.%${search}%,
        sites.name.ilike.%${search}%,
        sites.address.ilike.%${search}%,
        sites.manager_name.ilike.%${search}%,
        sites.safety_manager_name.ilike.%${search}%
      `.replace(/\s+/g, '')
      )
    }
    if (component_name) {
      query = query.ilike('component_name', `%${component_name}%`)
    }
    if (work_process) {
      query = query.ilike('work_process', `%${work_process}%`)
    }
    if (work_section) {
      query = query.ilike('work_section', `%${work_section}%`)
    }

    if (auth.isRestricted) {
      if (!auth.restrictedOrgId) {
        throw new AppError('조직 정보가 필요합니다.', ErrorType.AUTHORIZATION, 403)
      }
      query = query.eq('sites.organization_id', auth.restrictedOrgId).eq('created_by', auth.userId)
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
        // Since total_manhours is calculated after query, we'll sort manually in the client
        // For now, sort by total_workers as a fallback
        query = query.order('total_workers', { ascending })
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

    // 2) Worker details count per report
    const workerCountMap = new Map<string, number>()
    if (reportIds.length > 0) {
      const { data: wd } = await supabase
        .from('daily_report_workers')
        .select('id, daily_report_id')
        .in('daily_report_id', reportIds)
      for (const row of (wd as any[]) || []) {
        const rid = String((row as any).daily_report_id)
        workerCountMap.set(rid, (workerCountMap.get(rid) || 0) + 1)
      }
    }

    // 3) Total manhours per report (work_records)
    const manhoursMap = new Map<string, number>()
    if (reportIds.length > 0) {
      const { data: wr } = await supabase
        .from('work_records')
        .select('daily_report_id, labor_hours')
        .in('daily_report_id', reportIds)
      for (const row of (wr as any[]) || []) {
        const rid = String((row as any).daily_report_id)
        const add = Number((row as any).labor_hours) || 0
        manhoursMap.set(rid, Number(((manhoursMap.get(rid) || 0) + add).toFixed(1)))
      }
    }

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

    const enrichedReports = reports.map(r => {
      const rid = String(r.id)
      const sid = String(r.site_id)
      const dateStr = String(r.work_date || r.report_date)
      const docsKey = `${sid}|${dateStr}`
      return {
        ...r,
        profiles: pMap.get(String(r.created_by)) || null,
        worker_details_count: workerCountMap.get(rid) || 0,
        daily_documents_count: docsCountMap.get(docsKey) || 0,
        total_manhours: manhoursMap.get(rid) || 0,
      }
    })

    // Sort by total_manhours if needed (since it's calculated after the query)
    const finalReports =
      sortField === 'total_manhours'
        ? enrichedReports.sort((a, b) => {
            const aValue = a.total_manhours || 0
            const bValue = b.total_manhours || 0
            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
          })
        : enrichedReports

    return {
      success: true,
      data: {
        reports: finalReports,
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

    // Get worker details
    let workers = []
    try {
      const { data: workerData } = await supabase
        .from('daily_report_workers')
        .select('*')
        .eq('daily_report_id', id)
        .order('created_at', { ascending: true })
      workers = workerData || []
    } catch (err) {
      console.error('Error fetching workers:', err)
      // Continue without workers
    }

    return {
      success: true,
      data: {
        ...data,
        profiles: creatorProfile,
        workers: workers,
        worker_details_count: workers.length,
      },
    }
  })
}

export async function createDailyReport(reportData: any) {
  return withAdminAuth(async (supabase, profile) => {
    const auth = profile.auth

    await ensureSiteAccess(supabase, auth, reportData.site_id)

    const { worker_ids, ...reportFields } = reportData

    // Create the daily report
    const { data, error } = await supabase
      .from('daily_reports')
      .insert({
        ...reportFields,
        created_by: auth.userId,
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

    const { data, error } = await supabase
      .from('daily_reports')
      .update({
        ...updates,
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

export async function getSites() {
  return withAdminAuth(async (supabase, profile) => {
    const auth = profile.auth

    let query = supabase
      .from('sites')
      .select('id, name, organization_id')
      .eq('status', 'active')
      .order('name')

    if (auth.isRestricted) {
      if (!auth.restrictedOrgId) {
        throw new AppError('조직 정보가 필요합니다.', ErrorType.AUTHORIZATION, 403)
      }
      query = query.eq('organization_id', auth.restrictedOrgId)
    }

    const { data, error } = await query

    if (error) throw error

    return {
      success: true,
      data: (data || []).map(siteRecord => ({ id: siteRecord.id, name: siteRecord.name })),
    }
  })
}
