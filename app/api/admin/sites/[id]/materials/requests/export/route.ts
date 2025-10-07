import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const dynamic = 'force-dynamic'

// GET /api/admin/sites/:id/materials/requests/export
// Exports site material requests as CSV with simple filters
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const siteId = params.id
    if (!siteId) {
      return NextResponse.json({ success: false, error: 'Missing site id' }, { status: 400 })
    }

    const { searchParams } = new URL(req.url)
    const q = (searchParams.get('q') || '').trim()
    const statusParam = (searchParams.get('status') || 'all').trim()
    const sortParam = (searchParams.get('sort') || 'date').trim() as 'date' | 'status' | 'number'
    const orderParam = (searchParams.get('order') || 'desc').trim() as 'asc' | 'desc'

    const svc = createServiceRoleClient()

    let query = svc
      .from('material_requests')
      .select(
        `id, request_number, status, requested_by, request_date, created_at,
         requester:profiles!material_requests_requested_by_fkey(full_name)`
      )
      .eq('site_id', siteId)

    if (statusParam && statusParam !== 'all') {
      query = query.eq('status', statusParam)
    }
    if (q) {
      query = query.or(`request_number.ilike.%${q}%`)
    }

    const orderBy =
      sortParam === 'number' ? 'request_number' : sortParam === 'status' ? 'status' : 'request_date'
    query = query.order(orderBy, { ascending: orderParam === 'asc' })

    const { data, error } = await query.limit(1000)
    if (error) throw error

    const rows = data || []
    const header = ['요청번호', '요청자', '상태', '요청일', '생성일']
    const lines = [header.join(',')]
    for (const r of rows) {
      const num = JSON.stringify(r.request_number || r.id || '')
      const reqBy = JSON.stringify(r.requester?.full_name || r.requested_by || '')
      const st = JSON.stringify(r.status || '')
      const rd = JSON.stringify(r.request_date || '')
      const cd = JSON.stringify(r.created_at || '')
      lines.push([num, reqBy, st, rd, cd].join(','))
    }
    const csv = lines.join('\n')

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="site_${siteId}_material_requests.csv"`,
      },
    })
  } catch (e) {
    console.error('[admin/sites/:id/materials/requests/export] error:', e)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
