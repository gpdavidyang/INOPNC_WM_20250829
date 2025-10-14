import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'

// Returns aggregated daily labor for partner's allowed sites within a date range
// GET /api/partner/labor/daily?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD[&site_id=...]
export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const supabase = createClient()

    // Load profile to ensure partner scope
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, partner_company_id')
      .eq('id', auth.userId)
      .maybeSingle()

    if (!profile || !profile.partner_company_id) {
      return NextResponse.json({ error: 'Not a partner user' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const siteIdParam = searchParams.get('site_id') || undefined
    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'start_date and end_date are required' }, { status: 400 })
    }

    // Resolve allowed site IDs
    const legacyFallbackEnabled = process.env.ENABLE_SITE_PARTNERS_FALLBACK === 'true'
    const allowed = new Set<string>()
    const { data: mappings, error: mErr } = await supabase
      .from('partner_site_mappings')
      .select('site_id, is_active')
      .eq('partner_company_id', profile.partner_company_id)

    if (!mErr) {
      ;(mappings || []).forEach(r => r?.site_id && r.is_active && allowed.add(r.site_id))
    }
    if ((mErr || allowed.size === 0) && legacyFallbackEnabled) {
      const { data: legacy } = await supabase
        .from('site_partners')
        .select('site_id, contract_status')
        .eq('partner_company_id', profile.partner_company_id)
      ;(legacy || []).forEach(
        r => r?.site_id && r.contract_status !== 'terminated' && allowed.add(r.site_id)
      )
    }
    if (allowed.size === 0) {
      return NextResponse.json({
        success: true,
        data: { daily: {}, totalManDays: 0, totalHours: 0 },
      })
    }

    // Optional site-specific restriction
    let siteFilter: string[] = Array.from(allowed)
    if (siteIdParam) {
      if (!allowed.has(siteIdParam)) {
        return NextResponse.json({ error: 'Not authorized for this site' }, { status: 403 })
      }
      siteFilter = [siteIdParam]
    }

    // Preload site names for mapping
    let siteNameMap = new Map<string, string>()
    try {
      const { data: siteRows } = await supabase
        .from('sites')
        .select('id, name')
        .in('id', siteFilter)
      ;(siteRows || []).forEach((s: any) => {
        if (s?.id) siteNameMap.set(s.id, s.name || '')
      })
    } catch {
      // ignore name preload errors
    }

    // Fetch work records in range and aggregate client-side per date
    const { data: rows, error } = await supabase
      .from('work_records')
      .select('work_date, labor_hours, work_hours, site_id, user_id')
      .in('site_id', siteFilter)
      .gte('work_date', startDate)
      .lte('work_date', endDate)

    if (error) {
      console.error('[partner/labor/daily] work_records error:', error)
      return NextResponse.json({ error: 'Failed to fetch work records' }, { status: 500 })
    }

    const daily: Record<string, { manDays: number; hours: number; workers?: number }> = {}
    const perDateSiteTotals: Map<string, Map<string, number>> = new Map() // manDays per date-site
    const perDateSiteWorkers: Map<string, Map<string, number>> = new Map() // count per date-site
    const perDateSiteManDays: Map<string, Map<string, number>> = new Map() // explicit manDays per date-site
    let totalManDays = 0
    let totalHours = 0
    let totalWorkers = 0
    for (const r of rows || []) {
      const d = (r as any).work_date
      if (!d) continue
      // Treat labor_hours as man-days, fallback to work_hours/8
      const workHours = Number((r as any).work_hours || 0)
      let manDays = Number((r as any).labor_hours || 0)
      if (!(manDays > 0) && workHours > 0) manDays = workHours / 8
      const hours = workHours > 0 ? workHours : manDays * 8

      if (!daily[d]) daily[d] = { manDays: 0, hours: 0, workers: 0 }
      daily[d].manDays += manDays
      daily[d].hours += hours
      // Count each record as one person-entry for the date
      daily[d].workers = (daily[d].workers || 0) + 1
      totalManDays += manDays
      totalHours += hours

      // per-date per-site totals for top site detection
      const sid = (r as any).site_id
      if (sid) {
        if (!perDateSiteTotals.has(d)) perDateSiteTotals.set(d, new Map())
        const m = perDateSiteTotals.get(d)!
        m.set(sid, (m.get(sid) || 0) + manDays)
        if (!perDateSiteWorkers.has(d)) perDateSiteWorkers.set(d, new Map())
        const w = perDateSiteWorkers.get(d)!
        w.set(sid, (w.get(sid) || 0) + 1)
        if (!perDateSiteManDays.has(d)) perDateSiteManDays.set(d, new Map())
        const md = perDateSiteManDays.get(d)!
        md.set(sid, (md.get(sid) || 0) + manDays)
      }

      // Note: do not de-duplicate same user on same date — each record counts
    }

    // Fallback: if no work_records data, estimate via daily_reports.worker_assignments count
    // Per-date fallback via daily_reports.worker_assignments when a date-site has 0 records
    try {
      const { createServiceRoleClient } = await import('@/lib/supabase/service-role')
      const service = createServiceRoleClient()
      const { data: reports } = await service
        .from('daily_reports')
        .select('work_date, site_id, worker_assignments(id, labor_hours)')
        .in('site_id', siteFilter)
        .gte('work_date', startDate)
        .lte('work_date', endDate)

      for (const rep of reports || []) {
        const d = (rep as any).work_date
        const sid = (rep as any).site_id
        if (!d || !sid) continue
        const wa = Array.isArray((rep as any).worker_assignments)
          ? (rep as any).worker_assignments
          : []
        // Sum labor_hours if present, else assume 1 man-day per assignment
        let manDaysWA = 0
        for (const a of wa) {
          const md = Number((a as any).labor_hours || 0)
          manDaysWA += md > 0 ? md : 1
        }
        if (!daily[d]) daily[d] = { manDays: 0, hours: 0, workers: 0 }

        // Use max logic per date-site between work_records and worker_assignments
        const prevCount = perDateSiteWorkers.get(d)?.get(sid) || 0
        const prevManDays = perDateSiteManDays.get(d)?.get(sid) || 0
        const nextCount = Math.max(prevCount, wa.length)
        const nextManDays = Math.max(prevManDays, manDaysWA)

        const deltaCount = nextCount - prevCount
        const deltaManDays = nextManDays - prevManDays

        if (deltaCount > 0) {
          daily[d].workers = (daily[d].workers || 0) + deltaCount
          if (!perDateSiteWorkers.has(d)) perDateSiteWorkers.set(d, new Map())
          perDateSiteWorkers.get(d)!.set(sid, nextCount)
        }
        if (deltaManDays > 0) {
          daily[d].manDays += deltaManDays
          daily[d].hours += deltaManDays * 8
          totalManDays += deltaManDays
          totalHours += deltaManDays * 8
          if (!perDateSiteTotals.has(d)) perDateSiteTotals.set(d, new Map())
          perDateSiteTotals
            .get(d)!
            .set(sid, (perDateSiteTotals.get(d)!.get(sid) || 0) + deltaManDays)
          if (!perDateSiteManDays.has(d)) perDateSiteManDays.set(d, new Map())
          perDateSiteManDays.get(d)!.set(sid, nextManDays)
        }
      }
    } catch (e) {
      // ignore fallback errors
    }

    // Determine top site per date by manDays
    const topSites: Record<string, { site_id: string; site_name: string | null }> = {}
    for (const [dateKey, m] of perDateSiteTotals.entries()) {
      let topId: string | null = null
      let topVal = -1
      for (const [sid, val] of m.entries()) {
        if (val > topVal) {
          topId = sid
          topVal = val
        }
      }
      if (topId) {
        topSites[dateKey] = { site_id: topId, site_name: siteNameMap.get(topId) || null }
      }
    }

    // Finalize workers and round manDays/hours
    Object.keys(daily).forEach(k => {
      daily[k].manDays = Number(daily[k].manDays.toFixed(1))
      daily[k].hours = Number(daily[k].hours.toFixed(1))
      daily[k].workers = daily[k].workers || 0
      totalWorkers += daily[k].workers as number
    })

    return NextResponse.json({
      success: true,
      data: {
        daily,
        topSites,
        totalManDays: Number(totalManDays.toFixed(1)),
        totalHours: Number(totalHours.toFixed(1)),
        totalWorkers,
      },
    })
  } catch (e) {
    console.error('[partner/labor/daily] error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
