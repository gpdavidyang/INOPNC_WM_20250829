import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import type { SiteSearchResult } from '@/types/site-info'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/sites/search
 * Search sites with Korean language support
 * Query parameters:
 * - siteName: string (optional) - Site name to search
 * - workerName: string (optional) - Worker name to search
 * - startDate: string (optional) - Construction start date filter
 * - endDate: string (optional) - Construction end date filter
 * - limit: number (optional) - Max results (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = await createClient()

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const siteName = searchParams.get('siteName') || ''
    const workerName = searchParams.get('workerName') || ''
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    // Determine partner access if applicable
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, partner_company_id, organization_id')
      .eq('id', authResult.userId)
      .single()

    const isPartner = ['customer_manager', 'partner'].includes(profile?.role || '')
    const orgId = profile?.organization_id || null
    let allowedSiteIds: string[] = []

    if (isPartner) {
      const partnerCompanyId: string | null =
        (profile as any)?.partner_company_id || profile?.organization_id || null
      if (partnerCompanyId) {
        const { data: mappings, error: mapErr } = await supabase
          .from('partner_site_mappings')
          .select('site_id')
          .eq('partner_company_id', partnerCompanyId)
        if (!mapErr && mappings) {
          allowedSiteIds = mappings.map((m: any) => m.site_id).filter(Boolean)
        }
        const legacyFallbackEnabled = process.env.ENABLE_SITE_PARTNERS_FALLBACK === 'true'
        if ((mapErr || allowedSiteIds.length === 0) && legacyFallbackEnabled) {
          const { data: legacyRows } = await supabase
            .from('site_partners')
            .select('site_id')
            .eq('partner_company_id', partnerCompanyId)
          allowedSiteIds = (legacyRows || []).map((r: any) => r.site_id).filter(Boolean)
        }
      }
    }

    // Start building query
    let query = supabase.from('sites').select(
      `
        id,
        name,
        address,
        start_date,
        end_date,
        status,
        organization_id
      `
    )
    // Note: status filter applied later for non-partner

    if (isPartner) {
      const ors: string[] = []
      if (orgId) ors.push(`organization_id.eq.${orgId}`)
      if (allowedSiteIds.length) {
        const ids = allowedSiteIds.map(id => `"${id}"`).join(',')
        ors.push(`id.in.(${ids})`)
      }
      if (!ors.length) {
        return NextResponse.json({ data: [], total: 0 })
      }
      query = query.or(ors.join(','))
    } else {
      query = query.eq('status', 'active')
    }

    // Apply site name filter (case-insensitive)
    if (siteName) {
      query = query.ilike('name', `%${siteName}%`)
    }

    // Apply date range filter if both dates provided
    if (startDate && endDate) {
      query = query.gte('start_date', startDate).lte('end_date', endDate)
    }

    // Limit results
    query = query.limit(Math.min(limit, 100)) // Cap at 100

    const { data: sites, error: searchError } = await query

    if (searchError) {
      throw searchError
    }

    // Calculate construction progress
    const calculateProgress = (startDate: string, endDate: string): number => {
      const start = new Date(startDate).getTime()
      const end = new Date(endDate).getTime()
      const now = new Date().getTime()

      if (now < start) return 0
      if (now > end) return 100

      const total = end - start
      const elapsed = now - start
      return Math.round((elapsed / total) * 100)
    }

    // Format results
    const results: SiteSearchResult[] = (sites || []).map((site: any) => {
      const startDate = site.start_date ?? null
      const endDate = site.end_date ?? null
      const lastWorkDate = endDate || startDate || null

      return {
        id: site.id,
        name: site.name,
        address: site.address || '주소 정보 없음',
        construction_period: {
          start_date: startDate,
          end_date: endDate,
        },
        last_work_date: lastWorkDate,
        customer_company_name: null,
        progress_percentage: calculateProgress(
          startDate || new Date().toISOString(),
          endDate || new Date().toISOString()
        ),
        participant_count: 0, // TODO: Get actual count from site_assignments
        is_active: site.status === 'active',
      }
    })

    // Sort by name for Korean language support
    results.sort((a, b) => a.name.localeCompare(b.name, 'ko'))

    return NextResponse.json({
      data: results,
      total: results.length,
    })
  } catch (error) {
    console.error('Error searching sites:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
