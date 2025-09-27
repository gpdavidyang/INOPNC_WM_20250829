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

    const legacyFallbackEnabled = process.env.ENABLE_SITE_PARTNERS_FALLBACK === 'true'
    const legacyInactiveStatuses = new Set(['terminated', 'inactive', 'suspended', 'cancelled'])

    const siteMap = new Map<string, { status: string | null }>()

    const { data: mappingRows, error: mappingError } = await supabase
      .from('partner_site_mappings')
      .select(
        `
        site_id,
        is_active,
        sites:site_id(id, status)
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
          siteMap.set(row.site_id, { status: row.sites?.status ?? null })
        })
    }

    if ((mappingError || siteMap.size === 0) && legacyFallbackEnabled) {
      const { data: legacyRows, error: legacyError } = await supabase
        .from('site_partners')
        .select(
          `
          site_id,
          contract_status,
          sites:site_id(id, status)
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
              siteMap.set(row.site_id, { status: row.sites?.status ?? null })
            }
          })
      }
    }

    const siteIds = Array.from(siteMap.keys())
    const totalSites = siteMap.size
    const activeSites = Array.from(siteMap.values()).filter(site => site.status === 'active').length

    if (siteIds.length === 0) {
      return NextResponse.json({
        totalSites: 0,
        activeSites: 0,
        totalLaborHours: 0,
        averageDailyHours: 0,
        overtimeHours: 0,
        workingDays: 0,
      })
    }

    // Get labor hours data
    const { data: laborData, error: laborError } = await supabase
      .from('work_records')
      .select('work_date, work_hours, labor_hours, overtime_hours')
      .in('site_id', siteIds)
      .gte('work_date', startDate)
      .lte('work_date', endDate)

    if (laborError) {
      console.error('Error fetching labor data:', laborError)
      return NextResponse.json({ error: 'Failed to fetch labor data' }, { status: 500 })
    }

    // Calculate statistics
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
    const totalOvertimeHours =
      laborData?.reduce(
        (sum: number, record: unknown) => sum + (Number(record.overtime_hours) || 0),
        0
      ) || 0

    // Get unique work dates for calculating working days
    const uniqueDates = new Set(laborData?.map((record: unknown) => record.work_date) || [])
    const workingDays = uniqueDates.size

    // Calculate average daily hours
    const averageDailyHours =
      workingDays > 0 ? (totalLaborHours || totalWorkHours) / workingDays : 0

    return NextResponse.json({
      totalSites,
      activeSites,
      totalLaborHours: totalLaborHours || totalWorkHours,
      averageDailyHours,
      overtimeHours: totalOvertimeHours,
      workingDays,
      period,
      dateRange: { startDate, endDate },
    })
  } catch (error) {
    console.error('Partner labor summary error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
