export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

type SeedBody = {
  count?: number
  minItemsPerRequest?: number
  maxItemsPerRequest?: number
  siteIds?: string[]
  materialIds?: string[]
}

function getMonthRangeUTC(d = new Date()) {
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
  const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1))
  return { startISO: start.toISOString(), endISO: end.toISOString() }
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pickOne<T>(arr: T[]): T | null {
  if (!arr || arr.length === 0) return null
  return arr[Math.floor(Math.random() * arr.length)]
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as SeedBody
  const count = Math.max(1, Math.min(50, Number(body.count) || 12))
  const minItems = Math.max(1, Math.min(5, Number(body.minItemsPerRequest) || 1))
  const maxItems = Math.max(minItems, Math.min(8, Number(body.maxItemsPerRequest) || 3))

  const supabase = createServiceRoleClient()
  const { startISO, endISO } = getMonthRangeUTC()

  // Load sites
  const { data: siteRows, error: siteErr } = await supabase
    .from('sites')
    .select('id, name, is_deleted, status')
    .neq('is_deleted', true)
    .limit(50)
  if (siteErr) return NextResponse.json({ success: false, error: siteErr.message }, { status: 500 })
  const sites = (siteRows || []).filter(s =>
    body.siteIds ? body.siteIds.includes(String((s as any).id)) : true
  )
  if (sites.length === 0) {
    return NextResponse.json(
      { success: false, error: 'Seed 실패: 사용 가능한 현장이 없습니다.' },
      { status: 400 }
    )
  }

  // Load materials
  const { data: materialRows, error: matErr } = await supabase
    .from('materials')
    .select('id, name, code, unit, is_active')
    .eq('is_active', true)
    .limit(50)
  if (matErr) return NextResponse.json({ success: false, error: matErr.message }, { status: 500 })
  const materials = (materialRows || []).filter(m =>
    body.materialIds ? body.materialIds.includes(String((m as any).id)) : true
  )
  if (materials.length === 0) {
    return NextResponse.json(
      { success: false, error: 'Seed 실패: 사용 가능한 자재가 없습니다.' },
      { status: 400 }
    )
  }

  // Load requesters
  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .in('role', ['worker', 'site_manager', 'production_manager'])
    .limit(50)
  if (profErr) return NextResponse.json({ success: false, error: profErr.message }, { status: 500 })
  if (!profiles || profiles.length === 0) {
    return NextResponse.json(
      { success: false, error: 'Seed 실패: 요청자를 찾을 수 없습니다. 프로필을 먼저 생성하세요.' },
      { status: 400 }
    )
  }

  // Generate requests
  const created: Array<{ id: string; request_number: string }> = []
  for (let i = 0; i < count; i++) {
    const site = pickOne(sites) as any
    const requester = pickOne(profiles) as any
    if (!site || !requester) continue

    // Random date in this month
    const start = new Date(startISO)
    const end = new Date(endISO)
    const day = randomInt(
      0,
      Math.max(0, Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) - 1)
    )
    const requestDate = new Date(start.getTime() + day * 24 * 60 * 60 * 1000)

    const seq = String(Date.now() + i).slice(-4)
    const y = requestDate.getUTCFullYear()
    const m = String(requestDate.getUTCMonth() + 1).padStart(2, '0')
    const request_number = `MR-${y}${m}-${seq}`

    const statuses = ['pending', 'approved', 'delivered'] as const
    const status = pickOne(statuses as unknown as string[]) || 'pending'
    const neededBy = new Date(requestDate.getTime() + randomInt(1, 10) * 24 * 60 * 60 * 1000)
    const priorities = ['low', 'normal', 'high', 'urgent'] as const
    const priority = pickOne(priorities as unknown as string[]) || 'normal'

    const { data: req, error: reqErr } = await supabase
      .from('material_requests')
      .insert({
        request_number,
        site_id: site.id,
        requested_by: requester.id,
        status,
        request_date: requestDate.toISOString(),
        needed_by: neededBy.toISOString().split('T')[0],
        priority,
        notes: 'Demo seeded by /api/materials/seed-requests',
      } as unknown)
      .select('id, request_number')
      .single()

    if (reqErr) {
      return NextResponse.json(
        { success: false, error: `요청 생성 실패: ${reqErr.message}` },
        { status: 500 }
      )
    }

    // Create items
    const itemCount = randomInt(minItems, maxItems)
    const chosenMaterials = [...materials]
      .sort(() => Math.random() - 0.5)
      .slice(0, itemCount) as any[]
    const itemsPayload = chosenMaterials.map((mat: any) => ({
      request_id: (req as any).id,
      material_id: mat.id,
      requested_quantity: randomInt(5, 50),
      notes: null,
    }))

    const { error: itemsErr } = await supabase
      .from('material_request_items')
      .insert(itemsPayload as unknown)
    if (itemsErr) {
      return NextResponse.json(
        { success: false, error: `아이템 생성 실패: ${itemsErr.message}` },
        { status: 500 }
      )
    }

    created.push({ id: (req as any).id, request_number: (req as any).request_number })
  }

  return NextResponse.json({ success: true, count: created.length, requests: created })
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint to seed demo material requests for the current month.',
    body: { count: 12, minItemsPerRequest: 1, maxItemsPerRequest: 3 },
  })
}
