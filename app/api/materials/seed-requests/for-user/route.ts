export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

type Body = {
  year?: number
  months?: number[] // 1-12
  countPerMonth?: number
}

function monthRangeUTC(year: number, month1to12: number) {
  const m = month1to12 - 1
  const start = new Date(Date.UTC(year, m, 1))
  const end = new Date(Date.UTC(year, m + 1, 1))
  return { start, end, startISO: start.toISOString(), endISO: end.toISOString() }
}

function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export async function POST(request: NextRequest) {
  // Identify current user from cookies
  const userClient = createClient()
  const {
    data: { session },
  } = await userClient.auth.getSession()
  if (!session?.user)
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const body = (await request.json().catch(() => ({}))) as Body
  const now = new Date()
  const year = Number.isFinite(body.year) ? (body.year as number) : now.getUTCFullYear()
  const months =
    Array.isArray(body.months) && body.months.length > 0 ? body.months! : [now.getUTCMonth() + 1]
  const countPerMonth = Math.max(1, Math.min(30, Number(body.countPerMonth) || 8))

  // Service role for inserts
  const service = createServiceRoleClient()

  // Ensure NPC materials exist
  const wanted = [
    { code: 'NPC-1000', name: 'NPC-1000', unit: '말' },
    { code: 'NPC-9000', name: 'NPC-9000', unit: '말' },
  ]
  await service.from('materials').upsert(wanted as any, { onConflict: 'code' })
  const { data: mats } = await service
    .from('materials')
    .select('id, code')
    .in(
      'code',
      wanted.map(w => w.code)
    )
  const matIds = (mats || []).map((m: any) => m.id)
  if (matIds.length === 0)
    return NextResponse.json({ success: false, error: 'No materials' }, { status: 500 })

  // Find user site assignments; if none, try profile.site_id; else fallback to any site
  const { data: assigns } = await service
    .from('site_assignments')
    .select('site_id')
    .eq('user_id', session.user.id)
    .eq('is_active', true)
    .limit(10)
  let siteIds: string[] = Array.from(
    new Set((assigns || []).map((a: any) => a.site_id).filter(Boolean))
  )
  if (siteIds.length === 0) {
    const { data: prof } = await service
      .from('profiles')
      .select('site_id')
      .eq('id', session.user.id)
      .maybeSingle()
    if (prof?.site_id) siteIds = [prof.site_id]
  }
  if (siteIds.length === 0) {
    const { data: anySites } = await service
      .from('sites')
      .select('id')
      .eq('is_deleted', false)
      .limit(3)
    siteIds = (anySites || []).map((s: any) => s.id)
    // Optionally create assignments so RLS can see them
    for (const sid of siteIds) {
      await service
        .from('site_assignments')
        .upsert(
          { site_id: sid, user_id: session.user.id, role: 'site_manager', is_active: true } as any,
          {
            onConflict: 'site_id,user_id',
          }
        )
    }
  }
  if (siteIds.length === 0)
    return NextResponse.json(
      { success: false, error: 'No sites available to seed for user' },
      { status: 400 }
    )

  const created: Array<{ id: string; month: number; site_id: string }> = []

  for (const month of months) {
    const { start, end } = monthRangeUTC(year, month)
    for (const sid of siteIds) {
      for (let i = 0; i < countPerMonth; i++) {
        const days = Math.max(
          1,
          Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
        )
        const offset = rnd(0, Math.max(0, days - 1))
        const reqDate = new Date(start.getTime() + offset * 24 * 60 * 60 * 1000)
        const seq = String(Date.now() + i).slice(-4)
        const request_number = `MR-${year}${String(month).padStart(2, '0')}-${seq}`
        const { data: req, error: reqErr } = await service
          .from('material_requests')
          .insert({
            request_number,
            site_id: sid,
            requested_by: session.user.id,
            created_at: reqDate.toISOString(),
            needed_by: new Date(reqDate.getTime() + rnd(1, 10) * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0],
            notes: 'Seeded for current user visibility',
          } as any)
          .select('id')
          .single()
        if (reqErr)
          return NextResponse.json({ success: false, error: reqErr.message }, { status: 500 })
        const items = matIds
          .sort(() => Math.random() - 0.5)
          .slice(0, rnd(1, Math.min(2, matIds.length)))
          .map(id => ({
            request_id: (req as any).id,
            material_id: id,
            requested_quantity: rnd(5, 40),
          }))
        const { error: itemsErr } = await service
          .from('material_request_items')
          .insert(items as any)
        if (itemsErr)
          return NextResponse.json({ success: false, error: itemsErr.message }, { status: 500 })
        created.push({ id: (req as any).id, month, site_id: sid })
      }
    }
  }

  return NextResponse.json({ success: true, total: created.length, siteIds, months, year })
}

export async function GET() {
  return NextResponse.json({ message: 'POST to seed requests visible to the current user' })
}
