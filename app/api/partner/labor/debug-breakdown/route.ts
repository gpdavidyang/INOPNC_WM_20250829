import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type DateKey = string // YYYY-MM-DD

export async function GET(req: NextRequest) {
  try {
    // Prefer service role to avoid RLS holes; fall back to server client
    let supabase: ReturnType<typeof createClient>
    try {
      supabase = createServiceRoleClient()
    } catch (e) {
      console.warn('[partner/labor/debug-breakdown] service role unavailable, using server client')
      supabase = createClient()
    }
    const sp = req.nextUrl.searchParams
    const isDevBypass =
      process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true'

    // Params (parse early to allow dev bypass when site_id is provided)
    const year = Number(sp.get('year')) || new Date().getFullYear()
    const month = Number(sp.get('month')) || new Date().getMonth() + 1
    const siteIdParam = sp.get('site_id') || undefined

    if (!isDevBypass) {
      const auth = await requireApiAuth()
      if (auth instanceof NextResponse) return auth
    }

    // Profile + partner scope (skip when dev bypassing; require site_id in that case)
    let partnerCompanyId: string | null = null
    if (!isDevBypass) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, partner_company_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .maybeSingle()
      if (!profile?.partner_company_id) {
        return NextResponse.json({ error: 'Not a partner user' }, { status: 403 })
      }
      partnerCompanyId = profile.partner_company_id
    } else if (!siteIdParam) {
      return NextResponse.json({ error: 'site_id is required in dev bypass' }, { status: 400 })
    }
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    const fmt = (d: Date) => {
      const yy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      return `${yy}-${mm}-${dd}`
    }
    const startDate = fmt(firstDay)
    const endDate = fmt(lastDay)

    // Resolve allowed sites (same logic as other partner endpoints)
    const legacyFallbackEnabled = process.env.ENABLE_SITE_PARTNERS_FALLBACK === 'true'
    const allowed = new Set<string>()
    const nameMap = new Map<string, string>()

    if (!isDevBypass) {
      const { data: mappings } = await supabase
        .from('partner_site_mappings')
        .select('site_id, is_active, sites:site_id(id, name)')
        .eq('partner_company_id', partnerCompanyId as string)
      for (const r of mappings || []) {
        if (r?.site_id && r?.is_active) {
          allowed.add(r.site_id)
          if ((r as any)?.sites?.name) nameMap.set(r.site_id, (r as any).sites.name)
        }
      }
      if (legacyFallbackEnabled && allowed.size === 0) {
        const { data: legacy } = await supabase
          .from('site_partners')
          .select('site_id, contract_status, sites:site_id(id, name)')
          .eq('partner_company_id', partnerCompanyId as string)
        for (const r of legacy || []) {
          if (r?.site_id && r.contract_status !== 'terminated') {
            allowed.add(r.site_id)
            if ((r as any)?.sites?.name) nameMap.set(r.site_id, (r as any).sites.name)
          }
        }
      }
    }
    if (allowed.size === 0) {
      return NextResponse.json({
        year,
        month,
        startDate,
        endDate,
        sites: [],
        perDate: [],
        totals: {
          work_records: { workers: 0, manDays: 0 },
          daily_reports: { workers: 0, manDays: 0 },
        },
      })
    }

    let siteFilter = Array.from(allowed)
    if (siteIdParam) {
      if (!isDevBypass && !allowed.has(siteIdParam)) {
        return NextResponse.json({ error: 'Not authorized for this site' }, { status: 403 })
      }
      siteFilter = [siteIdParam]
    }
    // When dev bypass and no names loaded, fetch names directly
    if (isDevBypass && siteFilter.length > 0 && nameMap.size === 0) {
      const { data: rows } = await supabase.from('sites').select('id, name').in('id', siteFilter)
      for (const r of rows || []) {
        if ((r as any)?.id) nameMap.set((r as any).id, (r as any).name || (r as any).id)
      }
    }

    // WORK_RECORDS aggregation
    const { data: wr } = await supabase
      .from('work_records')
      .select('site_id, work_date, labor_hours, work_hours, user_id')
      .in('site_id', siteFilter)
      .gte('work_date', startDate)
      .lte('work_date', endDate)
    const wrCounts = new Map<DateKey, Map<string, number>>() // date -> site -> count
    const wrManDays = new Map<DateKey, Map<string, number>>() // date -> site -> md
    for (const r of wr || []) {
      const d = (r as any).work_date as string
      const sid = (r as any).site_id as string
      if (!d || !sid) continue
      if (!wrCounts.has(d)) wrCounts.set(d, new Map())
      if (!wrManDays.has(d)) wrManDays.set(d, new Map())
      wrCounts.get(d)!.set(sid, (wrCounts.get(d)!.get(sid) || 0) + 1)
      const wh = Number((r as any).work_hours) || 0
      const lh = Number((r as any).labor_hours) || 0
      const md = lh > 0 ? lh : wh > 0 ? wh / 8 : 0
      wrManDays.get(d)!.set(sid, (wrManDays.get(d)!.get(sid) || 0) + md)
    }

    // DAILY_REPORTS aggregation (assignments)
    const { data: dr } = await supabase
      .from('daily_reports')
      .select('site_id, work_date, worker_assignments(id, labor_hours)')
      .in('site_id', siteFilter)
      .gte('work_date', startDate)
      .lte('work_date', endDate)
    const drCounts = new Map<DateKey, Map<string, number>>()
    const drManDays = new Map<DateKey, Map<string, number>>()
    for (const rep of dr || []) {
      const d = (rep as any).work_date as string
      const sid = (rep as any).site_id as string
      if (!d || !sid) continue
      const wa = Array.isArray((rep as any).worker_assignments)
        ? (rep as any).worker_assignments
        : []
      if (!drCounts.has(d)) drCounts.set(d, new Map())
      if (!drManDays.has(d)) drManDays.set(d, new Map())
      drCounts.get(d)!.set(sid, (drCounts.get(d)!.get(sid) || 0) + wa.length)
      let md = 0
      for (const a of wa) {
        const v = Number((a as any).labor_hours || 0)
        md += v > 0 ? v : 1
      }
      drManDays.get(d)!.set(sid, (drManDays.get(d)!.get(sid) || 0) + md)
    }

    // Build per-date rows
    const allDates = new Set<DateKey>([
      ...Array.from(wrCounts.keys()),
      ...Array.from(drCounts.keys()),
    ])
    // Build combined (max per date-site) maps
    const combinedCounts = new Map<DateKey, Map<string, number>>()
    const combinedManDays = new Map<DateKey, Map<string, number>>()
    for (const d of allDates) {
      combinedCounts.set(d, new Map())
      combinedManDays.set(d, new Map())
      for (const sid of siteFilter) {
        const wrC = wrCounts.get(d)?.get(sid) || 0
        const drC = drCounts.get(d)?.get(sid) || 0
        const wrMD = wrManDays.get(d)?.get(sid) || 0
        const drMD = drManDays.get(d)?.get(sid) || 0
        const cC = Math.max(wrC, drC)
        const cMD = Math.max(wrMD, drMD)
        if (cC > 0 || cMD > 0) {
          combinedCounts.get(d)!.set(sid, cC)
          combinedManDays.get(d)!.set(sid, cMD)
        }
      }
    }

    const perDate = Array.from(allDates)
      .sort()
      .map(date => {
        const sites: any[] = []
        for (const sid of siteFilter) {
          const name = nameMap.get(sid) || sid
          const wrC = wrCounts.get(date)?.get(sid) || 0
          const wrMD = Number((wrManDays.get(date)?.get(sid) || 0).toFixed(2))
          const drC = drCounts.get(date)?.get(sid) || 0
          const drMD = Number((drManDays.get(date)?.get(sid) || 0).toFixed(2))
          const cC = combinedCounts.get(date)?.get(sid) || 0
          const cMD = Number((combinedManDays.get(date)?.get(sid) || 0).toFixed(2))
          if (wrC > 0 || drC > 0 || wrMD > 0 || drMD > 0 || cC > 0 || cMD > 0) {
            sites.push({
              site_id: sid,
              site_name: name,
              wr_count: wrC,
              wr_manDays: wrMD,
              dr_count: drC,
              dr_manDays: drMD,
              combined_count: cC,
              combined_manDays: cMD,
            })
          }
        }
        const totals = sites.reduce(
          (acc, s) => {
            acc.wr.count += s.wr_count
            acc.wr.manDays += s.wr_manDays
            acc.dr.count += s.dr_count
            acc.dr.manDays += s.dr_manDays
            acc.combined.count += s.combined_count
            acc.combined.manDays += s.combined_manDays
            return acc
          },
          {
            wr: { count: 0, manDays: 0 },
            dr: { count: 0, manDays: 0 },
            combined: { count: 0, manDays: 0 },
          }
        )
        totals.wr.manDays = Number(totals.wr.manDays.toFixed(2))
        totals.dr.manDays = Number(totals.dr.manDays.toFixed(2))
        totals.combined.manDays = Number(totals.combined.manDays.toFixed(2))
        return { date, sites, totals }
      })

    // Site totals for the month
    const perSite = siteFilter.map(sid => {
      const name = nameMap.get(sid) || sid
      let wrC = 0,
        wrMD = 0,
        drC = 0,
        drMD = 0,
        cC = 0,
        cMD = 0
      for (const date of perDate) {
        const row = date.sites.find((s: any) => s.site_id === sid)
        if (!row) continue
        wrC += row.wr_count
        wrMD += row.wr_manDays
        drC += row.dr_count
        drMD += row.dr_manDays
        cC += row.combined_count
        cMD += row.combined_manDays
      }
      return {
        site_id: sid,
        site_name: name,
        wr_count_total: wrC,
        wr_manDays_total: Number(wrMD.toFixed(2)),
        dr_count_total: drC,
        dr_manDays_total: Number(drMD.toFixed(2)),
        combined_count_total: cC,
        combined_manDays_total: Number(cMD.toFixed(2)),
      }
    })

    // Monthly totals
    const totals = perDate.reduce(
      (acc, d) => {
        acc.work_records.workers += d.totals.wr.count
        acc.work_records.manDays += d.totals.wr.manDays
        acc.daily_reports.workers += d.totals.dr.count
        acc.daily_reports.manDays += d.totals.dr.manDays
        acc.combined.workers += d.totals.combined.count
        acc.combined.manDays += d.totals.combined.manDays
        return acc
      },
      {
        work_records: { workers: 0, manDays: 0 },
        daily_reports: { workers: 0, manDays: 0 },
        combined: { workers: 0, manDays: 0 },
      }
    )
    totals.work_records.manDays = Number(totals.work_records.manDays.toFixed(2))
    totals.daily_reports.manDays = Number(totals.daily_reports.manDays.toFixed(2))
    totals.combined.manDays = Number(totals.combined.manDays.toFixed(2))

    return NextResponse.json({
      year,
      month,
      startDate,
      endDate,
      sites: perSite,
      perDate,
      totals,
    })
  } catch (e) {
    console.error('[partner/labor/debug-breakdown] error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
