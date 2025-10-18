export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

type Body = {
  count?: number // default 3
}

function todayISO(d = new Date()) {
  return d.toISOString().slice(0, 10)
}

function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export async function POST(request: NextRequest) {
  try {
    const userClient = createClient()
    const {
      data: { session },
    } = await userClient.auth.getSession()
    if (!session?.user)
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const body = (await request.json().catch(() => ({}))) as Body
    const count = Math.max(1, Math.min(20, Number(body.count) || 3))

    const service = createServiceRoleClient()

    // Ensure materials (no onConflict dependence)
    const ensureMaterial = async (name: string, code: string) => {
      const { data } = await service
        .from('materials')
        .select('id')
        .or(`name.eq.${name},code.eq.${code}`)
        .maybeSingle()
      if (data?.id) return data.id as string
      const { data: ins } = await service
        .from('materials')
        .insert({ name, code, unit: 'ea', is_active: true } as any)
        .select('id')
        .single()
      return ins?.id as string
    }

    const mat1 = await ensureMaterial('NPC-1000', 'NPC-1000')
    const mat2 = await ensureMaterial('NPC-9000', 'NPC-9000')
    const matIds = [mat1, mat2].filter(Boolean) as string[]
    if (matIds.length === 0)
      return NextResponse.json({ success: false, error: 'No materials' }, { status: 500 })

    // Keep seed independent of optional columns like *method_id/total_amount

    // Site resolution
    let siteIds: string[] = []
    const { data: assigns } = await service
      .from('site_assignments')
      .select('site_id')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .limit(10)
    siteIds = Array.from(new Set((assigns || []).map((a: any) => a.site_id).filter(Boolean)))

    if (siteIds.length === 0) {
      const { data: prof } = await service
        .from('profiles')
        .select('site_id')
        .eq('id', session.user.id)
        .maybeSingle()
      if (prof?.site_id) siteIds = [prof.site_id]
    }

    if (siteIds.length === 0) {
      // Create a default site for the user if none exists
      const { data: site } = await service
        .from('sites')
        .insert({ name: '테스트 현장', is_deleted: false } as any)
        .select('id')
        .single()
      if (site?.id) {
        siteIds = [site.id as string]
        await service
          .from('site_assignments')
          .upsert(
            {
              site_id: site.id,
              user_id: session.user.id,
              role: 'site_manager',
              is_active: true,
            } as any,
            { onConflict: 'site_id,user_id' }
          )
      }
    }
    if (siteIds.length === 0)
      return NextResponse.json(
        { success: false, error: 'No sites available to seed for user' },
        { status: 400 }
      )

    // No dependency on payment_methods columns

    const pad2 = (n: number) => String(n).padStart(2, '0')
    const yyyymmdd = (d: Date) => `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`
    const created: string[] = []
    for (let i = 0; i < count; i++) {
      const site_id = siteIds[i % siteIds.length]
      const material_id = matIds[i % matIds.length]
      const quantity = rnd(10, 120)
      const shipment_number = `MS-${yyyymmdd(new Date())}-${String(Date.now()).slice(-5)}-${i + 1}`

      const { data: shipment, error: shipErr } = await service
        .from('material_shipments')
        .insert({
          site_id,
          status: i % 2 === 0 ? 'delivered' : 'preparing',
          shipment_date: todayISO(),
          shipment_number,
          // Keep only widely-supported columns; omit created_by/created_at/updated_at in case schema lacks them
        } as any)
        .select('id')
        .single()
      if (shipErr)
        return NextResponse.json({ success: false, error: shipErr.message }, { status: 500 })

      const { error: itemErr } = await service.from('shipment_items').insert({
        shipment_id: (shipment as any).id,
        material_id,
        quantity,
      } as any)
      if (itemErr)
        return NextResponse.json({ success: false, error: itemErr.message }, { status: 500 })

      created.push((shipment as any).id)
    }

    return NextResponse.json({ success: true, created: created.length, ids: created })
  } catch (e: any) {
    console.error('[seed-shipments/for-user] error:', e?.message || e)
    return NextResponse.json({ success: false, error: String(e?.message || e) }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ message: 'POST to seed shipments visible to the current user' })
}
