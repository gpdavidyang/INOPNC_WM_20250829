import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth
    if (!auth.role || !['admin', 'system_admin', 'site_manager'].includes(auth.role)) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    const siteId = params.id
    if (!siteId)
      return NextResponse.json({ success: false, error: 'Site ID is required' }, { status: 400 })

    const sp = new URL(request.url).searchParams
    const q = (sp.get('q') || '').trim()
    const status = sp.get('status') || undefined
    const sortParam = (sp.get('sort') as 'date' | 'status' | 'number') || 'date'
    const orderParam = (sp.get('order') as 'asc' | 'desc') || 'desc'
    const limit = Math.min(201, Math.max(1, Number(sp.get('limit')) || 21))
    const offset = Math.max(0, Number(sp.get('offset')) || 0)

    const supabase = createClient()

    let query = supabase
      .from('material_requests')
      .select(
        `
        id,
        request_number,
        status,
        request_date,
        created_at,
        requester:profiles!material_requests_requested_by_fkey(full_name)
      `
      )
      .eq('site_id', siteId)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    if (q) {
      // Search by request number only to avoid join filter quirks
      query = query.ilike('request_number', `%${q}%`)
    }

    // Sorting
    if (sortParam === 'status') {
      query = query.order('status', { ascending: orderParam === 'asc' })
    } else if (sortParam === 'number') {
      query = query.order('request_number', { ascending: orderParam === 'asc' })
    } else {
      // date
      query = query
        .order('request_date', { ascending: orderParam === 'asc', nullsFirst: false })
        .order('created_at', { ascending: orderParam === 'asc' })
    }

    // Count total (with same filters)
    let countQuery = supabase
      .from('material_requests')
      .select('*', { count: 'exact', head: true })
      .eq('site_id', siteId)
    if (status && status !== 'all') countQuery = countQuery.eq('status', status)
    if (q) countQuery = countQuery.ilike('request_number', `%${q}%`)

    const { count: totalCount } = await countQuery

    // Pagination (overfetch by 1 to detect hasNext on client)
    query = query.range(offset, offset + limit - 1)
    const { data, error } = await query
    if (error) {
      if (process.env.NODE_ENV === 'development') console.error('Requests query error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch requests' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: data || [], total: totalCount ?? 0 })
  } catch (e) {
    if (process.env.NODE_ENV === 'development') console.error('Requests API error:', e)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
