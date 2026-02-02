import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/admin/sites/:id/materials/summary
// Returns inventory snapshot and recent shipments for a site
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth
    if (!['admin', 'system_admin'].includes((auth.role || '').toLowerCase())) {
      return NextResponse.json({ success: false, error: '접근 권한이 없습니다.' }, { status: 403 })
    }

    const siteId = params.id
    if (!siteId) {
      return NextResponse.json({ success: false, error: 'Missing site id' }, { status: 400 })
    }

    let svc
    try {
      svc = createServiceRoleClient()
    } catch (error) {
      console.warn(
        '[admin/sites/:id/materials/summary] service role unavailable, falling back to session client'
      )
      svc = createClient()
    }

    const [invRes, shipRes, pendingCountRes] = await Promise.all([
      svc
        .from('material_inventory')
        .select(
          `
          id,
          site_id,
          material_id,
          current_stock,
          minimum_stock,
          updated_at,
          materials:materials(
            name,
            code,
            unit,
            specification
          )
        `
        )
        .eq('site_id', siteId)
        .order('updated_at', { ascending: false, nullsFirst: false })
        .limit(200),
      svc
        .from('material_shipments')
        .select(
          `
          id,
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

      const mat = (row as any).materials || {}
      return {
        id: row.id,
        material_id: row.material_id || null,
        quantity,
        minimum_stock: minimum,
        maximum_stock: null,
        last_updated: row.updated_at || null,
        status,
        materials: {
          name: mat.name || '',
          code: mat.code || '',
          specification: mat.specification || '',
          unit: mat.unit || '',
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
    return NextResponse.json(
      { success: false, error: '재고 정보를 불러오지 못했습니다.' },
      { status: 500 }
    )
  }
}
