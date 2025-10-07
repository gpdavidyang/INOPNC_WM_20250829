import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const dynamic = 'force-dynamic'

// GET /api/admin/sites/:id/materials/summary
// Returns inventory snapshot and recent shipments for a site
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const siteId = params.id
    if (!siteId) {
      return NextResponse.json({ success: false, error: 'Missing site id' }, { status: 400 })
    }

    const svc = createServiceRoleClient()

    const [invRes, shipRes] = await Promise.all([
      svc
        .from('material_inventory')
        .select(
          'id, site_id, material_name, material_code, unit, current_stock, updated_at, created_at'
        )
        .eq('site_id', siteId)
        .order('updated_at', { ascending: false, nullsFirst: false })
        .limit(50),
      svc
        .from('material_shipments')
        .select('id, shipment_number, status, shipment_date, site_id, created_at')
        .eq('site_id', siteId)
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    const inventory = (invRes.data || []).map((row: any) => ({
      id: row.id,
      quantity: row.current_stock ?? 0,
      last_updated: row.updated_at || row.created_at || null,
      materials: {
        name: row.material_name || '',
        code: row.material_code || '',
        unit: row.unit || '',
      },
    }))

    const shipments = (shipRes.data || []).map((s: any) => ({
      id: s.id,
      shipment_number: s.shipment_number || s.id,
      status: s.status || '-',
      shipment_date: s.shipment_date || s.created_at || null,
    }))

    return NextResponse.json({ success: true, data: { inventory, shipments } })
  } catch (e) {
    console.error('[admin/sites/:id/materials/summary] error:', e)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
