import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    if (!['admin', 'system_admin', 'site_manager'].includes(authResult.role || '')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const supabase = (() => {
      try {
        return createServiceClient()
      } catch {
        return createClient()
      }
    })()

    const siteId = params.id
    if (!siteId) {
      return NextResponse.json({ error: 'site id required' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50')))
    const q = (searchParams.get('q') || '').trim()
    const ensureId = (searchParams.get('worklogId') || '').trim()

    let query = supabase
      .from('daily_reports')
      .select(
        'id, site_id, work_date, member_name, status, work_process, process_type, component_name, total_workers',
        {
          count: 'exact',
        }
      )
      .eq('site_id', siteId)
      .order('work_date', { ascending: false, nullsFirst: false })
      .limit(limit)

    if (q) {
      const pattern = `%${q}%`
      query = query.or(
        `member_name.ilike.${pattern},work_process.ilike.${pattern},status.ilike.${pattern}`
      )
    }

    const { data, error } = await query
    if (error) {
      console.error('[admin/sites/:id/worklogs] query failed:', error)
      return NextResponse.json({ error: 'Failed to load worklogs' }, { status: 500 })
    }

    let worklogs = data || []

    if (ensureId && !worklogs.some(log => log.id === ensureId)) {
      const { data: ensureData } = await supabase
        .from('daily_reports')
        .select(
          'id, site_id, work_date, member_name, status, work_process, process_type, component_name, total_workers'
        )
        .eq('site_id', siteId)
        .eq('id', ensureId)
        .maybeSingle()
      if (ensureData) {
        worklogs = [ensureData, ...worklogs].filter(
          (log, index, self) => self.findIndex(item => item.id === log.id) === index
        )
      }
    }

    return NextResponse.json({ success: true, data: worklogs })
  } catch (error) {
    console.error('[admin/sites/:id/worklogs] unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
