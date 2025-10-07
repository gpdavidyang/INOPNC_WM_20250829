import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const dynamic = 'force-dynamic'

// GET /api/admin/sites/:id/materials/requests
// Query: q, status, sort(date|status|number), order(asc|desc), limit, offset
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
    const limit = Math.max(1, Math.min(200, Number(searchParams.get('limit') || '21') || 21))
    const offset = Math.max(0, Number(searchParams.get('offset') || '0') || 0)

    const svc = createServiceRoleClient()

    let query = svc
      .from('material_requests')
      .select(
        `id, request_number, status, requested_by, request_date, created_at,
         requester:profiles!material_requests_requested_by_fkey(full_name)`,
        { count: 'exact' }
      )
      .eq('site_id', siteId)

    if (statusParam && statusParam !== 'all') {
      query = query.eq('status', statusParam)
    }

    if (q) {
      // best-effort filter by request number
      query = query.or(`request_number.ilike.%${q}%`)
    }

    const orderBy =
      sortParam === 'number' ? 'request_number' : sortParam === 'status' ? 'status' : 'request_date'
    query = query.order(orderBy, { ascending: orderParam === 'asc' })

    const { data, error, count } = await query.range(offset, offset + limit - 1)
    if (error) throw error

    return NextResponse.json({ success: true, data: data || [], total: count || 0 })
  } catch (e) {
    console.error('[admin/sites/:id/materials/requests] error:', e)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
