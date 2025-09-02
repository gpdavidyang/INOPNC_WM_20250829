import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to check if they're associated with a partner company
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'all'
    const status = searchParams.get('status')

    // Get sites where this user's partner company is assigned
    let query = supabase
      .from('site_partners')
      .select(`
        id,
        site_id,
        partner_company_id,
        assigned_date,
        contract_status,
        contract_value,
        notes,
        sites!inner(
          id,
          name,
          address,
          status as site_status,
          start_date,
          end_date,
          created_at
        ),
        partner_companies!inner(
          id,
          company_name,
          company_type,
          trade_type
        )
      `)

    // Filter by user's organization if they're associated with a partner company
    if (profile.organization_id) {
      query = query.eq('partner_company_id', profile.organization_id)
    } else {
      // If no organization_id, return empty result for now
      // In the future, we might need to handle individual contractors differently
      return NextResponse.json({
        success: true,
        data: {
          participations: []
        },
        statistics: {
          total_sites: 0,
          active_sites: 0,
          completed_sites: 0
        }
      })
    }

    // Apply period filter
    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const recent3Months = new Date(now.getFullYear(), now.getMonth() - 3, 1)
    const recent6Months = new Date(now.getFullYear(), now.getMonth() - 6, 1)
    const recent12Months = new Date(now.getFullYear(), now.getMonth() - 12, 1)
    const recent24Months = new Date(now.getFullYear(), now.getMonth() - 24, 1)

    switch (period) {
      case 'current_month':
        query = query.gte('assigned_date', currentMonth.toISOString().split('T')[0])
        break
      case 'recent_3':
        query = query.gte('assigned_date', recent3Months.toISOString().split('T')[0])
        break
      case 'recent_6':
        query = query.gte('assigned_date', recent6Months.toISOString().split('T')[0])
        break
      case 'recent_12':
        query = query.gte('assigned_date', recent12Months.toISOString().split('T')[0])
        break
      case 'recent_24':
        query = query.gte('assigned_date', recent24Months.toISOString().split('T')[0])
        break
      case 'all':
      default:
        break
    }

    // Apply status filter
    if (status && status !== 'all') {
      query = query.eq('contract_status', status)
    }

    query = query.order('assigned_date', { ascending: false })

    const { data: participations, error } = await query

    if (error) {
      console.error('Participations query error:', error)
      return NextResponse.json({ error: 'Failed to fetch site participations' }, { status: 500 })
    }

    // Transform data for frontend consumption
    const transformedParticipations = (participations || []).map(p => ({
      id: p.sites.id,
      site_partner_id: p.id,
      name: p.sites.name,
      address: p.sites.address,
      role: determineRole(p.partner_companies.company_type, p.partner_companies.trade_type),
      work: determineWorkDescription(p.partner_companies.trade_type, p.sites.name),
      period: formatPeriod(p.assigned_date, p.sites.end_date),
      status: mapContractStatus(p.contract_status, p.sites.site_status),
      startDate: p.assigned_date,
      endDate: p.sites.end_date,
      contractValue: p.contract_value,
      contractStatus: p.contract_status,
      siteStatus: p.sites.site_status,
      companyType: p.partner_companies.company_type,
      tradeType: p.partner_companies.trade_type,
      notes: p.notes
    }))

    // Calculate statistics
    const totalSites = transformedParticipations.length
    const activeSites = transformedParticipations.filter(p => 
      p.contractStatus === 'active' && (p.siteStatus === 'active' || p.siteStatus === 'in_progress')
    ).length
    const completedSites = transformedParticipations.filter(p => 
      p.contractStatus === 'completed' || p.siteStatus === 'completed'
    ).length

    return NextResponse.json({
      success: true,
      data: {
        participations: transformedParticipations
      },
      statistics: {
        total_sites: totalSites,
        active_sites: activeSites,
        completed_sites: completedSites
      },
      filters: {
        period,
        status
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper functions
function determineRole(companyType: string, tradeTypes: string[] | null): string {
  if (companyType === 'general_contractor') return '현장관리자'
  if (companyType === 'consultant') return '감독관'
  if (tradeTypes && tradeTypes.length > 0) {
    const majorTrades = ['구조', '건축', '토목', '기계', '전기']
    const hasMajorTrade = tradeTypes.some(trade => 
      majorTrades.some(major => trade.includes(major))
    )
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
    '구조': `구조체 시공 • ${floor}층`,
    '건축': `건축 마감 • ${floor}층`, 
    '토목': `토목 공사 • 지하 ${floor}층`,
    '기계': `기계설비 설치 • ${floor}층`,
    '전기': `전기설비 공사 • ${floor}층`,
    '배관': `배관 설치 • ${floor}층`,
    '철골': `철골 조립 • 지상 ${floor}층`,
    '콘크리트': `콘크리트 타설 • ${floor}층`
  }
  
  for (const [key, description] of Object.entries(tradeDescriptions)) {
    if (primaryTrade.includes(key)) {
      return description
    }
  }
  
  return `${primaryTrade} • ${floor}층`
}

function formatPeriod(startDate: string, endDate: string | null): string {
  const start = new Date(startDate).toISOString().split('T')[0]
  if (!endDate) {
    return start
  }
  const end = new Date(endDate).toISOString().split('T')[0]
  return `${start} ~ ${end}`
}

function mapContractStatus(contractStatus: string, siteStatus: string | null): string {
  if (contractStatus === 'completed' || siteStatus === 'completed') return '완료'
  if (contractStatus === 'terminated' || contractStatus === 'suspended') return '중지'
  if (contractStatus === 'active' && (siteStatus === 'active' || siteStatus === 'in_progress')) return '진행중'
  return contractStatus || '대기중'
}