import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'

interface SiteRecord {
  id: string
  name: string
  address?: string | null
  status?: string | null
  organization_id?: string | null
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = createClient()

    // URL 파라미터에서 partner_company_id 가져오기
    const { searchParams } = new URL(request.url)
    const partnerCompanyId = searchParams.get('partner_company_id')

    if (!partnerCompanyId) {
      return NextResponse.json({ error: 'Partner company ID is required' }, { status: 400 })
    }

    const siteMap = new Map<string, SiteRecord>()

    // 1) site_partners 테이블 기반 조회 (신규 구조)
    const { data: sitePartnersData, error: sitePartnersError } = await supabase
      .from('site_partners')
      .select(
        `
        site_id,
        contract_status,
        sites:sites!inner(
          id,
          name,
          address,
          status,
          organization_id
        )
      `
      )
      .eq('partner_company_id', partnerCompanyId)

    if (sitePartnersError) {
      console.warn('site_partners lookup failed, falling back to partner_site_mappings:', {
        message: sitePartnersError.message,
        code: sitePartnersError.code,
      })
    } else {
      sitePartnersData
        ?.filter(row => row.sites)
        .forEach(row => {
          const inactiveStatuses = new Set(['terminated', 'inactive', 'suspended', 'cancelled'])
          if (row.contract_status && inactiveStatuses.has(row.contract_status)) {
            return
          }

          const site = row.sites
          if (site?.id) {
            siteMap.set(site.id, {
              id: site.id,
              name: site.name,
              address: site.address ?? null,
              status: site.status ?? null,
              organization_id: site.organization_id ?? null,
            })
          }
        })
    }

    // 2) 기존 partner_site_mappings 기반 조회 (레거시 데이터 호환)
    const { data: mappingData, error: mappingError } = await supabase
      .from('partner_site_mappings')
      .select(
        `
        site_id,
        is_active,
        sites:sites!inner(
          id,
          name,
          address,
          status,
          organization_id
        )
      `
      )
      .eq('partner_company_id', partnerCompanyId)

    if (mappingError) {
      console.warn('partner_site_mappings lookup failed:', {
        message: mappingError.message,
        code: mappingError.code,
      })
    } else {
      mappingData
        ?.filter(row => row.is_active && row.sites)
        .forEach(row => {
          const site = row.sites
          if (site?.id && !siteMap.has(site.id)) {
            siteMap.set(site.id, {
              id: site.id,
              name: site.name,
              address: site.address ?? null,
              status: site.status ?? null,
              organization_id: site.organization_id ?? null,
            })
          }
        })
    }

    if (!siteMap.size && sitePartnersError && mappingError) {
      return NextResponse.json({ error: 'Failed to fetch sites' }, { status: 500 })
    }

    const sites = Array.from(siteMap.values()).sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json(sites)
  } catch (error) {
    console.error('Error in sites by partner API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
