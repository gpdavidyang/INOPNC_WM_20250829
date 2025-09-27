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
    const legacyFallbackEnabled = process.env.ENABLE_SITE_PARTNERS_FALLBACK === 'true'
    const legacyInactiveStatuses = new Set(['terminated', 'inactive', 'suspended', 'cancelled'])
    const queryErrors: Array<{ source: string; message: string; code: string | null }> = []

    // 1) partner_site_mappings 기반 조회 (기본 경로)
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
      queryErrors.push({
        source: 'partner_site_mappings',
        message: mappingError.message,
        code: mappingError.code ?? null,
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

    // 2) 필요 시 site_partners 테이블 기반 조회 (선택적 폴백)
    if ((mappingError || siteMap.size === 0) && legacyFallbackEnabled) {
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
        console.warn('site_partners fallback lookup failed:', {
          message: sitePartnersError.message,
          code: sitePartnersError.code,
        })
        queryErrors.push({
          source: 'site_partners',
          message: sitePartnersError.message,
          code: sitePartnersError.code ?? null,
        })
      } else {
        sitePartnersData
          ?.filter(row => row.sites)
          .forEach(row => {
            if (row.contract_status && legacyInactiveStatuses.has(row.contract_status)) {
              return
            }

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
    }

    if (!siteMap.size && queryErrors.length) {
      return NextResponse.json(
        {
          error: 'Failed to fetch sites',
          details: queryErrors,
        },
        { status: 500 }
      )
    }

    const sites = Array.from(siteMap.values()).sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json(sites)
  } catch (error) {
    console.error('Error in sites by partner API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
