import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) return authResult

    const supabase = createClient()
    const serviceClient = createServiceRoleClient()

    // Load profile to get partner company
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, partner_company_id')
      .eq('id', authResult.userId)
      .single()

    if (profileError || !profile || !profile.partner_company_id) {
      return NextResponse.json({ error: 'Not a partner user' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const siteIdParam = searchParams.get('site_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const status = searchParams.get('status')
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1)
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10), 1), 100)
    const offset = (page - 1) * limit

    // Resolve allowed site IDs for this partner
    const allowedSiteIds = new Set<string>()
    const legacyFallbackEnabled = process.env.ENABLE_SITE_PARTNERS_FALLBACK === 'true'

    const { data: mappingRows, error: mappingError } = await supabase
      .from('partner_site_mappings')
      .select('site_id, is_active')
      .eq('partner_company_id', profile.partner_company_id)

    if (!mappingError) {
      ;(mappingRows || []).forEach(row => {
        if (row?.site_id && row.is_active) {
          allowedSiteIds.add(row.site_id)
        }
      })
    }

    if ((mappingError || allowedSiteIds.size === 0) && legacyFallbackEnabled) {
      const { data: legacyRows } = await supabase
        .from('site_partners')
        .select('site_id, contract_status')
        .eq('partner_company_id', profile.partner_company_id)

      ;(legacyRows || []).forEach(row => {
        if (row?.site_id && row.contract_status !== 'terminated') {
          allowedSiteIds.add(row.site_id)
        }
      })
    }

    if (allowedSiteIds.size === 0) {
      return NextResponse.json({
        success: true,
        data: { reports: [], totalCount: 0, totalPages: 0, currentPage: page },
      })
    }

    const allowedIds = Array.from(allowedSiteIds)

    // Build restricted query with service role but constrained to allowed site IDs
    let query = serviceClient
      .from('daily_reports')
      .select(
        `
         id,
         work_date,
         status,
         site_id,
         created_at,
         sites:site_id(id, name, address),
         profiles:created_by(id, full_name),
         worker_assignments(id, labor_hours),
         document_attachments(id)
        `
      )
      .in('site_id', allowedIds)

    if (siteIdParam) {
      if (!allowedSiteIds.has(siteIdParam)) {
        return NextResponse.json({ error: 'Not authorized for this site' }, { status: 403 })
      }
      query = query.eq('site_id', siteIdParam)
    }

    if (startDate) query = query.gte('work_date', startDate)
    if (endDate) query = query.lte('work_date', endDate)
    if (status) query = query.eq('status', status)

    const { count: totalCount } = await query.select('*', { count: 'exact', head: true })
    const { data, error } = await query
      .order('work_date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('partner/daily-reports query error:', error)
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
    }

    const reports = (data || []).map((row: any) => {
      const workerAssignments = Array.isArray(row.worker_assignments) ? row.worker_assignments : []
      const totalManhours = workerAssignments.reduce(
        (sum: number, w: any) => sum + (Number(w?.labor_hours) || 0),
        0
      )
      const documentsCount = Array.isArray(row.document_attachments)
        ? row.document_attachments.length
        : 0

      return {
        id: row.id,
        siteId: row.site_id,
        siteName: row.sites?.name || '현장 미지정',
        workDate: row.work_date,
        status: row.status,
        createdByName: row.profiles?.full_name || null,
        workerCount: workerAssignments.length,
        documentsCount,
        totalManhours,
      }
    })

    const totalPages = Math.ceil((totalCount || 0) / limit)

    return NextResponse.json({
      success: true,
      data: {
        reports,
        totalCount: totalCount || 0,
        totalPages,
        currentPage: page,
      },
    })
  } catch (error) {
    console.error('partner/daily-reports error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
