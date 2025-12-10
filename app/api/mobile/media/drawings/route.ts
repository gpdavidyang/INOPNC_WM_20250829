import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { fetchLinkedDrawingsForWorklog } from '@/lib/documents/worklog-links'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth()
  if (auth instanceof NextResponse) {
    return auth
  }

  const searchParams = request.nextUrl.searchParams
  const worklogId =
    searchParams.get('worklog_id') || searchParams.get('worklogId') || searchParams.get('reportId')
  if (!worklogId) {
    return NextResponse.json({ success: false, error: 'worklog_id is required' }, { status: 400 })
  }
  const siteId = searchParams.get('site_id') || searchParams.get('siteId') || undefined

  const supabase = createClient()
  let worklogMeta: { work_date?: string | null; work_description?: string | null } | null = null

  if (worklogId) {
    const { data } = await supabase
      .from('daily_reports')
      .select('work_date, work_description')
      .eq('id', worklogId)
      .maybeSingle()
    worklogMeta = data || null
  }

  try {
    const records = await fetchLinkedDrawingsForWorklog(worklogId, siteId)
    return NextResponse.json({
      success: true,
      data: {
        worklog: worklogMeta,
        drawings: records,
      },
    })
  } catch (error) {
    console.error('[mobile/media/drawings] failed to load linked drawings', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch linked drawings' },
      { status: 500 }
    )
  }
}
