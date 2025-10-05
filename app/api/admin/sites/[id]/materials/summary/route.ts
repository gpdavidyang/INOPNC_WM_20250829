import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth
    if (!auth.role || !['admin', 'system_admin', 'site_manager'].includes(auth.role)) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    const siteId = params.id
    if (!siteId) {
      return NextResponse.json({ success: false, error: 'Site ID is required' }, { status: 400 })
    }

    const supabase = createClient()

    // Inventory snapshot with material info
    const { data: inventory, error: invError } = await supabase
      .from('material_inventory')
      .select(
        `
        id,
        quantity,
        last_updated,
        materials:materials!inner(id, name, code, unit)
      `
      )
      .eq('site_id', siteId)
      .order('last_updated', { ascending: false })
      .limit(20)

    if (invError) {
      if (process.env.NODE_ENV === 'development') console.error('Inventory query error:', invError)
    }

    // Recent shipments
    const { data: shipments, error: shipError } = await supabase
      .from('material_shipments')
      .select('id, shipment_number, status, shipment_date, created_at')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (shipError) {
      if (process.env.NODE_ENV === 'development') console.error('Shipments query error:', shipError)
    }

    return NextResponse.json({
      success: true,
      data: {
        inventory: Array.isArray(inventory) ? inventory : [],
        shipments: Array.isArray(shipments) ? shipments : [],
      },
    })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') console.error('Materials summary error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
