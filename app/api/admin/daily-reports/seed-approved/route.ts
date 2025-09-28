import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const dynamic = 'force-dynamic'

type SeedOptions = {
  siteIds?: string[]
  perSiteMin?: number
  perSiteMax?: number
  daysBack?: number
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pickRandom<T>(arr: T[], count: number): T[] {
  const copy = [...arr]
  const out: T[] = []
  while (copy.length && out.length < count) {
    const idx = randInt(0, copy.length - 1)
    out.push(copy.splice(idx, 1)[0])
  }
  return out
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    // Admin-only
    if (auth.role !== 'admin' && auth.role !== 'system_admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const service = createServiceRoleClient()

    const body = (await request.json().catch(() => ({}))) as Partial<SeedOptions>
    const siteIdsFilter = Array.isArray(body.siteIds) && body.siteIds.length ? body.siteIds : null
    const perSiteMin = Math.max(1, Number(body.perSiteMin ?? 2))
    const perSiteMax = Math.max(perSiteMin, Number(body.perSiteMax ?? 5))
    const daysBack = Math.max(7, Number(body.daysBack ?? 45))

    // 1) 사이트 목록 수집
    let sitesQuery = service
      .from('sites')
      .select('id, name')
      .order('created_at', { ascending: false })
    if (siteIdsFilter) sitesQuery = sitesQuery.in('id', siteIdsFilter)
    const { data: sites, error: sitesError } = await sitesQuery
    if (sitesError) {
      console.error('[seed-approved] sites query error:', sitesError)
      return NextResponse.json({ error: 'Failed to fetch sites' }, { status: 500 })
    }
    if (!sites || sites.length === 0) {
      return NextResponse.json({ success: true, message: 'No sites found', inserted: 0 })
    }

    const memberTypePool = ['슬라브', '거더', '벽체', '기둥', '기초']
    const processPool = ['균열 보수', '면 보수', '마감 보수', '콘크리트 보수']
    const workTypePool = ['지하', '지상', '옥상', '외부']

    let totalInserted = 0
    const perSiteResults: Record<string, number> = {}

    for (const site of sites) {
      const perSiteCount = randInt(perSiteMin, perSiteMax)
      let insertedForSite = 0

      // 최근 daysBack일 내에서 중복되지 않는 날짜로 생성 시도
      const usedDates = new Set<string>()
      let attempts = 0
      while (insertedForSite < perSiteCount && attempts < perSiteCount * 10) {
        attempts += 1
        const daysAgo = randInt(0, daysBack)
        const d = new Date()
        d.setDate(d.getDate() - daysAgo)
        const workDate = d.toISOString().split('T')[0]
        if (usedDates.has(workDate)) continue

        // 이미 존재하는지 확인
        const { data: existing } = await service
          .from('daily_reports')
          .select('id')
          .eq('site_id', site.id)
          .eq('work_date', workDate)
          .maybeSingle()
        if (existing) continue

        const memberTypes = pickRandom(memberTypePool, randInt(1, 2))
        const processes = pickRandom(processPool, randInt(1, 2))
        const workTypes = pickRandom(workTypePool, randInt(1, 2))
        const mainManpower = randInt(1, 6) // 1~6 인일
        const totalWorkers = mainManpower

        const additionalNotes = {
          memberTypes,
          workContents: processes,
          workTypes,
          mainManpower,
          additionalManpower: [],
          notes: `${processes[0]} 작업 진행`,
          safetyNotes: '',
        }

        const location = {
          block: `${String.fromCharCode(65 + randInt(0, 2))}블록`,
          dong: `${randInt(1, 5)}동`,
          unit: `${randInt(1, 10)}층`,
        }

        const payload = {
          site_id: site.id,
          work_date: workDate,
          total_workers: totalWorkers,
          work_description: `${site.name || '현장'} - ${processes.join(', ')}`,
          status: 'approved',
          approved_at: new Date().toISOString(),
          additional_notes: additionalNotes,
          location_info: location,
          created_by: auth.userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        const { error: insertError } = await service.from('daily_reports').insert(payload)
        if (insertError) {
          console.error('[seed-approved] insert error:', insertError)
          continue
        }

        usedDates.add(workDate)
        insertedForSite += 1
        totalInserted += 1
      }

      perSiteResults[site.id] = insertedForSite
    }

    return NextResponse.json({ success: true, inserted: totalInserted, perSite: perSiteResults })
  } catch (error) {
    console.error('[seed-approved] unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
