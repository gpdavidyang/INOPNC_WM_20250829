export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

type MonthSeedBody = {
  year?: number
  months?: number[] // 1-12
  countPerMonth?: number
}

function monthRangeUTC(year: number, month1to12: number) {
  const m = month1to12 - 1
  const start = new Date(Date.UTC(year, m, 1))
  const end = new Date(Date.UTC(year, m + 1, 1))
  return { startISO: start.toISOString(), endISO: end.toISOString(), start, end }
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()
    const body = (await request.json().catch(() => ({}))) as MonthSeedBody
    const now = new Date()
    const year = Number.isFinite(body.year) ? (body.year as number) : now.getUTCFullYear()
    const months = Array.isArray(body.months) && body.months.length > 0 ? body.months! : [8, 9, 10]
    const countPerMonth = Math.max(1, Math.min(50, Number(body.countPerMonth) || 12))

    // Ensure required materials exist: NPC-1000, NPC-9000
    const wantedMaterials = [
      { code: 'NPC-1000', name: 'NPC-1000', unit: '말' },
      { code: 'NPC-9000', name: 'NPC-9000', unit: '말' },
    ]
    const { error: upsertMatErr } = await supabase
      .from('materials')
      .upsert(
        wantedMaterials.map(m => ({
          code: m.code,
          name: m.name,
          unit: m.unit,
          is_active: true,
        })) as any,
        { onConflict: 'code' }
      )
    if (upsertMatErr)
      return NextResponse.json({ success: false, error: upsertMatErr.message }, { status: 500 })
    const { data: matRows } = await supabase
      .from('materials')
      .select('id, code')
      .in(
        'code',
        wantedMaterials.map(m => m.code)
      )
    const codeToId = Object.fromEntries((matRows || []).map((m: any) => [m.code, m.id]))
    const materialIds = Object.values(codeToId) as string[]
    if (materialIds.length < 2) {
      return NextResponse.json(
        { success: false, error: '필수 자재(NPC-1000, NPC-9000) 확보 실패' },
        { status: 500 }
      )
    }

    // Sites
    const { data: siteRows, error: siteErr } = await supabase
      .from('sites')
      .select('id, name, is_deleted')
      .eq('is_deleted', false)
      .limit(50)
    if (siteErr)
      return NextResponse.json({ success: false, error: siteErr.message }, { status: 500 })
    if (!siteRows || siteRows.length === 0) {
      return NextResponse.json(
        { success: false, error: '현장 데이터가 없습니다. 먼저 사이트를 생성하세요.' },
        { status: 400 }
      )
    }

    // Partner companies (ensure at least 3)
    let { data: partners } = await supabase
      .from('partner_companies')
      .select('id, company_name')
      .limit(50)
    if (!partners || partners.length < 3) {
      const bootstrap = [
        { company_name: '가나건설', company_type: 'construction', status: 'active' },
        { company_name: '다라건설', company_type: 'construction', status: 'active' },
        { company_name: '마바사건설', company_type: 'construction', status: 'active' },
      ]
      await supabase.from('partner_companies').insert(bootstrap as any)
      const { data: partnersReloaded } = await supabase
        .from('partner_companies')
        .select('id, company_name')
        .limit(50)
      partners = partnersReloaded || []
    }

    // Profiles: prefer those with partner_company_id, else assign some
    let { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, role, partner_company_id')
      .in('role', ['worker', 'site_manager', 'production_manager'])
      .limit(100)
    profiles = profiles || []
    const profilesWithPartner = (profiles as any[]).filter(p => p.partner_company_id)
    if (profilesWithPartner.length < 3 && profiles.length > 0 && partners.length > 0) {
      // Assign partner_company_id to a few profiles to diversify partner mapping
      const updates: any[] = []
      for (let i = 0; i < Math.min(3, profiles.length); i++) {
        const p = profiles[i]
        if (!p.partner_company_id) {
          updates.push({ id: p.id, partner_company_id: partners[i % partners.length]?.id })
        }
      }
      if (updates.length > 0)
        await supabase
          .from('profiles')
          .update(updates as any)
          .in(
            'id',
            updates.map(u => u.id)
          )
      const { data: profReload } = await supabase
        .from('profiles')
        .select('id, full_name, role, partner_company_id')
        .in(
          'id',
          profiles.map(p => p.id)
        )
      profiles = profReload || profiles
    }
    const requesters = (profiles as any[]).filter(p =>
      ['worker', 'site_manager', 'production_manager'].includes(p.role)
    )
    if (requesters.length === 0) {
      return NextResponse.json(
        { success: false, error: '요청자 프로필이 없습니다. 프로필을 먼저 생성하세요.' },
        { status: 400 }
      )
    }

    const created: Array<{ id: string; request_number: string; month: number }> = []

    for (const month of months) {
      const { startISO, endISO, start, end } = monthRangeUTC(year, month)
      for (let i = 0; i < countPerMonth; i++) {
        const site = pick(siteRows as any[])
        const requester = pick(requesters as any[])
        // random day in month
        const days = Math.max(
          1,
          Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
        )
        const dayOffset = randInt(0, Math.max(0, days - 1))
        const reqDate = new Date(start.getTime() + dayOffset * 24 * 60 * 60 * 1000)
        const needBy = new Date(reqDate.getTime() + randInt(1, 12) * 24 * 60 * 60 * 1000)
        const seq = String(Date.now() + i).slice(-4)
        const request_number = `MR-${year}${String(month).padStart(2, '0')}-${seq}`
        const priorities = ['low', 'normal', 'high', 'urgent']

        const { data: req, error: reqErr } = await supabase
          .from('material_requests')
          .insert({
            request_number,
            site_id: site.id,
            requested_by: requester.id,
            // created_at used to place record within target month if request_date column is unavailable
            created_at: reqDate.toISOString(),
            needed_by: needBy.toISOString().split('T')[0],
            priority: pick(priorities),
            notes: `Seeded for ${year}-${String(month).padStart(2, '0')}`,
          } as any)
          .select('id, request_number')
          .single()
        if (reqErr) {
          return NextResponse.json(
            { success: false, error: `요청 생성 실패: ${reqErr.message}` },
            { status: 500 }
          )
        }

        // Items: ensure mix of NPC-1000 and NPC-9000
        const itemCount = randInt(1, 3)
        const chosen = [...materialIds].sort(() => Math.random() - 0.5).slice(0, itemCount)
        const payload = chosen.map(id => ({
          request_id: (req as any).id,
          material_id: id,
          requested_quantity: randInt(5, 60),
        }))
        const { error: itemsErr } = await supabase
          .from('material_request_items')
          .insert(payload as any)
        if (itemsErr) {
          return NextResponse.json(
            { success: false, error: `아이템 생성 실패: ${itemsErr.message}` },
            { status: 500 }
          )
        }
        created.push({ id: (req as any).id, request_number: (req as any).request_number, month })
      }
    }

    return NextResponse.json({
      success: true,
      total: created.length,
      months,
      year,
      sample: created.slice(0, 5),
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}

export async function GET() {
  const now = new Date()
  return NextResponse.json({
    message: 'POST to seed material requests across specific months',
    example: {
      year: now.getUTCFullYear(),
      months: [8, 9, 10],
      countPerMonth: 12,
    },
  })
}
