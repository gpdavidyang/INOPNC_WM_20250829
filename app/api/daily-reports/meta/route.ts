import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const authResult = await requireApiAuth()
  if (authResult instanceof NextResponse) {
    return authResult
  }
  if (!(authResult.role === 'admin' || authResult.role === 'system_admin')) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const rawIds = (searchParams.get('ids') || '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean)

  if (rawIds.length === 0) {
    return NextResponse.json({ success: true, data: {} })
  }

  try {
    const service = createServiceRoleClient()
    const { data, error } = await service
      .from('daily_reports')
      .select('id, work_date, component_name, work_process, process_type')
      .in('id', rawIds)

    if (error) {
      console.error('[daily-reports/meta] query error:', error)
      return NextResponse.json({ error: 'Failed to fetch worklog metadata' }, { status: 500 })
    }

    const map: Record<
      string,
      {
        work_date?: string | null
        component_name?: string | null
        work_process?: string | null
        process_type?: string | null
      }
    > = {}
    for (const row of data || []) {
      if (!row?.id) continue
      map[row.id as string] = {
        work_date: row.work_date || null,
        component_name: row.component_name || null,
        work_process: row.work_process || null,
        process_type: row.process_type || null,
      }
    }

    return NextResponse.json({ success: true, data: map })
  } catch (error) {
    console.error('[daily-reports/meta] unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
