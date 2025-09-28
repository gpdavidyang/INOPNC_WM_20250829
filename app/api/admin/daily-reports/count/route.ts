import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(request.url)
    const status = (searchParams.get('status') || '').toLowerCase()
    const scope = (searchParams.get('scope') || 'all').toLowerCase() // 'all' | 'my'

    if (!status) {
      return NextResponse.json(
        { error: 'status is required (draft|approved|submitted|rejected)' },
        { status: 400 }
      )
    }

    const service = createServiceRoleClient()
    let query = service
      .from('daily_reports')
      .select('id', { count: 'exact', head: true })
      .eq('status', status)

    if (scope === 'my') {
      query = query.eq('created_by', auth.userId)
    }

    const { count, error } = await query
    if (error) {
      console.error('[count daily_reports] query error:', error)
      return NextResponse.json({ error: 'Failed to count daily reports' }, { status: 500 })
    }

    return NextResponse.json({ success: true, status, scope, count: count || 0 })
  } catch (error) {
    console.error('[count daily_reports] unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
