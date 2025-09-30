import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    if (!['admin', 'system_admin', 'site_manager'].includes(auth.role || '')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const siteId = params.id
    const url = new URL(request.url)
    const usersParam = url.searchParams.get('users') // comma-separated

    const supabase = (() => {
      try {
        return createServiceClient()
      } catch {
        return createClient()
      }
    })()

    let query = supabase
      .from('work_records')
      .select('user_id, profile_id, labor_hours')
      .eq('site_id', siteId)

    if (usersParam) {
      const ids = usersParam
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
      if (ids.length > 0) {
        query = query.in('user_id', ids)
      }
    }

    const { data, error } = await query
    if (error) {
      console.error('Labor summary query error:', error)
      return NextResponse.json({ success: false, error: 'Query failed' }, { status: 500 })
    }

    const map: Record<string, number> = {}
    for (const r of data || []) {
      const key = r.user_id || r.profile_id
      if (!key) continue
      const v = Number(r.labor_hours) || 0
      map[key] = (map[key] || 0) + v
    }

    return NextResponse.json({ success: true, data: map })
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || 'Internal error' },
      { status: 500 }
    )
  }
}
