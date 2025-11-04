import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { updateDailyReport, deleteDailyReport } from '@/app/actions/admin/daily-reports'

export const dynamic = 'force-dynamic'

// PATCH /api/admin/daily-reports/:id
// Guards: duplicate site_id+work_date when updated
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth
    const id = params.id
    const updatesRaw = await req.json().catch(() => ({}))
    const {
      worker_entries: workerEntriesUnused,
      material_usage: materialUsageUnused,
      additional_photos: additionalPhotosUnused,
      work_entries: workEntriesUnused,
      ...updates
    } = updatesRaw || {}

    const siteId = String(updates?.site_id || '').trim()
    const workDate = String(updates?.work_date || updates?.report_date || '').trim()
    if (siteId && workDate) {
      const supabase = createClient()
      const { data: dup } = await supabase
        .from('daily_reports')
        .select('id')
        .eq('site_id', siteId)
        .eq('work_date', workDate)
        .neq('id', id)
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
    }

    const result = await updateDailyReport(id, updates)
    if (!result.success) {
      console.error('[admin/daily-reports:PATCH] update failed', {
        id,
        payload: updates,
        error: result.error,
      })
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }
    return NextResponse.json({ success: true, data: result.data })
  } catch (e) {
    console.error('[admin/daily-reports:PATCH] error:', e)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/daily-reports/:id
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth
    const id = params.id
    const result = await deleteDailyReport(id)
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }
    return NextResponse.json({ success: true, message: result.message })
  } catch (e) {
    console.error('[admin/daily-reports:DELETE] error:', e)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
