import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'

export async function POST() {
  // Require authenticated request (avoid exposing seed openly)
  const auth = await requireApiAuth()
  if (auth instanceof NextResponse) return auth

  const supabase = createServiceRoleClient()

  // Helpers
  async function ensureMaterial(name: string, code: string, unit = 'ea') {
    const { data } = await supabase
      .from('materials')
      .select('id')
      .or(`name.eq.${name},code.eq.${code}`)
      .maybeSingle()
    if (data?.id) return data.id as string
    const { data: inserted } = await supabase
      .from('materials')
      .insert({ name, code, unit, is_active: true } as any)
      .select('id')
      .single()
    return inserted?.id as string
  }

  async function ensureSite(name: string) {
    const { data } = await supabase.from('sites').select('id').eq('name', name).maybeSingle()
    if (data?.id) return data.id as string
    const { data: inserted } = await supabase
      .from('sites')
      .insert({ name, is_deleted: false } as any)
      .select('id')
      .single()
    return inserted?.id as string
  }

  async function ensurePaymentMethod(
    name: string,
    category: 'billing' | 'shipping' | 'freight',
    sort = 0
  ) {
    const { data } = await supabase
      .from('payment_methods')
      .select('id')
      .eq('name', name)
      .eq('category', category)
      .maybeSingle()
    if (data?.id) return data.id as string
    const { data: inserted } = await supabase
      .from('payment_methods')
      .insert({ name, category, is_active: true, sort_order: sort } as any)
      .select('id')
      .single()
    return inserted?.id as string
  }

  function ymd(d: Date) {
    return d.toISOString().slice(0, 10)
  }

  // Ensure masters
  const [mat1, mat2] = await Promise.all([
    ensureMaterial('NPC-1000', 'NPC-1000', 'ea'),
    ensureMaterial('NPC-9000', 'NPC-9000', 'ea'),
  ])
  const [site1, site2] = await Promise.all([
    ensureSite('은평 한옥마을'),
    ensureSite('성수 오피스 리모델링'),
  ])
  const [billingNow, billingMonthly, shipCourier, shipFreight, shipDirect, payPre, payCollect] =
    await Promise.all([
      ensurePaymentMethod('즉시청구', 'billing', 1),
      ensurePaymentMethod('월말청구', 'billing', 2),
      ensurePaymentMethod('택배', 'shipping', 1),
      ensurePaymentMethod('화물', 'shipping', 2),
      ensurePaymentMethod('직접', 'shipping', 3),
      ensurePaymentMethod('선불', 'freight', 1),
      ensurePaymentMethod('착불', 'freight', 2),
    ])

  // Prepare three shipments (this month)
  const now = new Date()
  const d1 = new Date(now.getFullYear(), now.getMonth(), 3)
  const d2 = new Date(now.getFullYear(), now.getMonth(), 8)
  const d3 = new Date(now.getFullYear(), now.getMonth(), 15)

  type SeedShipment = {
    site_id: string
    status: 'preparing' | 'delivered'
    date: Date
    items: Array<{ material_id: string; quantity: number }>
    methods: {
      billing: string
      shipping: string
      freight: string
    }
  }

  const seeds: SeedShipment[] = [
    {
      site_id: site1,
      status: 'delivered',
      date: d1,
      items: [
        { material_id: mat1, quantity: 120 },
        { material_id: mat2, quantity: 40 },
      ],
      methods: { billing: billingNow, shipping: shipCourier, freight: payPre },
    },
    {
      site_id: site2,
      status: 'preparing',
      date: d2,
      items: [{ material_id: mat1, quantity: 60 }],
      methods: { billing: billingMonthly, shipping: shipFreight, freight: payCollect },
    },
    {
      site_id: site1,
      status: 'delivered',
      date: d3,
      items: [{ material_id: mat2, quantity: 30 }],
      methods: { billing: billingNow, shipping: shipDirect, freight: payPre },
    },
  ]

  const created: any[] = []

  for (const seed of seeds) {
    const totalQty = seed.items.reduce((a, b) => a + b.quantity, 0)
    const totalAmount = totalQty * 10000 // sample unit price 10,000 KRW
    const { data: shipment, error: shipErr } = await supabase
      .from('material_shipments')
      .insert({
        site_id: seed.site_id,
        status: seed.status,
        shipment_date: ymd(seed.date),
        carrier: null,
        tracking_number: null,
        billing_method_id: seed.methods.billing,
        shipping_method_id: seed.methods.shipping,
        freight_charge_method_id: seed.methods.freight,
        total_amount: totalAmount,
        created_by: (auth as any).userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any)
      .select('id')
      .single()

    if (shipErr) {
      console.error('[seed-shipping] insert shipment error:', shipErr.message)
    }

    if (shipment?.id) {
      await supabase.from('shipment_items').insert(
        seed.items.map(it => ({
          shipment_id: shipment.id,
          material_id: it.material_id,
          quantity: it.quantity,
          unit_price: null,
          total_price: null,
        })) as any
      )
      created.push(shipment.id)
    }
  }

  return NextResponse.json({ success: true, created: created.length, ids: created })
}

export async function GET() {
  // convenience: allow GET for quick local testing
  return POST()
}
