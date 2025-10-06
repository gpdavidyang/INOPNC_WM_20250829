import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth()
  if (auth instanceof NextResponse) return auth
  if (!auth.role || !['admin', 'system_admin'].includes(auth.role)) {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))

  try {
    const svc = createServiceRoleClient()
    const payload: any = {
      site_id: body.site_id,
      work_date: body.work_date,
      member_name: body.member_name || auth.email || '관리자',
      process_type: body.process_type || 'general',
      total_workers: body.total_workers ?? 0,
      npc1000_incoming: body.npc1000_incoming ?? 0,
      npc1000_used: body.npc1000_used ?? 0,
      npc1000_remaining: body.npc1000_remaining ?? 0,
      issues: body.issues || null,
      component_name: body.component_name || null,
      work_process: body.work_process || null,
      work_section: body.work_section || null,
      status: body.status || 'draft',
      created_by: auth.userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data: report, error } = await svc
      .from('daily_reports')
      .insert(payload)
      .select()
      .single()
    if (error) throw error

    // Optional worker entries
    if (Array.isArray(body.worker_entries) && report) {
      const rows = body.worker_entries
        .filter((w: any) => (w.worker_name || w.worker_id) && Number(w.labor_hours) > 0)
        .map((w: any) => ({
          daily_report_id: report.id,
          worker_name: w.worker_name || String(w.worker_id || ''),
          work_hours: Number(w.labor_hours) || 0,
          created_at: new Date().toISOString(),
        }))
      if (rows.length > 0) await svc.from('daily_report_workers').insert(rows)
    }

    return NextResponse.json({ success: true, data: report })
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || 'Failed to create' },
      { status: 400 }
    )
  }
}
