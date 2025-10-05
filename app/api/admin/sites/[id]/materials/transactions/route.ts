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
    const limit = Math.min(201, Math.max(1, Number(sp.get('limit')) || 21))
    const offset = Math.max(0, Number(sp.get('offset')) || 0)

    const supabase = createClient()

    // Optional material filter by name/code when q provided
    let materialIds: string[] | null = null
    if (q) {
      const { data: mats, error: matsError } = await supabase
        .from('materials')
        .select('id')
        .or(`name.ilike.%${q}%,code.ilike.%${q}%`)
        .limit(1000)
      if (matsError) {
        if (process.env.NODE_ENV === 'development')
          console.error('Materials search error:', matsError)
      }
      materialIds = Array.isArray(mats) ? mats.map((m: any) => m.id).filter(Boolean) : []
      if (materialIds.length === 0) {
        return NextResponse.json({ success: true, data: [], total: 0 })
      }
    }

    let query = supabase.from('material_transactions').select(
      `
        id,
        transaction_type,
        quantity,
        transaction_date,
        created_at,
        materials:materials!inner(id, name, code, unit)
      `
    )
    query = query.eq('site_id', siteId)
    if (materialIds && materialIds.length > 0) {
      query = query.in('material_id', materialIds)
    }
    query = query
      .order('transaction_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    // Total count (without text search q; q is applied client-side)
    let countQuery = supabase
      .from('material_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('site_id', siteId)
    if (materialIds && materialIds.length > 0) {
      countQuery = countQuery.in('material_id', materialIds)
    }
    const { count: totalCount } = await countQuery

    // Pagination (overfetch by 1)
    query = query.range(offset, offset + limit - 1)
    const { data, error } = await query
    if (error) {
      if (process.env.NODE_ENV === 'development') console.error('Transactions query error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch transactions' },
        { status: 500 }
      )
    }

    let rows = Array.isArray(data) ? data : []

    return NextResponse.json({ success: true, data: rows, total: totalCount ?? 0 })
  } catch (e) {
    if (process.env.NODE_ENV === 'development') console.error('Transactions API error:', e)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
