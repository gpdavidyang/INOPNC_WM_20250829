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
    const daysBack = Math.max(7, Number(body.daysBack ?? 30))

    // Sites
    let sitesQuery = service
      .from('sites')
      .select('id, name')
      .order('created_at', { ascending: false })
    if (siteIdsFilter) sitesQuery = sitesQuery.in('id', siteIdsFilter)
    const { data: sites, error: sitesError } = await sitesQuery
    if (sitesError) {
      console.error('[seed-drafts] sites query error:', sitesError)
      return NextResponse.json({ error: 'Failed to fetch sites' }, { status: 500 })
    }
    if (!sites?.length) {
      return NextResponse.json({ success: true, message: 'No sites found', inserted: 0 })
    }

    const memberTypePool = ['슬라브', '거더', '벽체', '기둥', '기초']
    const processPool = ['균열', '면', '마감', '콘크리트']
    const workTypePool = ['지하', '지상', '지붕', '외부']

    let totalInserted = 0
    const perSite: Record<string, number> = {}

    for (const site of sites) {
      const countTarget = randInt(perSiteMin, perSiteMax)
      let done = 0
      const usedDates = new Set<string>()
      let attempts = 0

      while (done < countTarget && attempts < countTarget * 10) {
        attempts++
        const d = new Date()
        d.setDate(d.getDate() - randInt(0, daysBack))
        const workDate = d.toISOString().split('T')[0]
        if (usedDates.has(workDate)) continue

        // Skip if already exists for that date
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
        const mainManpower = randInt(1, 4)

        const workContent = {
          memberTypes,
          workProcesses: processes,
          workTypes,
        }

        const location = {
          block: `${String.fromCharCode(65 + randInt(0, 2))}블록`,
          dong: `${randInt(1, 5)}동`,
          unit: `${randInt(1, 10)}층`,
        }

        const payload = {
          site_id: site.id,
          work_date: workDate,
          total_workers: mainManpower,
          work_description: `${processes[0]} 작업`,
          status: 'draft',
          work_content: workContent,
          location_info: location,
          created_by: auth.userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        const { error: insertError } = await service.from('daily_reports').insert(payload)
        if (insertError) {
          console.error('[seed-drafts] insert error:', insertError)
          continue
        }

        usedDates.add(workDate)
        done++
        totalInserted++
      }

      perSite[site.id] = done
    }

    return NextResponse.json({ success: true, inserted: totalInserted, perSite })
  } catch (error) {
    console.error('[seed-drafts] unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
