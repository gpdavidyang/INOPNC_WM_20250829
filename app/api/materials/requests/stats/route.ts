export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

function parseMonthRange(ym?: string) {
  const now = new Date()
  let y = now.getUTCFullYear()
  let m = now.getUTCMonth() + 1
  if (ym && /^\d{4}-\d{2}$/.test(ym)) {
    const [yy, mm] = ym.split('-').map(n => Number(n))
    y = yy
    m = mm
  }
  const start = new Date(Date.UTC(y, m - 1, 1))
  const end = new Date(Date.UTC(y, m, 1))
  return { startISO: start.toISOString(), endISO: end.toISOString(), y, m }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') || undefined
    const { startISO, endISO, y, m } = parseMonthRange(month || undefined)
    const supabase = createServiceRoleClient()

    const { data: reqs, error: reqErr } = await supabase
      .from('material_requests')
      .select('id, site_id, created_at')
      .gte('created_at', startISO)
      .lt('created_at', endISO)

    if (reqErr) return NextResponse.json({ success: false, error: reqErr.message }, { status: 500 })

    const count = (reqs || []).length
    const siteCount = new Set((reqs || []).map((r: any) => r.site_id).filter(Boolean)).size

    let qty = 0
    if (reqs && reqs.length > 0) {
      const ids = reqs.map((r: any) => r.id)
      const { data: items, error: itemErr } = await supabase
        .from('material_request_items')
        .select('request_id, requested_quantity')
        .in('request_id', ids)
      if (itemErr)
        return NextResponse.json({ success: false, error: itemErr.message }, { status: 500 })
      qty = (items || []).reduce(
        (a: number, it: any) => a + (Number(it.requested_quantity) || 0),
        0
      )
    }

    return NextResponse.json({ success: true, year: y, month: m, count, siteCount, totalQty: qty })
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}
