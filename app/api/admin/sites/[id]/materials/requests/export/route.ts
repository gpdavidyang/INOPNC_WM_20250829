import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireApiAuth()
  if (auth instanceof NextResponse) return auth
  if (!auth.role || !['admin', 'system_admin', 'site_manager'].includes(auth.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const siteId = params.id
  const sp = new URL(request.url).searchParams
  const q = (sp.get('q') || '').trim()
  const status = sp.get('status') || undefined
  const sortParam = (sp.get('sort') as 'date' | 'status' | 'number') || 'date'
  const orderParam = (sp.get('order') as 'asc' | 'desc') || 'desc'

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

  if (status && status !== 'all') query = query.eq('status', status)
  if (q) query = query.ilike('request_number', `%${q}%`)

  if (sortParam === 'status') {
    query = query.order('status', { ascending: orderParam === 'asc' })
  } else if (sortParam === 'number') {
    query = query.order('request_number', { ascending: orderParam === 'asc' })
  } else {
    query = query
      .order('request_date', { ascending: orderParam === 'asc', nullsFirst: false })
      .order('created_at', { ascending: orderParam === 'asc' })
  }

  const { data, error } = await query.limit(5000)
  if (error) {
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 })
  }

  const preset = (sp.get('preset') || 'basic') as 'basic' | 'full'
  let cols = (sp.get('cols') || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
  if (cols.length === 0) {
    cols =
      preset === 'full'
        ? ['request_number', 'requester', 'status', 'request_date', 'id']
        : ['request_number', 'requester', 'status', 'request_date']
  }

  const rows = (data || []).map((r: any) => ({
    request_number: r.request_number || r.id,
    requester: r.requester?.full_name || r.requested_by || '',
    status: r.status || '',
    request_date: r.request_date || '',
    id: r.id,
  }))
  const sheetData = rows.map(row => {
    const o: Record<string, any> = {}
    cols.forEach(c => {
      o[c] = (row as any)[c]
    })
    return o
  })
  const ws = XLSX.utils.json_to_sheet(sheetData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '입고요청')
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="site_${siteId}_material_requests.xlsx"`,
      'Cache-Control': 'no-store',
    },
  })
}
