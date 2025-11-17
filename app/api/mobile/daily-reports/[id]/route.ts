import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { fetchLinkedDrawingsForWorklog } from '@/lib/documents/worklog-links'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) return authResult

    const supabase = createClient()
    const serviceClient = createServiceRoleClient()

    const reportId = params?.id
    if (!reportId) {
      return NextResponse.json({ error: 'Report ID required' }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, organization_id, partner_company_id')
      .eq('id', authResult.userId)
      .single()

    const role = profile?.role || authResult.role || ''
    const allowedRoles = new Set([
      'worker',
      'site_manager',
      'admin',
      'system_admin',
      'customer_manager',
      'partner',
    ])
    if (!profile || (role && !allowedRoles.has(role))) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Build base query
    let query = serviceClient
      .from('daily_reports')
      .select(
        `
         *,
         sites(
           id,
           name,
           address
         ),
         profiles!daily_reports_created_by_fkey(
           id,
           full_name,
           role
         ),
         worker_assignments(
           id,
           profile_id,
           worker_name,
           labor_hours,
           profiles(
             id,
             full_name
           )
         ),
         material_usage(
           id,
           material_type,
           quantity,
           unit
         ),
         document_attachments(
           id,
           file_name,
           file_url,
           file_size,
           document_type,
           uploaded_at
         )
        `
      )
      .eq('id', reportId)
      .limit(1)

    // Partner/customer_manager: restrict by partner-site mappings
    if (role === 'partner' || role === 'customer_manager') {
      const allowedSiteIds = new Set<string>()
      const legacyFallbackEnabled = process.env.ENABLE_SITE_PARTNERS_FALLBACK === 'true'

      if (profile?.partner_company_id) {
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
            if (row?.site_id && row.contract_status !== 'terminated')
              allowedSiteIds.add(row.site_id)
          })
        }
      }

      if (allowedSiteIds.size > 0) {
        query = query.in('site_id', Array.from(allowedSiteIds))
      } else {
        return NextResponse.json({ error: 'No authorized sites' }, { status: 403 })
      }
    }

    const { data, error } = await query.maybeSingle()
    if (error || !data) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const linkedDrawings = await fetchLinkedDrawingsForWorklog(reportId, data.site_id)
    if (linkedDrawings.length) {
      const attachments =
        (Array.isArray(data.document_attachments) ? data.document_attachments : []) || []
      const normalized = linkedDrawings.map(doc => ({
        id: `linked-${doc.id}`,
        file_name: doc.title,
        file_url: doc.previewUrl || doc.url,
        document_type: 'drawing',
        file_size: 0,
        uploaded_at: doc.createdAt,
        linked_worklog_id: reportId,
        metadata: {
          source: doc.source,
          original_url: doc.url,
          preview_url: doc.previewUrl,
          markup_document_id: doc.markupId,
        },
      }))
      data.document_attachments = [...attachments, ...normalized]
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('[mobile/daily-reports/[id]] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
