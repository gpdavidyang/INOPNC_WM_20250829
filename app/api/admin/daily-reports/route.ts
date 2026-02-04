import { createDailyReport } from '@/app/actions/admin/daily-reports'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// POST /api/admin/daily-reports
// Body: { site_id, work_date, ... }
// Guards:
//  - Site must be active
//  - No duplicate (site_id + work_date)
export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth
    const body = await req.json().catch(() => ({}))
    const siteId = String(body?.site_id || '').trim()
    const workDate = String(body?.work_date || body?.report_date || '').trim()
    if (!siteId || !workDate) {
      return NextResponse.json(
        { success: false, error: 'site_id와 work_date는 필수입니다.' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    // 1) Site status guard
    const { data: site } = await supabase
      .from('sites')
      .select('status')
      .eq('id', siteId)
      .maybeSingle()
    const status = (site as any)?.status || 'active'
    if (status !== 'active') {
      return NextResponse.json(
        { success: false, error: '완료/중단 현장에는 작업일지를 작성할 수 없습니다.' },
        { status: 409 }
      )
    }

    // 2) Duplicate check
    const { data: dup } = await supabase
      .from('daily_reports')
      .select('id')
      .eq('site_id', siteId)
      .eq('work_date', workDate)
      .maybeSingle()
    if (dup?.id) {
      return NextResponse.json(
        {
          success: false,
          error: '동일한 현장과 일자의 작업일지가 이미 존재합니다.',
          existing_id: dup.id,
        },
        { status: 409 }
      )
    }

    const result = await createDailyReport(body)
    if (!result.success || !result.data?.id) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    const newId = result.data.id

    // Sync worker entries if provided
    if (Array.isArray(body.worker_entries)) {
      try {
        const service = createServiceClient()
        const insertRows = body.worker_entries.map((entry: any) => ({
          daily_report_id: newId,
          profile_id: entry.worker_id || null,
          worker_id: entry.worker_id || null,
          worker_name: entry.worker_name || '이름없음',
          labor_hours: Number(entry.labor_hours || entry.hours || 0),
          is_direct_input: entry.is_direct_input ?? !entry.worker_id,
          notes: entry.notes || null,
        }))
        if (insertRows.length > 0) {
          await service.from('worker_assignments').insert(insertRows)
        }
      } catch (err) {
        console.error('[admin/daily-reports:POST] worker sync failed:', err)
      }
    }

    // Sync material usage if provided
    if (Array.isArray(body.material_usage)) {
      try {
        const service = createServiceClient()
        const insertRows = body.material_usage.map((entry: any) => ({
          daily_report_id: newId,
          material_id: entry.material_id || null,
          material_code: entry.material_code || null,
          material_name: entry.material_name || '자재',
          material_type: String(entry.material_code || entry.material_name || 'ETC').toUpperCase(),
          quantity: Number(entry.quantity || 0),
          quantity_val: Number(entry.quantity || 0),
          amount: Number(entry.quantity || 0),
          unit: entry.unit || null,
          notes: entry.notes || null,
        }))
        if (insertRows.length > 0) {
          await service.from('material_usage').insert(insertRows)
        }
      } catch (err) {
        console.error('[admin/daily-reports:POST] material sync failed:', err)
      }
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (e) {
    console.error('[admin/daily-reports:POST] error:', e)
    const message = e instanceof Error ? e.message : 'Internal server error'
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
}
