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
    switch (period) {
      case 'daily': {
        startDate = now.toISOString().split('T')[0]
        endDate = startDate
        break
      }
      case 'weekly': {
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        startDate = weekStart.toISOString().split('T')[0]
        endDate = now.toISOString().split('T')[0]
        break
      }
      case 'monthly':
      default: {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
        endDate = now.toISOString().split('T')[0]
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
        .select('work_date, work_hours, labor_hours, overtime_hours')
        .eq('site_id', site.id)
        .gte('work_date', startDate)
        .lte('work_date', endDate)
        .order('work_date', { ascending: false })

      if (laborError) {
        console.error(`Error fetching labor data for site ${site.id}:`, laborError)
        return null
      }

      // Calculate totals
      const totalWorkHours =
        laborData?.reduce(
          (sum: number, record: unknown) => sum + (Number(record.work_hours) || 0),
          0
        ) || 0
      const totalLaborHours =
        laborData?.reduce(
          (sum: number, record: unknown) => sum + (Number(record.labor_hours) || 0),
          0
        ) || 0

      // Get unique work dates for calculating working days
      const uniqueDates = new Set(laborData?.map((record: unknown) => record.work_date) || [])
      const workingDays = uniqueDates.size

      // Calculate average daily hours
      const averageDailyHours =
        workingDays > 0 ? (totalLaborHours || totalWorkHours) / workingDays : 0

      // Get most recent work data
      const recentWork = laborData?.[0]
      const recentWorkDate = recentWork?.work_date || startDate
      const recentDailyHours = recentWork
        ? Number(recentWork.labor_hours) || Number(recentWork.work_hours) || 0
        : 0

      const contractStatus = entry.contractStatus

      return {
        id: site.id,
        name: site.name,
        address: site.address,
        status: contractStatus === 'completed' ? 'completed' : site.status || 'active',
        contractStatus,
        totalLaborHours: totalLaborHours || totalWorkHours,
        averageDailyHours,
        recentWorkDate,
        recentDailyHours,
        contractValue: entry.contractValue,
        assignedDate: entry.assignedDate,
        workingDays,
      }
    })

    const siteLabor = await Promise.all(siteLaborPromises)
    const validSiteLabor = siteLabor.filter((site: unknown) => site !== null)

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
