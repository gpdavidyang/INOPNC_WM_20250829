import { getMaterialRequests } from '@/app/actions/admin/materials'
import { computeSiteStats } from '@/lib/admin/site-stats'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export async function getIntegratedSiteDetail(siteId: string) {
  const svc = createServiceRoleClient()

  // 1) Fetch ALL primary and secondary data parallelly (except Organization which needs site.org_id)
  const fetchMaterialRequests = async () => {
    const result = await getMaterialRequests(1, 10, '', undefined, siteId)
    return result.success && result.data ? result.data.requests || [] : []
  }

  const [siteRes, statsMap, docsRes, reportsRes, assignsRes, requestsData] = await Promise.all([
    svc
      .from('sites')
      .select(
        'id,name,address,organization_id,status,start_date,end_date,manager_name,manager_phone,manager_email,safety_manager_name,safety_manager_phone,safety_manager_email,accommodation_name,accommodation_address,accommodation_phone,description'
      )
      .eq('id', siteId)
      .eq('is_deleted', false)
      .maybeSingle(),
    computeSiteStats([siteId]),
    svc
      .from('unified_document_system')
      .select(
        'id, title, category_type, status, file_url, file_name, mime_type, created_at, metadata, uploaded_by'
      )
      .eq('site_id', siteId)
      .eq('category_type', 'invoice')
      .eq('is_archived', false)
      .order('created_at', { ascending: false })
      .limit(10),
    svc
      .from('daily_reports')
      .select(
        'id, work_date, status, member_name, process_type, component_name, work_process, work_section, total_workers, created_by, site_id, total_labor_hours'
      )
      .eq('site_id', siteId)
      .order('work_date', { ascending: false })
      .limit(10),
    svc
      .from('site_assignments')
      .select('id, user_id, role, assigned_date, is_active')
      .eq('site_id', siteId)
      .eq('is_active', true)
      .order('assigned_date', { ascending: false })
      .limit(10),
    fetchMaterialRequests(),
  ])

  const site = siteRes.data
  if (!site) return null

  const stats = statsMap[siteId] || { daily_reports_count: 0, total_labor_hours: 0 }

  // 2) Fetch Organization and perform Enrichment (Enrichment needs reports from Step 1)
  const [orgRes, profilesRes, laborRecordsRes, workerRecordsRes] = await Promise.all([
    site.organization_id
      ? svc.from('organizations').select('*').eq('id', site.organization_id).maybeSingle()
      : Promise.resolve({ data: null }),
    // Profiles enrichment
    (async () => {
      const reports = Array.isArray(reportsRes.data) ? reportsRes.data : []
      const cIds = Array.from(new Set(reports.map(r => String(r.created_by)).filter(Boolean)))
      return cIds.length > 0
        ? svc.from('profiles').select('id, full_name, role').in('id', cIds)
        : { data: [] }
    })(),
    // Work records enrichment
    (async () => {
      const reports = Array.isArray(reportsRes.data) ? reportsRes.data : []
      const rIds = reports.map(r => r.id)
      return rIds.length > 0
        ? svc
            .from('work_records')
            .select('daily_report_id, labor_hours')
            .in('daily_report_id', rIds)
        : { data: [] }
    })(),
    // Workers enrichment
    (async () => {
      const reports = Array.isArray(reportsRes.data) ? reportsRes.data : []
      const rIds = reports.map(r => r.id)
      return rIds.length > 0
        ? svc.from('daily_report_workers').select('daily_report_id').in('daily_report_id', rIds)
        : { data: [] }
    })(),
  ])

  const organization = orgRes.data
  const reports = Array.isArray(reportsRes.data) ? reportsRes.data : []

  const pMap = new Map((profilesRes.data || []).map((p: any) => [String(p.id), p]))
  const workerMap = new Map<string, number>()
  ;(workerRecordsRes.data || []).forEach((w: any) => {
    const rid = String(w.daily_report_id)
    workerMap.set(rid, (workerMap.get(rid) || 0) + 1)
  })
  const laborMap = new Map<string, number>()
  ;(laborRecordsRes.data || []).forEach((l: any) => {
    const rid = String(l.daily_report_id)
    laborMap.set(rid, (laborMap.get(rid) || 0) + Number(l.labor_hours || 0))
  })

  const siteInfoForReports = {
    id: site.id,
    name: site.name,
    address: site.address,
  }

  const enrichedReports = reports.map((r: any) => {
    const rid = String(r.id)
    const totalLaborHours = laborMap.get(rid) || 0
    return {
      ...r,
      profiles: pMap.get(String(r.created_by)) || null,
      sites: siteInfoForReports,
      organization: organization ? { id: organization.id, name: organization.name } : null,
      worker_details_count: workerMap.get(rid) || 0,
      total_manhours: totalLaborHours / 8,
    }
  })

  return {
    site,
    organization,
    stats: {
      reports: stats.daily_reports_count,
      labor: stats.total_labor_hours,
    },
    docs: docsRes.data || [],
    reports: enrichedReports,
    assignments: assignsRes.data || [],
    requests: requestsData || [],
  }
}
