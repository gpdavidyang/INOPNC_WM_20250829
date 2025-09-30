import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'

// Aggregated payroll summary for a partner's sites within a month
// GET /api/partner/payroll/summary?year=YYYY&month=MM[&site_id=...]
export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const supabase = createClient()
    // Prefer service role for multiple lookups
    let service = createServiceRoleClient()

    const { searchParams } = new URL(request.url)
    const year = Number(searchParams.get('year'))
    const month = Number(searchParams.get('month'))
    const siteIdParam = searchParams.get('site_id') || undefined
    if (!year || !month) {
      return NextResponse.json({ error: 'year and month are required' }, { status: 400 })
    }

    // Profile & allowed sites
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, partner_company_id')
      .eq('id', auth.userId)
      .maybeSingle()
    if (!profile || !profile.partner_company_id) {
      return NextResponse.json({ error: 'Not a partner user' }, { status: 403 })
    }

    const periodStart = new Date(year, month - 1, 1).toISOString().split('T')[0]
    const periodEnd = new Date(year, month, 0).toISOString().split('T')[0]

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
        data: {
          year,
          month,
          totalManDays: 0,
          totalWorkers: 0,
          totalBasePay: 0,
          totalOvertimePay: 0,
          totalGrossPay: 0,
        },
      })
    }

    let siteFilter: string[] = Array.from(allowed)
    if (siteIdParam) {
      if (!allowed.has(siteIdParam)) {
        return NextResponse.json({ error: 'Not authorized for this site' }, { status: 403 })
      }
      siteFilter = [siteIdParam]
    }

    // Fetch work_records within month for allowed sites, aggregated by user
    const { data: workRows, error: wrErr } = await service
      .from('work_records')
      .select('user_id, profile_id, work_date, labor_hours, work_hours, overtime_hours, site_id')
      .in('site_id', siteFilter)
      .gte('work_date', periodStart)
      .lte('work_date', periodEnd)

    if (wrErr) {
      console.error('[partner/payroll/summary] work_records error:', wrErr)
      return NextResponse.json({ error: 'Failed to fetch work records' }, { status: 500 })
    }

    type Totals = { manDays: number; hours: number }
    const perUser = new Map<string, Totals>()
    for (const r of workRows || []) {
      const userId = (r as any).user_id || (r as any).profile_id
      if (!userId) continue
      const workHours = Number((r as any).work_hours || 0)
      let manDays = Number((r as any).labor_hours || 0)
      if (!(manDays > 0) && workHours > 0) manDays = workHours / 8
      const prev = perUser.get(userId) || { manDays: 0, hours: 0 }
      prev.manDays += manDays
      prev.hours += workHours > 0 ? workHours : manDays * 8
      perUser.set(userId, prev)
    }

    // Fallback: if no work_records found, estimate per-user manDays via daily_reports.worker_assignments
    if ((!workRows || workRows.length === 0) && perUser.size === 0) {
      const { data: reports } = await service
        .from('daily_reports')
        .select('work_date, site_id, worker_assignments(profile_id, labor_hours)')
        .in('site_id', siteFilter)
        .gte('work_date', periodStart)
        .lte('work_date', periodEnd)
      for (const rep of reports || []) {
        const assn = Array.isArray((rep as any).worker_assignments)
          ? (rep as any).worker_assignments
          : []
        for (const a of assn) {
          const uid = (a as any).profile_id
          if (!uid) continue
          let md = Number((a as any).labor_hours || 0)
          if (!(md > 0)) md = 1
          const prev = perUser.get(uid) || { manDays: 0, hours: 0 }
          prev.manDays += md
          prev.hours += md * 8
          perUser.set(uid, prev)
        }
      }
    }

    // Partner model: count workers + man-days, and compute total gross (pre-tax) as manDays * daily_rate per worker
    let totalManDays = 0
    for (const t of perUser.values()) totalManDays += t.manDays
    const uniqueUsers = Array.from(perUser.keys())

    // Compute total gross = sum(user manDays * daily_rate)
    let totalGrossPay = 0
    for (const uid of uniqueUsers) {
      const totals = perUser.get(uid)!
      // 1) worker_salary_settings preferred (daily_rate)
      let daily_rate: number | null = null
      try {
        const { data: wSetting } = await service
          .from('worker_salary_settings')
          .select('daily_rate')
          .eq('worker_id', uid)
          .eq('is_active', true)
          .lte('effective_date', periodEnd)
          .order('effective_date', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (wSetting?.daily_rate) {
          daily_rate = wSetting.daily_rate
        }
      } catch (e) {
        // ignore, fallback below
      }
      // 2) salary_info fallback (hourly_rate * 8)
      if (!daily_rate) {
        try {
          const { data: sal } = await service
            .from('salary_info')
            .select('hourly_rate')
            .eq('user_id', uid)
            .lte('effective_date', periodEnd)
            .is('end_date', null)
            .order('effective_date', { ascending: false })
            .limit(1)
            .maybeSingle()
          if (sal?.hourly_rate) {
            daily_rate = Math.round((sal.hourly_rate || 0) * 8)
          }
        } catch (e) {
          // ignore
        }
      }
      // 3) default
      if (!daily_rate) {
        daily_rate = 15000 * 8 // default hourly * 8
      }

      totalGrossPay += Math.round(daily_rate * totals.manDays)
    }

    return NextResponse.json({
      success: true,
      data: {
        year,
        month,
        totalWorkers: uniqueUsers.length,
        totalManDays: Number(totalManDays.toFixed(1)),
        totalGrossPay,
      },
    })
  } catch (e) {
    console.error('[partner/payroll/summary] error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
