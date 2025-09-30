import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const siteId = params.id
    if (!siteId) return NextResponse.json({ error: 'Site id required' }, { status: 400 })

    const supabase = createClient()
    const service = createServiceRoleClient()

    // Verify partner access if partner role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, partner_company_id')
      .eq('id', auth.userId)
      .maybeSingle()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    if (profile.role === 'customer_manager' || profile.role === 'partner') {
      if (!profile.partner_company_id)
        return NextResponse.json({ error: 'Not a partner user' }, { status: 403 })

      const { data: mapping } = await supabase
        .from('partner_site_mappings')
        .select('site_id')
        .eq('partner_company_id', profile.partner_company_id)
        .eq('site_id', siteId)
        .eq('is_active', true)
        .limit(1)

      if (!mapping || mapping.length === 0) {
        return NextResponse.json({ error: 'Not authorized for site' }, { status: 403 })
      }
    }

    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date') // yyyy-mm-dd optional

    const { data: site, error } = await service
      .from('sites')
      .select(
        'id, name, address, status, start_date, end_date, manager_phone, construction_manager_phone, safety_manager_phone'
      )
      .eq('id', siteId)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!site) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Latest (or by-date) worklog summary
    let work: any = null
    try {
      let reportsQuery = service
        .from('daily_reports')
        .select('id, work_date, status, progress_rate, work_content, location_info')
        .eq('site_id', siteId)

      if (date) {
        reportsQuery = reportsQuery.eq('work_date', date)
      } else {
        reportsQuery = reportsQuery.order('work_date', { ascending: false }).limit(1)
      }

      const { data: reportRow } = await reportsQuery.maybeSingle()

      if (reportRow) {
        let attachmentsCount = 0
        try {
          const { count } = await service
            .from('document_attachments')
            .select('*', { count: 'exact', head: true })
            .eq('daily_report_id', reportRow.id)

          attachmentsCount = count || 0
        } catch {
          /* ignore count error */
        }

        work = {
          report_id: reportRow.id,
          date: reportRow.work_date,
          status: reportRow.status,
          progress_rate: reportRow.progress_rate ?? null,
          work_content: reportRow.work_content ?? null,
          location_info: reportRow.location_info ?? null,
          attachments_count: attachmentsCount,
        }
      }
    } catch (err) {
      console.warn('[sites/summary] worklog summary error:', err)
    }

    return NextResponse.json({
      success: true,
      data: {
        id: site.id,
        name: site.name,
        address: site.address || null,
        status: site.status || null,
        start_date: site.start_date || null,
        end_date: site.end_date || null,
        managers: [
          ((site as any).manager_phone || (site as any).construction_manager_phone) && {
            role: '현장 소장',
            phone: (site as any).manager_phone || (site as any).construction_manager_phone,
          },
          site.safety_manager_phone && { role: '안전 관리자', phone: site.safety_manager_phone },
        ].filter(Boolean),
        work,
      },
    })
  } catch (e) {
    console.error('[sites/summary] error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
