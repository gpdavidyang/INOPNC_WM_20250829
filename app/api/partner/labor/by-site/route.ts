import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = await createClient()

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, partner_company_id, organization_id')
      .eq('id', authResult.userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (!profile.partner_company_id) {
      return NextResponse.json({ error: 'Not a partner user' }, { status: 403 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || 'monthly'
    const overrideDate = searchParams.get('date')
    const overrideStart = searchParams.get('start_date')
    const overrideEnd = searchParams.get('end_date')

    let startDate: string
    let endDate: string

    const now = new Date()
    const fmt = (d: Date) => {
      const yy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      return `${yy}-${mm}-${dd}`
    }
    switch (period) {
      case 'daily': {
        startDate = fmt(now)
        endDate = startDate
        break
      }
      case 'weekly': {
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        startDate = fmt(weekStart)
        endDate = fmt(now)
        break
      }
      case 'monthly':
      default: {
        startDate = fmt(new Date(now.getFullYear(), now.getMonth(), 1))
        endDate = fmt(now)
        break
      }
    }

    // Optional override via explicit date parameters for day-level queries
    if (overrideStart && overrideEnd) {
      startDate = overrideStart
      endDate = overrideEnd
    } else if (overrideDate) {
      startDate = overrideDate
      endDate = overrideDate
    }

    const legacyFallbackEnabled = process.env.ENABLE_SITE_PARTNERS_FALLBACK === 'true'
    const legacyInactiveStatuses = new Set(['terminated', 'inactive', 'suspended', 'cancelled'])

    const siteMap = new Map<
      string,
      {
        site: {
          id: string
          name: string
          address: string | null
          status: string | null
          start_date: string | null
          end_date: string | null
        } | null
        contractValue: number | null
        assignedDate: string | null
        contractStatus: string
      }
    >()

    const { data: mappingRows, error: mappingError } = await supabase
      .from('partner_site_mappings')
      .select(
        `
        site_id,
        start_date,
        end_date,
        is_active,
        notes,
        sites:site_id(
          id,
          name,
          address,
          status,
          start_date,
          end_date
        )
      `
      )
      .eq('partner_company_id', profile.partner_company_id)

    if (mappingError) {
      console.error('Error fetching partner_site_mappings:', mappingError)
      if (!legacyFallbackEnabled) {
        return NextResponse.json({ error: 'Failed to fetch sites' }, { status: 500 })
      }
    } else {
      mappingRows
        ?.filter(row => row.is_active && row.sites?.id)
        .forEach(row => {
          const meta = parseContractNotes(row.notes)
          siteMap.set(row.site_id, {
            site: {
              id: row.sites?.id || '',
              name: row.sites?.name || '알 수 없는 현장',
              address: row.sites?.address ?? null,
              status: row.sites?.status ?? null,
              start_date: row.sites?.start_date ?? null,
              end_date: row.sites?.end_date ?? null,
            },
            contractValue: meta.contract_value ?? null,
            assignedDate: row.start_date ?? null,
            contractStatus:
              meta.contract_status ?? deriveContractStatus(row.is_active, row.end_date),
          })
        })
    }

    if ((mappingError || siteMap.size === 0) && legacyFallbackEnabled) {
      const { data: legacyRows, error: legacyError } = await supabase
        .from('site_partners')
        .select(
          `
          site_id,
          contract_value,
          assigned_date,
          contract_status,
          notes,
          sites:site_id(
            id,
            name,
            address,
            status,
            start_date,
            end_date
          )
        `
        )
        .eq('partner_company_id', profile.partner_company_id)

      if (legacyError) {
        console.error('Error fetching legacy site_partners:', legacyError)
        if (siteMap.size === 0) {
          return NextResponse.json({ error: 'Failed to fetch sites' }, { status: 500 })
        }
      } else {
        legacyRows
          ?.filter(row => {
            if (!row.sites?.id) return false
            if (legacyInactiveStatuses.has(row.contract_status ?? '')) return false
            return true
          })
          .forEach(row => {
            if (!siteMap.has(row.site_id)) {
              const meta = parseContractNotes(row.notes)
              siteMap.set(row.site_id, {
                site: {
                  id: row.sites?.id || '',
                  name: row.sites?.name || '알 수 없는 현장',
                  address: row.sites?.address ?? null,
                  status: row.sites?.status ?? null,
                  start_date: row.sites?.start_date ?? null,
                  end_date: row.sites?.end_date ?? null,
                },
                contractValue: meta.contract_value ?? row.contract_value ?? null,
                assignedDate: row.assigned_date ?? null,
                contractStatus: meta.contract_status ?? (row.contract_status || 'unknown'),
              })
            }
          })
      }
    }

    if (siteMap.size === 0) {
      return NextResponse.json([])
    }

    const siteEntries = Array.from(siteMap.values()).filter(entry => entry.site)

    // Get labor data for each site
    const siteLaborPromises = siteEntries.map(async entry => {
      const site = entry.site
      if (!site) return null

      // Get labor hours for this site
      const { data: laborData, error: laborError } = await supabase
        .from('work_records')
        .select('work_date, work_hours, labor_hours, overtime_hours, user_id')
        .eq('site_id', site.id)
        .gte('work_date', startDate)
        .lte('work_date', endDate)
        .order('work_date', { ascending: false })

      if (laborError) {
        console.error(`Error fetching labor data for site ${site.id}:`, laborError)
        return null
      }

      // Calculate totals from work_records
      let totalWorkHours = 0
      let totalLaborHoursRaw = 0
      let sumManDaysRecords = 0
      for (const rec of laborData || []) {
        const wh = Number((rec as any).work_hours) || 0
        const lh = Number((rec as any).labor_hours) || 0
        totalWorkHours += wh
        totalLaborHoursRaw += lh
        sumManDaysRecords += lh > 0 ? lh : wh > 0 ? wh / 8 : 0
      }

      // Sum of daily worker counts across the range (count each record; do not de-duplicate)
      const perDateCounts = new Map<string, number>()
      const perDateManDays = new Map<string, number>()
      for (const rec of laborData || []) {
        const d = (rec as any).work_date
        if (!d) continue
        perDateCounts.set(d, (perDateCounts.get(d) || 0) + 1)
        const wh = Number((rec as any).work_hours) || 0
        const lh = Number((rec as any).labor_hours) || 0
        const md = lh > 0 ? lh : wh > 0 ? wh / 8 : 0
        perDateManDays.set(d, (perDateManDays.get(d) || 0) + md)
      }
      // Per-date fallback to daily_reports; use max logic per date to avoid undercount
      try {
        const { createServiceRoleClient } = await import('@/lib/supabase/service-role')
        const service = createServiceRoleClient()
        const { data: reports } = await service
          .from('daily_reports')
          .select('work_date, worker_assignments(id, labor_hours)')
          .eq('site_id', site.id)
          .gte('work_date', startDate)
          .lte('work_date', endDate)
        for (const rep of reports || []) {
          const d = (rep as any).work_date
          const existing = perDateCounts.get(d) || 0
          const wa = Array.isArray((rep as any).worker_assignments)
            ? (rep as any).worker_assignments
            : []
          // Workers: take max between work_records count and assignment count
          if (wa.length > existing) perDateCounts.set(d, wa.length)
          let md = 0
          for (const a of wa) {
            const v = Number((a as any).labor_hours || 0)
            md += v > 0 ? v : 1
          }
          const existingMd = perDateManDays.get(d) || 0
          if (md > existingMd) perDateManDays.set(d, md)
        }
      } catch (e) {
        // ignore fallback errors
      }
      let workerDays = 0
      let totalManDays = 0
      for (const n of perDateCounts.values()) workerDays += n
      for (const md of perDateManDays.values()) totalManDays += md

      // Working days = number of dates with any records (after fallback)
      const workingDays = perDateCounts.size

      // Calculate average daily hours
      const averageDailyHours = workingDays > 0 ? totalManDays / workingDays : 0

      // Get most recent work data
      const recentWork = laborData?.[0]
      const recentWorkDate = recentWork?.work_date || startDate
      const recentDailyHours = recentWork
        ? Number(recentWork.labor_hours) || (Number(recentWork.work_hours) || 0) / 8
        : 0

      const contractStatus = entry.contractStatus

      return {
        id: site.id,
        name: site.name,
        address: site.address,
        status: contractStatus === 'completed' ? 'completed' : site.status || 'active',
        contractStatus,
        // For compatibility, keep totalLaborHours but return man-days value
        totalLaborHours: totalManDays,
        totalManDays,
        workerDays,
        averageDailyHours,
        recentWorkDate,
        recentDailyHours,
        contractValue: entry.contractValue,
        assignedDate: entry.assignedDate,
        workingDays,
      }
    })

    const siteLabor = await Promise.all(siteLaborPromises)
    // Filter out sites with zero totals (both man-days and worker counts are 0)
    const validSiteLabor = (siteLabor.filter((site: any) => site !== null) as any[]).filter(
      s => Number(s?.totalManDays || 0) > 0 || Number(s?.workerDays || 0) > 0
    )

    // Sort by total labor hours descending
    validSiteLabor.sort((a, b) => (b?.totalLaborHours || 0) - (a?.totalLaborHours || 0))

    return NextResponse.json({
      sites: validSiteLabor,
      period,
      dateRange: { startDate, endDate },
      totalCount: validSiteLabor.length,
    })
  } catch (error) {
    console.error('Partner site labor error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function deriveContractStatus(isActive?: boolean | null, endDate?: string | null): string {
  if (endDate) {
    return 'completed'
  }
  if (isActive === false) {
    return 'terminated'
  }
  if (isActive === true) {
    return 'active'
  }
  return 'unknown'
}

function parseContractNotes(value?: string | null): {
  contract_status?: string
  contract_value?: number | null
} {
  if (!value) {
    return {}
  }

  const trimmed = value.trim()
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
    return {}
  }

  try {
    const parsed = JSON.parse(trimmed)
    const candidate =
      parsed && typeof parsed === 'object' && 'meta' in parsed ? parsed.meta : parsed
    if (candidate && typeof candidate === 'object') {
      const result: { contract_status?: string; contract_value?: number | null } = {}
      if (typeof candidate.contract_status === 'string') {
        result.contract_status = candidate.contract_status
      }
      if (typeof candidate.contract_value === 'number' || candidate.contract_value === null) {
        result.contract_value = candidate.contract_value
      }
      return result
    }
  } catch (error) {
    console.warn('Failed to parse contract metadata from notes (labor/by-site):', { value, error })
  }

  return {}
}
