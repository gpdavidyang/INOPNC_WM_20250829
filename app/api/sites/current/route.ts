import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import type { SiteInfo } from '@/types/site-info'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/sites/current
 * Returns the current site for the authenticated user
 */
export async function GET(_request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const supabase = createClient()

    // 1) 현재 활성 배정 조회 (관계 조인 없이 site_id만)
    const { data: assignment, error: assignmentError } = await supabase
      .from('site_assignments')
      .select('site_id')
      .eq('user_id', auth.userId)
      .eq('is_active', true)
      .order('assigned_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (assignmentError) {
      console.error('[sites/current] assignment error:', assignmentError)
      return NextResponse.json({ error: 'Assignment fetch failed' }, { status: 500 })
    }

    let siteId: string | null = assignment?.site_id || null

    // 파트너 사용자(customer_manager/partner)인 경우 배정이 없어도 파트너 매핑으로 대표 현장 결정
    if (!siteId) {
      const { data: me, error: meError } = await supabase
        .from('profiles')
        .select('role, partner_company_id, organization_id')
        .eq('id', auth.userId)
        .single()

      if (meError) {
        console.error('[sites/current] profile fetch error:', meError)
        return NextResponse.json({ error: 'Profile fetch failed' }, { status: 500 })
      }

      const role = me?.role || ''
      if (['customer_manager', 'partner'].includes(role)) {
        const partnerCompanyId: string | null =
          (me as any)?.partner_company_id || me?.organization_id || null
        if (partnerCompanyId) {
          // 우선 partner_site_mappings 조회 (활성 우선)
          const { data: mappings, error: mapErr } = await supabase
            .from('partner_site_mappings')
            .select('site_id, start_date, end_date, is_active')
            .eq('partner_company_id', partnerCompanyId)
            .order('start_date', { ascending: false })
            .limit(1)

          if (!mapErr && mappings && mappings.length > 0) {
            siteId = mappings[0].site_id
          } else {
            const legacyFallbackEnabled = process.env.ENABLE_SITE_PARTNERS_FALLBACK === 'true'
            if (legacyFallbackEnabled) {
              const { data: legacyRows } = await supabase
                .from('site_partners')
                .select('site_id, assigned_date')
                .eq('partner_company_id', partnerCompanyId)
                .order('assigned_date', { ascending: false })
                .limit(1)
              if (legacyRows && legacyRows.length > 0) {
                siteId = legacyRows[0].site_id
              }
            }
          }
        }
      }
    }

    if (!siteId) {
      return NextResponse.json({ error: 'No site found for user' }, { status: 404 })
    }

    // 2) 현장 상세 정보 조회 (단일 쿼리, 조인 없음)
    const baseColumns = [
      'id',
      'name',
      'address',
      'accommodation_name',
      'accommodation_address',
      // manager/safety names and phones
      'manager_name',
      'construction_manager_phone',
      'safety_manager_name',
      'safety_manager_phone',
      // dates/status
      'start_date',
      'end_date',
      'status',
    ].join(', ')

    const preferColumns = `${baseColumns}, customer_company_id, organization_id`

    const fetchSite = async (columns: string) =>
      supabase
        .from('sites')
        .select(columns)
        .eq('id', siteId as string)
        .maybeSingle()

    let { data: site, error: siteError } = await fetchSite(preferColumns)

    if (siteError) {
      const message = siteError.message?.toLowerCase() ?? ''

      if (message.includes('customer_company_id')) {
        const retry = await fetchSite(`${baseColumns}, organization_id`)
        site = retry.data
        siteError = retry.error
      }

      if (siteError) {
        const fallback = await fetchSite(baseColumns)
        site = fallback.data
        siteError = fallback.error
      }
    }

    if (siteError) {
      console.error('[sites/current] site error:', siteError)
      return NextResponse.json({ error: 'Site fetch failed' }, { status: 500 })
    }
    if (!site) {
      return NextResponse.json({ error: 'No site found' }, { status: 404 })
    }

    // 3) 최신 작업일지로 공정/구간 간단 정보
    const { data: latestReport } = await supabase
      .from('daily_reports')
      .select('member_name, work_process, work_section')
      .eq('site_id', site.id)
      .order('work_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    const processInfo = latestReport
      ? {
          member_name: (latestReport as any).member_name || '미정',
          work_process: (latestReport as any).work_process || '미정',
          work_section: (latestReport as any).work_section || '미정',
          drawing_id: undefined,
        }
      : {
          member_name: '미정',
          work_process: '미정',
          work_section: '미정',
          drawing_id: undefined,
        }

    const managers = [] as Array<{
      role: 'construction_manager' | 'safety_manager'
      name: string
      phone: string
    }>
    // Include if either name or phone exists; prefer DB-provided names
    if ((site as any).manager_name || (site as any).construction_manager_phone) {
      managers.push({
        role: 'construction_manager',
        name: (site as any).manager_name || '미지정',
        phone: (site as any).construction_manager_phone || '',
      })
    }
    if ((site as any).safety_manager_name || (site as any).safety_manager_phone) {
      managers.push({
        role: 'safety_manager',
        name: (site as any).safety_manager_name || '미지정',
        phone: (site as any).safety_manager_phone || '',
      })
    }

    let customerCompany: { id: string; company_name?: string | null } | undefined

    const customerCompanyId = (site as Record<string, unknown>).customer_company_id as
      | string
      | null
      | undefined
    const organizationId = (site as Record<string, unknown>).organization_id as
      | string
      | null
      | undefined

    if (customerCompanyId) {
      const { data: company, error: companyError } = await supabase
        .from('customer_companies')
        .select('id, company_name')
        .eq('id', customerCompanyId)
        .maybeSingle()

      if (companyError) {
        console.error('[sites/current] customer company error:', companyError)
      } else if (company) {
        customerCompany = {
          id: company.id,
          company_name: (company as any).company_name ?? null,
        }
      }
    }

    if (!customerCompany && organizationId) {
      const { data: organization, error: organizationError } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('id', organizationId)
        .maybeSingle()

      if (organizationError) {
        console.error('[sites/current] organization fallback error:', organizationError)
      } else if (organization) {
        customerCompany = {
          id: organization.id,
          company_name: (organization as any).name ?? null,
        }
      }
    }

    const siteData: SiteInfo = {
      id: site.id,
      name: site.name,
      address: {
        id: site.id,
        site_id: site.id,
        full_address: site.address || '주소 정보 없음',
        latitude: undefined,
        longitude: undefined,
        postal_code: undefined,
      },
      customer_company: customerCompany,
      accommodation: site.accommodation_address
        ? {
            id: site.id,
            site_id: site.id,
            accommodation_name: site.accommodation_name || '숙소',
            full_address: site.accommodation_address,
            latitude: undefined,
            longitude: undefined,
          }
        : undefined,
      process: processInfo,
      managers,
      construction_period: { start_date: site.start_date, end_date: site.end_date },
      is_active: site.status === 'active',
    }

    return NextResponse.json({ data: siteData })
  } catch (error) {
    console.error('Error fetching current site:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
