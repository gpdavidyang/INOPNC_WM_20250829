import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) return authResult

    const supabase = createClient()
    const serviceClient = createServiceRoleClient()

    const reportId = params.id
    if (!reportId) {
      return NextResponse.json({ error: 'Report ID required' }, { status: 400 })
    }

    // Load profile and allowed sites for this partner
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, partner_company_id')
      .eq('id', authResult.userId)
      .single()

    if (profileError || !profile || !profile.partner_company_id) {
      return NextResponse.json({ error: 'Not a partner user' }, { status: 403 })
    }

    const allowedSiteIds = new Set<string>()
    const legacyFallbackEnabled = process.env.ENABLE_SITE_PARTNERS_FALLBACK === 'true'

    const { data: mappingRows, error: mappingError } = await supabase
      .from('partner_site_mappings')
      .select('site_id, is_active')
      .eq('partner_company_id', profile.partner_company_id)

    if (!mappingError) {
      ;(mappingRows || []).forEach(row => {
        if (row?.site_id && row.is_active) allowedSiteIds.add(row.site_id)
      })
    }

    if ((mappingError || allowedSiteIds.size === 0) && legacyFallbackEnabled) {
      const { data: legacyRows } = await supabase
        .from('site_partners')
        .select('site_id, contract_status')
        .eq('partner_company_id', profile.partner_company_id)

      ;(legacyRows || []).forEach(row => {
        if (row?.site_id && row.contract_status !== 'terminated') allowedSiteIds.add(row.site_id)
      })
    }

    // Query the target report first to verify site access
    const { data: reportRow, error: headError } = await serviceClient
      .from('daily_reports')
      .select('id, site_id')
      .eq('id', reportId)
      .maybeSingle()

    if (headError || !reportRow) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    if (!allowedSiteIds.has(reportRow.site_id)) {
      return NextResponse.json({ error: 'Not authorized for this report' }, { status: 403 })
    }

    // Fetch enriched details
    const { data, error } = await serviceClient
      .from('daily_reports')
      .select(
        `
        id,
        work_date,
        status,
        site_id,
        created_at,
        additional_notes,
        safety_notes,
        work_content,
        location_info,
        sites:site_id(id, name, address),
        profiles:created_by(id, full_name, role),
        worker_assignments(id, profile_id, worker_name, labor_hours, profiles(id, full_name)),
        material_usage(id, material_type, quantity, unit),
        document_attachments(id, file_name, file_url, file_size, document_type, uploaded_at)
      `
      )
      .eq('id', reportId)
      .maybeSingle()

    if (error || !data) {
      return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 })
    }

    // Normalize minimal detail payload
    const detail = {
      id: data.id,
      siteId: data.site_id,
      siteName: data.sites?.name || '현장 미지정',
      workDate: data.work_date,
      status: data.status,
      notes: data.additional_notes ?? null,
      safetyNotes: data.safety_notes ?? null,
      workContent: data.work_content ?? null,
      location: data.location_info ?? null,
      createdBy: data.profiles ? { id: data.profiles.id, name: data.profiles.full_name } : null,
      workers: Array.isArray(data.worker_assignments)
        ? data.worker_assignments.map((w: any) => ({
            id: w.id,
            name: w.worker_name || w.profiles?.full_name || '-',
            manDays: Number(w.labor_hours) || 0,
          }))
        : [],
      materials: Array.isArray(data.material_usage)
        ? data.material_usage.map((m: any) => ({
            type: m.material_type,
            qty: m.quantity,
            unit: m.unit,
          }))
        : [],
      attachments: Array.isArray(data.document_attachments)
        ? data.document_attachments.map((d: any) => ({
            id: d.id,
            name: d.file_name,
            url: d.file_url,
            size: d.file_size,
            type: d.document_type,
            uploadedAt: d.uploaded_at,
          }))
        : [],
    }

    return NextResponse.json({ success: true, data: detail })
  } catch (error) {
    console.error('partner/daily-reports/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
