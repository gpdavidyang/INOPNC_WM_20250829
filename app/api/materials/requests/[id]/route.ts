export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id
  const supabase = createServiceRoleClient()
  try {
    // 1) Request row
    const { data: req, error: reqErr } = await supabase
      .from('material_requests')
      .select('id, request_number, created_at, site_id, notes')
      .eq('id', id)
      .maybeSingle()
    if (reqErr) throw reqErr
    if (!req) return NextResponse.json({ success: false, error: 'not found' }, { status: 404 })

    // 2) Site name
    let site_name = '-'
    if (req.site_id) {
      const { data: site } = await supabase
        .from('sites')
        .select('name')
        .eq('id', req.site_id as string)
        .maybeSingle()
      site_name = (site?.name as string) || '-'
    }

    // 3) Items
    const { data: itemsRows } = await supabase
      .from('material_request_items')
      .select('material_id, requested_quantity, notes')
      .eq('request_id', req.id as string)

    // 4) Material names
    const matIds = Array.from(
      new Set((itemsRows || []).map(r => r.material_id).filter(Boolean) as string[])
    )
    let matMap: Record<string, { name: string; code?: string | null; unit?: string | null }> = {}
    if (matIds.length > 0) {
      const { data: mats } = await supabase
        .from('materials')
        .select('id, name, code, unit')
        .in('id', matIds)
      matMap = Object.fromEntries(
        (mats || []).map((m: any) => [
          m.id as string,
          { name: m.name || '-', code: m.code || null, unit: m.unit || null },
        ])
      )
    }

    const items = (itemsRows || []).map(it => ({
      material_id: it.material_id as string,
      requested_quantity: Number(it.requested_quantity) || 0,
      material_name: matMap[it.material_id as string]?.name || '-',
      material_code: matMap[it.material_id as string]?.code || null,
      unit: matMap[it.material_id as string]?.unit || null,
      notes: it.notes as string | null,
    }))

    return NextResponse.json({
      success: true,
      data: {
        id: req.id,
        request_number: req.request_number,
        created_at: req.created_at,
        site_id: req.site_id,
        site_name,
        notes: req.notes,
        items,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'internal error' },
      { status: 500 }
    )
  }
}
