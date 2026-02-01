import { getMaterialRequests } from '@/app/actions/admin/materials'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/admin/sites/:id/integrated
// Minimal integrated overview bundle for the site detail Overview tab
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const siteId = params.id
    if (!siteId)
      return NextResponse.json({ success: false, error: 'Missing site id' }, { status: 400 })

    const svc = createServiceRoleClient()

    const { data: siteRow } = await svc
      .from('sites')
      .select('id,name,address,organization_id')
      .eq('id', siteId)
      .maybeSingle()
    const siteInfo = siteRow
      ? {
          id: String(siteRow.id),
          name: siteRow.name ?? null,
          address: siteRow.address ?? null,
          organization_id: siteRow.organization_id ?? null,
        }
      : null

    const orgId = siteInfo?.organization_id ? String(siteInfo.organization_id) : null
    const { data: orgRow } = orgId
      ? await svc.from('organizations').select('id,name').eq('id', orgId).maybeSingle()
      : { data: null }
    const orgInfo = orgRow ? { id: String(orgRow.id), name: orgRow.name ?? null } : null

    const fetchMaterialRequests = async () => {
      const result = await getMaterialRequests(1, 10, '', undefined, siteId)
      if (!result.success || !result.data) {
        return []
      }
      return result.data.requests || []
    }

    const [docsRes, reportsRes, assignsRes, requestsData] = await Promise.all([
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
          `
            id,
            work_date,
            status,
            member_name,
            process_type,
            component_name,
            work_process,
            work_section,
            total_workers,
            created_by,
            site_id,
          `
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

    // Enrich recent reports with counts and totals
    const reports = Array.isArray(reportsRes.data) ? reportsRes.data : []
    const creatorIds = Array.from(
      new Set(
        reports
          .map((r: any) => r?.created_by)
          .filter(Boolean)
          .map((id: any) => String(id))
      )
    )

    const [profilesRes] = await Promise.all([
      creatorIds.length > 0
        ? svc
            .from('profiles')
            .select('id, full_name, email, role, phone, last_login_at')
            .in('id', creatorIds)
        : Promise.resolve({ data: [] as any[] } as any),
    ])

    const profiles = Array.isArray((profilesRes as any)?.data) ? (profilesRes as any).data : []
    const pMap = new Map(profiles.map((p: any) => [String(p.id), p]))

    const enrichedReports = await Promise.all(
      reports.map(async (r: any) => {
        try {
          const workDate = typeof r?.work_date === 'string' && r.work_date ? r.work_date : null
          const [workerCountRes, laborHoursRes, docsCountRes] = await Promise.all([
            svc
              .from('daily_report_workers')
              .select('id', { count: 'exact', head: true })
              .eq('daily_report_id', r.id),
            svc.from('work_records').select('labor_hours').eq('daily_report_id', r.id),
            workDate
              ? svc
                  .from('documents')
                  .select('id', { count: 'exact', head: true })
                  .eq('site_id', siteId)
                  .gte('created_at', `${workDate}T00:00:00`)
                  .lt('created_at', `${workDate}T23:59:59`)
              : Promise.resolve({ count: 0 } as any),
          ])

          const totalLaborHours = (laborHoursRes.data || []).reduce(
            (sum: number, w: any) => sum + (Number(w.labor_hours) || 0),
            0
          )
          const totalManhours = totalLaborHours / 8

          return {
            ...r,
            profiles: pMap.get(String(r.created_by)) || null,
            sites: siteInfo,
            organization: orgInfo,
            worker_details_count: workerCountRes.count || 0,
            daily_documents_count: docsCountRes.count || 0,
            total_manhours: totalManhours,
          }
        } catch {
          return {
            ...r,
            profiles: pMap.get(String(r.created_by)) || null,
            sites: siteInfo,
            organization: orgInfo,
            worker_details_count: 0,
            daily_documents_count: 0,
            total_manhours: 0,
          }
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: {
        docs: docsRes.data || [],
        reports: enrichedReports,
        assignments: assignsRes.data || [],
        requests: requestsData || [],
      },
    })
  } catch (e) {
    console.error('[admin/sites/:id/integrated] error:', e)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
