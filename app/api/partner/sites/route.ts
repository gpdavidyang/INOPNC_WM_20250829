import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import type { SiteStatus } from '@/types'

export const dynamic = 'force-dynamic'

/**
 * GET /api/partner/sites
 * Query params: page, limit, search, status
 * Returns sites assigned to the logged-in partner company, with pagination.
 * Response shape mirrors /api/admin/sites for reuse in UI components.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const supabase = createClient()

    // Ensure user is a partner role with org mapping
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, partner_company_id, organization_id')
      .eq('id', auth.userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 })
    }

    if (!['customer_manager', 'partner'].includes(profile.role || '')) {
      return NextResponse.json(
        { success: false, error: 'Partner access required' },
        { status: 403 }
      )
    }

    const partnerCompanyId: string | null =
      (profile as any).partner_company_id || profile.organization_id || null
    if (!partnerCompanyId) {
      return NextResponse.json({ success: true, data: { sites: [], total: 0, pages: 0 } })
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get('page') || '1', 10)
    const limit = Number.parseInt(searchParams.get('limit') || '10', 10)
    const search = (searchParams.get('search') || '').trim()
    const statusParam = (searchParams.get('status') || '') as SiteStatus | ''
    const sort = searchParams.get('sort') || 'created_at'
    const direction = (searchParams.get('direction') || 'desc') as 'asc' | 'desc'

    const pageNumber = Number.isFinite(page) && page > 0 ? page : 1
    const limitNumber = Number.isFinite(limit) && limit > 0 ? limit : 10
    const siteStatus =
      statusParam && statusParam !== 'all' ? (statusParam as SiteStatus) : undefined

    // 1) Fetch allowed site IDs via partner_site_mappings; fallback to site_partners when enabled
    const legacyFallbackEnabled = process.env.ENABLE_SITE_PARTNERS_FALLBACK === 'true'

    const allowedSiteIds = new Set<string>()

    const { data: mappings, error: mappingError } = await supabase
      .from('partner_site_mappings')
      .select('site_id, is_active')
      .eq('partner_company_id', partnerCompanyId)

    if (!mappingError) {
      ;(mappings || []).forEach(row => {
        if (row?.site_id) {
          // Prefer active mappings; but allow any mapping to fetch the site; filtering by status happens below
          allowedSiteIds.add(row.site_id)
        }
      })
    }

    if ((mappingError || allowedSiteIds.size === 0) && legacyFallbackEnabled) {
      const { data: legacyRows, error: legacyError } = await supabase
        .from('site_partners')
        .select('site_id')
        .eq('partner_company_id', partnerCompanyId)

      if (!legacyError) {
        ;(legacyRows || []).forEach(row => {
          if (row?.site_id) allowedSiteIds.add(row.site_id)
        })
      }
    }

    if (allowedSiteIds.size === 0) {
      return NextResponse.json({ success: true, data: { sites: [], total: 0, pages: 0 } })
    }

    // 2) Query sites with filters and pagination
    let query = supabase
      .from('sites')
      .select(
        `
        id,
        name,
        address,
        status,
        start_date,
        end_date,
        manager_name,
        manager_phone,
        created_at,
        updated_at
      `,
        { count: 'exact' }
      )
      .in('id', Array.from(allowedSiteIds))
      .order(sort, { ascending: direction === 'asc' })

    if (search) {
      query = query.or(`name.ilike.%${search}%,address.ilike.%${search}%`)
    }

    if (siteStatus) {
      query = query.eq('status', siteStatus)
    }

    const offset = (pageNumber - 1) * limitNumber
    query = query.range(offset, offset + limitNumber - 1)

    const { data: sites, error: sitesError, count } = await query

    if (sitesError) {
      console.error('[partner/sites] sites query error:', sitesError)
      return NextResponse.json({ success: false, error: 'Failed to fetch sites' }, { status: 500 })
    }

    const totalPages = Math.ceil((count || 0) / limitNumber)

    return NextResponse.json({
      success: true,
      data: {
        sites: (sites || []).map((s: any) => ({
          ...s,
          manager_phone: s.manager_phone ?? s.construction_manager_phone ?? null,
        })),
        total: count || 0,
        pages: totalPages || 1,
      },
    })
  } catch (error) {
    console.error('[partner/sites] error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
