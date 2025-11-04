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

    const [invRes, shipRes, pendingCountRes] = await Promise.all([
      svc
        .from('material_inventory')
        .select(
          `
          id,
          site_id,
          material_id,
          material_name,
          material_code,
          specification,
          unit,
          current_stock,
          minimum_stock,
          maximum_stock,
          updated_at,
          created_at
        `
        )
        .eq('site_id', siteId)
        .order('material_name', { ascending: true, nullsFirst: false })
        .limit(200),
      svc
        .from('material_shipments')
        .select(
          `
          id,
          shipment_number,
          status,
          shipment_date,
          site_id,
          created_at,
          shipment_items(
            id,
            quantity,
            materials(id, name, code, unit)
          )
        `
        )
        .eq('site_id', siteId)
        .order('shipment_date', { ascending: false, nullsFirst: false })
        .limit(10),
      svc
        .from('material_requests')
        .select('id', { count: 'exact', head: true })
        .eq('site_id', siteId)
        .eq('status', 'pending'),
    ])

    if (invRes.error) throw invRes.error
    if (shipRes.error) throw shipRes.error
    if (pendingCountRes.error) throw pendingCountRes.error

    const inventory = (invRes.data || []).map((row: any) => {
      const quantity = Number(row.current_stock ?? 0)
      const minimum =
        row.minimum_stock === null || row.minimum_stock === undefined
          ? null
          : Number(row.minimum_stock)
      const status =
        quantity <= 0 ? 'out' : minimum !== null && quantity <= minimum ? 'low' : 'normal'

      return {
        id: row.id,
        material_id: row.material_id || null,
        quantity,
        minimum_stock: minimum,
        maximum_stock:
          row.maximum_stock === null || row.maximum_stock === undefined
            ? null
            : Number(row.maximum_stock),
        last_updated: row.updated_at || row.created_at || null,
        status,
        materials: {
          name: row.material_name || '',
          code: row.material_code || '',
          specification: row.specification || '',
          unit: row.unit || '',
        },
      }
    })

    const shipments = (shipRes.data || []).map((s: any) => ({
      id: s.id,
      shipment_number: s.shipment_number || s.id,
      status: s.status || '-',
      shipment_date: s.shipment_date || s.created_at || null,
      shipment_items: Array.isArray(s?.shipment_items)
        ? s.shipment_items.map((item: any) => ({
            id: item.id,
            quantity: Number(item.quantity ?? 0),
            materials: {
              name: item.materials?.name || '',
              code: item.materials?.code || '',
              unit: item.materials?.unit || '',
            },
          }))
        : [],
    }))

    const stats = {
      inventory_total: inventory.length,
      low_stock: inventory.filter(item => item.status === 'low').length,
      out_of_stock: inventory.filter(item => item.status === 'out').length,
      pending_requests: pendingCountRes.count || 0,
      open_shipments: shipments.filter(s => {
        const status = String(s.status || '').toLowerCase()
        return status && !['delivered', 'cancelled', 'completed'].includes(status)
      }).length,
    }

    return NextResponse.json({ success: true, data: { inventory, shipments, stats } })
  } catch (e) {
    console.error('[admin/sites/:id/materials/summary] error:', e)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
