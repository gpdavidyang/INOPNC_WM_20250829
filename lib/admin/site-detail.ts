import { getMaterialRequests } from '@/app/actions/admin/materials'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { calculateReportManDays, computeSiteStats } from './site-stats'

/**
 * Highly optimized service to fetch all data required for the site detail page in parallel.
 * This minimizes database round-trips and reduces sequential execution time.
 */
export async function getIntegratedSiteDetail(siteId: string) {
  if (!siteId) return null

  const svc = createServiceRoleClient()

  try {
    // Stage 1: Primary data fetching (Parallel)
    const [siteRes, statsMap, docsRes, reportsRes, assignsRes, requestsRes] = await Promise.all([
      // Site info (Core)
      svc
        .from('sites')
        .select(
          'id,name,address,organization_id,status,start_date,end_date,manager_name,manager_phone,manager_email,safety_manager_name,safety_manager_phone,accommodation_name,accommodation_address,accommodation_phone,description,is_deleted'
        )
        .eq('id', siteId)
        .or('is_deleted.is.null,is_deleted.eq.false')
        .maybeSingle(),

      // Stats calculation
      computeSiteStats([siteId]).catch(err => {
        console.error('[site-detail] stats error:', err)
        return {}
      }),

      // Recent documents (Invoice types)
      svc
        .from('documents')
        .select('id, title, document_type, file_url, file_name, mime_type, created_at')
        .eq('site_id', siteId)
        .in('document_type', ['progress_payment', 'report', 'blueprint'])
        .order('created_at', { ascending: false })
        .limit(20),

      // Recent daily reports
      svc
        .from('daily_reports')
        .select(
          `
          id, work_date, status, 
          component_name, work_process, work_section, 
          total_workers, total_labor_hours, man_days,
          work_content,
          created_by, created_at,
          site:sites(name, address),
          organization:organizations!daily_reports_partner_company_id_fkey(name)
        `
        )
        .eq('site_id', siteId)
        .order('work_date', { ascending: false })
        .limit(10),

      // Site assignments
      svc
        .from('site_assignments')
        .select('id, user_id, assigned_date, is_active, role')
        .eq('site_id', siteId)
        .eq('is_active', true)
        .order('assigned_date', { ascending: false })
        .limit(20),

      // Material requests (via Server Action)
      getMaterialRequests(1, 10, '', siteId).catch(err => {
        console.error('[site-detail] material requests error:', err)
        return { success: false, data: { requests: [], total: 0, pages: 0 } }
      }),
    ])

    if (siteRes.error) {
      console.error('[site-detail] primary site fetch error:', siteRes.error)
      // If it's a real DB error, we still want to know
    }

    const site = siteRes.data
    if (!site) {
      console.warn(`[site-detail] Site not found or deleted: ${siteId}`)
      return null
    }

    // Stage 2: Enrichment (Parallel) - Fetching related entities for display
    const organizationId = site.organization_id
    const reports = Array.isArray(reportsRes.data) ? reportsRes.data : []
    const assignments = Array.isArray(assignsRes.data) ? assignsRes.data : []

    // Batch IDs for enrichment
    const creatorIds = Array.from(
      new Set(reports.map(r => r.created_by).filter(Boolean) as string[])
    )
    const assignedUserIds = Array.from(
      new Set(assignments.map(a => a.user_id).filter(Boolean) as string[])
    )
    const allUserIds = Array.from(new Set([...creatorIds, ...assignedUserIds]))

    const [orgRes, profilesRes] = await Promise.all([
      organizationId
        ? svc.from('organizations').select('*').eq('id', organizationId).maybeSingle()
        : Promise.resolve({ data: null }),

      allUserIds.length > 0
        ? svc
            .from('profiles')
            .select(
              'id, full_name, email, role, organization:organizations!profiles_organization_id_fkey(name)'
            )
            .in('id', allUserIds)
        : Promise.resolve({ data: [] }),
    ])

    const profileMap = new Map((profilesRes.data || []).map(p => [p.id, p]))

    // Enrich reports with creator info
    // Enrich reports with creator info
    const enrichedReports = reports.map(r => {
      const calc = calculateReportManDays(r)
      // DEBUG: Log specific suspect reports to trace 0.1 issue
      if (r.work_date === '2026-01-31') {
        console.log(
          `[SiteDetail] 2026-01-31 Report ${r.id}: labor=${r.total_labor_hours}, calc=${calc}, content=${JSON.stringify(r.work_content).slice(0, 50)}...`
        )
      }
      return {
        ...r,
        profile: r.created_by ? profileMap.get(r.created_by) : null,
        // For resolveAuthorLabel helper looks for BOTH profiles and profile occasionally depending on version
        profiles: r.created_by ? profileMap.get(r.created_by) : null,
        total_manhours: calc,
      }
    })

    // Enrich assignments with profile info
    const enrichedAssignments = assignments.map(a => ({
      ...a,
      profile: a.user_id ? profileMap.get(a.user_id) : null,
    }))

    return {
      site,
      organization: orgRes.data,
      stats: statsMap[siteId]
        ? {
            reports: statsMap[siteId].daily_reports_count,
            labor: statsMap[siteId].total_labor_hours,
          }
        : { reports: 0, labor: 0 },
      docs: docsRes.data || [],
      reports: enrichedReports,
      assignments: enrichedAssignments,
      requests: requestsRes?.success && requestsRes.data?.requests ? requestsRes.data.requests : [],
    }
  } catch (error) {
    console.error('[getIntegratedSiteDetail] critical error:', error)
    return null
  }
}
