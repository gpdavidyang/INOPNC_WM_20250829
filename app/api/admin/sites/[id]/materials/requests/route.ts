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

    const baseSelect = `id, request_number, status, requested_by, request_date, created_at,
         requester:profiles!material_requests_requested_by_fkey(full_name)`

    let query = svc
      .from('material_requests')
      .select(baseSelect, { count: 'exact' })
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
    if (error && error.code === '42703') {
      // request_date column missing -> fallback to created_at only
      let fallbackQuery = svc
        .from('material_requests')
        .select(
          `id, request_number, status, requested_by, created_at,
             requester:profiles!material_requests_requested_by_fkey(full_name)`,
          { count: 'exact' }
        )
        .eq('site_id', siteId)

      if (statusParam && statusParam !== 'all') {
        fallbackQuery = fallbackQuery.eq('status', statusParam)
      }
      if (q) {
        fallbackQuery = fallbackQuery.or(`request_number.ilike.%${q}%`)
      }

      const fallbackOrder =
        sortParam === 'number' ? 'request_number' : sortParam === 'status' ? 'status' : 'created_at'
      fallbackQuery = fallbackQuery.order(fallbackOrder, { ascending: orderParam === 'asc' })

      const {
        data: fbData,
        error: fbError,
        count: fbCount,
      } = await fallbackQuery.range(offset, offset + limit - 1)
      if (fbError) throw fbError
      const normalized = (fbData || []).map(row => ({ ...row, request_date: row.created_at }))
      return NextResponse.json({ success: true, data: normalized, total: fbCount || 0 })
    }
    if (error) throw error

    const normalized = (data || []).map(row => ({
      ...row,
      request_date: row.request_date || row.created_at,
    }))
    return NextResponse.json({ success: true, data: normalized, total: count || 0 })
  } catch (e) {
    console.error('[admin/sites/:id/materials/requests] error:', e)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
