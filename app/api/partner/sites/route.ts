import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

interface NormalizedParticipation {
  source: 'partner_site_mappings' | 'site_partners'
  mappingId: string
  site: {
    id: string
    name: string
    address?: string | null
    status?: string | null
    startDate?: string | null
    endDate?: string | null
  }
  partnerCompany: {
    id: string
    companyName?: string | null
    companyType?: string | null
    tradeType?: string[] | null
  }
  startDate?: string | null
  endDate?: string | null
  isActive?: boolean | null
  notes?: string | null
  contractStatus: string
  contractValue?: number | null
}

export async function GET(request: Request) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = createClient()
    console.log('Auth debug:', {
      user: authResult.userId,
      email: authResult.email,
      role: authResult.role,
    })

    // Get user profile to check if they're associated with a partner company
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', authResult.userId)
      .single()

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'all'
    const status = searchParams.get('status')

    // Get sites where this user's partner company is assigned
    if (!profile.organization_id) {
      return NextResponse.json({
        success: true,
        data: {
          participations: [],
        },
        statistics: {
          total_sites: 0,
          active_sites: 0,
          completed_sites: 0,
        },
        filters: {
          period,
          status,
        },
      })
    }

    const legacyFallbackEnabled = process.env.ENABLE_SITE_PARTNERS_FALLBACK === 'true'

    // Apply period filter boundaries
    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const recent3Months = new Date(now.getFullYear(), now.getMonth() - 3, 1)
    const recent6Months = new Date(now.getFullYear(), now.getMonth() - 6, 1)
    const recent12Months = new Date(now.getFullYear(), now.getMonth() - 12, 1)
    const recent24Months = new Date(now.getFullYear(), now.getMonth() - 24, 1)

    let mappingQuery = supabase
      .from('partner_site_mappings')
      .select(
        `
        id,
        site_id,
        partner_company_id,
        start_date,
        end_date,
        is_active,
        notes,
        sites:sites!inner(
          id,
          name,
          address,
          status as site_status,
          start_date,
          end_date,
          created_at
        ),
        partner_companies:partner_companies!inner(
          id,
          company_name,
          company_type,
          trade_type
        )
      `
      )
      .eq('partner_company_id', profile.organization_id)

    switch (period) {
      case 'current_month': {
        mappingQuery = mappingQuery.gte('start_date', currentMonth.toISOString().split('T')[0])
        break
      }
      case 'recent_3': {
        mappingQuery = mappingQuery.gte('start_date', recent3Months.toISOString().split('T')[0])
        break
      }
      case 'recent_6': {
        mappingQuery = mappingQuery.gte('start_date', recent6Months.toISOString().split('T')[0])
        break
      }
      case 'recent_12': {
        mappingQuery = mappingQuery.gte('start_date', recent12Months.toISOString().split('T')[0])
        break
      }
      case 'recent_24': {
        mappingQuery = mappingQuery.gte('start_date', recent24Months.toISOString().split('T')[0])
        break
      }
      case 'all':
      default:
        break
    }

    mappingQuery = mappingQuery.order('start_date', { ascending: false })

    const { data: mappingRows, error: mappingError } = await mappingQuery

    if (mappingError) {
      console.error('Participations query error (partner_site_mappings):', mappingError)
      if (!legacyFallbackEnabled) {
        return NextResponse.json(
          { error: 'Failed to fetch site participations', details: mappingError.message },
          { status: 500 }
        )
      }
    }

    const requestedStatus = status && status !== 'all' ? status : null
    const legacyInactiveStatuses = new Set(['terminated', 'inactive', 'suspended', 'cancelled'])
    const participationMap = new Map<string, NormalizedParticipation>()

    const addParticipation = (record: NormalizedParticipation) => {
      if (!record.site.id) return
      if (!participationMap.has(record.site.id)) {
        participationMap.set(record.site.id, record)
      }
    }

    mappingRows
      ?.filter(row => row?.sites?.id)
      .forEach(row => {
        const meta = parseContractNotes(row.notes)
        const derivedStatus =
          meta.contract_status ?? deriveContractStatus(row.is_active, row.end_date)
        if (requestedStatus && derivedStatus !== requestedStatus) {
          return
        }

        addParticipation({
          source: 'partner_site_mappings',
          mappingId: row.id,
          site: {
            id: row.sites?.id || '',
            name: row.sites?.name || '알 수 없는 현장',
            address: row.sites?.address ?? '',
            status: row.sites?.site_status ?? null,
            startDate: row.sites?.start_date ?? null,
            endDate: row.sites?.end_date ?? null,
          },
          partnerCompany: {
            id: row.partner_companies?.id || '',
            companyName: row.partner_companies?.company_name || '',
            companyType: row.partner_companies?.company_type || '',
            tradeType: row.partner_companies?.trade_type || [],
          },
          startDate: row.start_date ?? null,
          endDate: row.end_date ?? null,
          isActive: row.is_active ?? null,
          notes: row.notes ?? null,
          contractStatus: derivedStatus,
          contractValue: meta.contract_value ?? null,
        })
      })

    if ((mappingError || participationMap.size === 0) && legacyFallbackEnabled) {
      let fallbackQuery = supabase
        .from('site_partners')
        .select(
          `
          id,
          site_id,
          partner_company_id,
          assigned_date,
          contract_status,
          contract_value,
          notes,
          sites:sites!inner(
            id,
            name,
            address,
            status as site_status,
            start_date,
            end_date,
            created_at
          ),
          partner_companies:partner_companies!inner(
            id,
            company_name,
            company_type,
            trade_type
          )
        `
        )
        .eq('partner_company_id', profile.organization_id)

      switch (period) {
        case 'current_month': {
          fallbackQuery = fallbackQuery.gte(
            'assigned_date',
            currentMonth.toISOString().split('T')[0]
          )
          break
        }
        case 'recent_3': {
          fallbackQuery = fallbackQuery.gte(
            'assigned_date',
            recent3Months.toISOString().split('T')[0]
          )
          break
        }
        case 'recent_6': {
          fallbackQuery = fallbackQuery.gte(
            'assigned_date',
            recent6Months.toISOString().split('T')[0]
          )
          break
        }
        case 'recent_12': {
          fallbackQuery = fallbackQuery.gte(
            'assigned_date',
            recent12Months.toISOString().split('T')[0]
          )
          break
        }
        case 'recent_24': {
          fallbackQuery = fallbackQuery.gte(
            'assigned_date',
            recent24Months.toISOString().split('T')[0]
          )
          break
        }
        case 'all':
        default:
          break
      }

      fallbackQuery = fallbackQuery.order('assigned_date', { ascending: false })

      const { data: legacyRows, error: legacyError } = await fallbackQuery

      if (legacyError) {
        console.error('Participations legacy fallback error (site_partners):', legacyError)
        if (participationMap.size === 0) {
          return NextResponse.json(
            { error: 'Failed to fetch site participations', details: legacyError.message },
            { status: 500 }
          )
        }
      } else {
        legacyRows
          ?.filter(row => row?.sites?.id)
          .forEach(row => {
            const legacyStatus = row.contract_status || 'unknown'
            if (requestedStatus && legacyStatus !== requestedStatus) {
              return
            }
            if (!requestedStatus && legacyInactiveStatuses.has(legacyStatus)) {
              return
            }

            const meta = parseContractNotes(row.notes)

            addParticipation({
              source: 'site_partners',
              mappingId: row.id,
              site: {
                id: row.sites?.id || '',
                name: row.sites?.name || '알 수 없는 현장',
                address: row.sites?.address ?? '',
                status: row.sites?.site_status ?? null,
                startDate: row.sites?.start_date ?? null,
                endDate: row.sites?.end_date ?? null,
              },
              partnerCompany: {
                id: row.partner_companies?.id || '',
                companyName: row.partner_companies?.company_name || '',
                companyType: row.partner_companies?.company_type || '',
                tradeType: row.partner_companies?.trade_type || [],
              },
              startDate: row.assigned_date ?? null,
              endDate: row.sites?.end_date ?? null,
              isActive: row.contract_status === 'active',
              notes: row.notes ?? null,
              contractStatus: meta.contract_status ?? legacyStatus,
              contractValue: meta.contract_value ?? row.contract_value ?? null,
            })
          })
      }
    }

    const normalizedParticipations = Array.from(participationMap.values())

    const transformedParticipations = normalizedParticipations.map(entry => ({
      id: entry.site.id,
      site_partner_id: entry.mappingId,
      name: entry.site.name,
      address: entry.site.address || '',
      role: determineRole(
        entry.partnerCompany.companyType || '',
        entry.partnerCompany.tradeType ?? []
      ),
      work: determineWorkDescription(entry.partnerCompany.tradeType ?? [], entry.site.name),
      period: formatPeriod(entry.startDate, entry.endDate ?? entry.site.endDate ?? null),
      status: mapContractStatus(entry.contractStatus, entry.site.status ?? null),
      startDate: entry.startDate || '',
      endDate: entry.endDate ?? entry.site.endDate ?? null,
      contractValue: entry.contractValue ?? null,
      contractStatus: entry.contractStatus,
      siteStatus: entry.site.status || 'unknown',
      companyType: entry.partnerCompany.companyType || '',
      tradeType: entry.partnerCompany.tradeType ?? [],
      notes: entry.notes && entry.notes.trim().startsWith('{') ? null : entry.notes || null,
    }))

    // Calculate statistics
    const totalSites = transformedParticipations.length
    const activeSites = transformedParticipations.filter(
      (p: unknown) =>
        p.contractStatus === 'active' &&
        (p.siteStatus === 'active' || p.siteStatus === 'in_progress')
    ).length
    const completedSites = transformedParticipations.filter(
      (p: unknown) => p.contractStatus === 'completed' || p.siteStatus === 'completed'
    ).length

    return NextResponse.json({
      success: true,
      data: {
        participations: transformedParticipations,
      },
      statistics: {
        total_sites: totalSites,
        active_sites: activeSites,
        completed_sites: completedSites,
      },
      filters: {
        period,
        status,
      },
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper functions
function determineRole(companyType: string, tradeTypes: string[] | null): string {
  if (companyType === 'general_contractor') return '현장관리자'
  if (companyType === 'consultant') return '감독관'
  if (tradeTypes && tradeTypes.length > 0) {
    const majorTrades = ['구조', '건축', '토목', '기계', '전기']
    const hasMajorTrade = tradeTypes.some(trade => majorTrades.some(major => trade.includes(major)))
    return hasMajorTrade ? '현장관리자' : '작업자'
  }
  return '작업자'
}

function determineWorkDescription(tradeTypes: string[] | null, siteName: string): string {
  if (!tradeTypes || tradeTypes.length === 0) {
    return '건설 작업'
  }

  const primaryTrade = tradeTypes[0]
  const floor = Math.floor(Math.random() * 5) + 1

  const tradeDescriptions: { [key: string]: string } = {
    구조: `구조체 시공 • ${floor}층`,
    건축: `건축 마감 • ${floor}층`,
    토목: `토목 공사 • 지하 ${floor}층`,
    기계: `기계설비 설치 • ${floor}층`,
    전기: `전기설비 공사 • ${floor}층`,
    배관: `배관 설치 • ${floor}층`,
    철골: `철골 조립 • 지상 ${floor}층`,
    콘크리트: `콘크리트 타설 • ${floor}층`,
  }

  for (const [key, description] of Object.entries(tradeDescriptions)) {
    if (primaryTrade.includes(key)) {
      return description
    }
  }

  return `${primaryTrade} • ${floor}층`
}

function formatPeriod(startDate?: string | null, endDate?: string | null): string {
  const format = (value: string) => new Date(value).toISOString().split('T')[0]

  if (!startDate && !endDate) {
    return '-'
  }

  if (!startDate && endDate) {
    return `~ ${format(endDate)}`
  }

  const start = format(startDate as string)
  if (!endDate) {
    return start
  }

  return `${start} ~ ${format(endDate)}`
}

function mapContractStatus(contractStatus: string, siteStatus: string | null): string {
  if (contractStatus === 'completed' || siteStatus === 'completed') return '완료'
  if (contractStatus === 'terminated' || contractStatus === 'suspended') return '중지'
  if (contractStatus === 'active' && (siteStatus === 'active' || siteStatus === 'in_progress'))
    return '진행중'
  return contractStatus || '대기중'
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
    if (parsed && typeof parsed === 'object') {
      const candidate = 'meta' in parsed ? parsed.meta : parsed
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
    console.warn('Failed to parse contract metadata from notes:', { value, error })
  }

  return {}
}
