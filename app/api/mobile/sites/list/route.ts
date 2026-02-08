import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { withOrganizationMeta } from '@/lib/sites/site-response'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const sessionClient = createClient()
    let serviceClient
    try {
      serviceClient = createServiceRoleClient()
    } catch {
      // Fallback to session client if service role is not configured (dev env)
      serviceClient = sessionClient
    }

    const { data: profile, error: profileError } = await sessionClient
      .from('profiles')
      .select('site_id, organization_id, partner_company_id, role')
      .eq('id', authResult.userId)
      .single()

    if (profileError || !profile) {
      console.error('[mobile/sites/list] profile lookup error:', profileError)
      return NextResponse.json({ success: true, data: [] })
    }

    const role = (authResult.role || profile.role || '').trim()
    const partnerCompanyId: string | null =
      (profile as any).partner_company_id ||
      (profile as any).organization_id ||
      authResult.restrictedOrgId ||
      null

    // Partner user: resolve organization-aligned site list
    if (role === 'customer_manager') {
      // Build possible organization ids (aligns with admin org detail)
      const orgIds = new Set<string>()
      if (profile.organization_id) orgIds.add(String(profile.organization_id))
      if (profile.partner_company_id) orgIds.add(String(profile.partner_company_id))
      if (authResult.restrictedOrgId) orgIds.add(String(authResult.restrictedOrgId))

      // If we only have partner_company_id and it isn't an organization id, map via company name -> organizations
      if (orgIds.size === 0 && profile.partner_company_id) {
        try {
          const { data: pc } = await serviceClient
            .from('partner_companies')
            .select('company_name')
            .eq('id', profile.partner_company_id)
            .maybeSingle()
          const name = pc?.company_name?.trim()
          if (name) {
            const { data: orgStrict } = await serviceClient
              .from('organizations')
              .select('id, name')
              .eq('name', name)
            const { data: orgLike } =
              !orgStrict || orgStrict.length === 0
                ? await serviceClient.from('organizations').select('id, name').ilike('name', name)
                : { data: [] as any }
            ;[...(orgStrict || []), ...(orgLike || [])].forEach((o: any) => {
              if (o?.id) orgIds.add(String(o.id))
            })
          }
        } catch (err) {
          console.error('[mobile/sites/list] partner->org mapping failed:', err)
        }
      }

      const sites: Array<{
        id: string
        name: string
        status?: string
        address?: string | null
        organization_id?: string | null
        manager_name?: string | null
        safety_manager_name?: string | null
      }> = []
      const pushSite = (row: any) => {
        if (!row?.id || row.is_deleted) return
        const id = String(row.id)
        if (sites.some(s => s.id === id)) return
        sites.push({
          id,
          name: row.name || '현장',
          status: row.status,
          address: row.address ?? null,
          organization_id: row.organization_id ?? null,
          manager_name: row.manager_name ?? null,
          safety_manager_name: row.safety_manager_name ?? null,
        })
      }

      // 1) Primary: organization-based (matches admin org detail)
      if (orgIds.size > 0) {
        const { data: orgSites, error: orgError } = await serviceClient
          .from('sites')
          .select('id, name, status, address, organization_id, manager_name, safety_manager_name')
          .in('organization_id', Array.from(orgIds))
          .eq('is_deleted', false)
          .order('name', { ascending: true })
        if (orgError) {
          console.error('[mobile/sites/list] org site query error:', orgError)
        } else {
          ;(orgSites || []).forEach(pushSite)
        }
      }

      // 2) partner_site_mappings with joined sites (active only)
      const { data: mappings, error: mappingError } = await serviceClient
        .from('partner_site_mappings')
        .select(
          `
          site_id, 
          is_active, 
          sites(id, name, status, address, organization_id, manager_name, safety_manager_name, is_deleted)
        `
        )
        .eq(
          'partner_company_id',
          partnerCompanyId || authResult.restrictedOrgId || profile.organization_id || ''
        )
        .eq('is_active', true)
        .order('site_id', { ascending: true })

      if (mappingError) {
        console.error('[mobile/sites/list] partner_site_mappings error:', mappingError)
      } else if (Array.isArray(mappings)) {
        mappings.forEach(row => {
          if ((row as any)?.sites) pushSite((row as any).sites)
        })
      }

      // 3) Legacy fallback: site_partners (optional)
      const legacyFallbackEnabled = process.env.ENABLE_SITE_PARTNERS_FALLBACK === 'true'
      if (legacyFallbackEnabled) {
        const { data: legacyRows, error: legacyError } = await serviceClient
          .from('site_partners')
          .select(
            'site_id, sites(id, name, status, address, organization_id, manager_name, safety_manager_name, is_deleted)'
          )
          .eq(
            'partner_company_id',
            partnerCompanyId || authResult.restrictedOrgId || profile.organization_id || ''
          )

        if (legacyError) {
          console.error('[mobile/sites/list] site_partners fallback error:', legacyError)
        } else if (Array.isArray(legacyRows)) {
          legacyRows.forEach(row => {
            if ((row as any)?.sites) pushSite((row as any).sites)
          })
        }
      }

      let sitesWithMeta = sites
      try {
        sitesWithMeta = await withOrganizationMeta(serviceClient, sites)
      } catch (err) {
        console.error('[mobile/sites/list] organization metadata error:', err)
      }

      // Final: only return what we gathered (no additional fallbacks)
      sitesWithMeta.sort((a, b) => a.name.localeCompare(b.name, 'ko-KR'))
      return NextResponse.json({ success: true, data: sitesWithMeta })
    }

    // Other roles: basic visibility
    let query = serviceClient
      .from('sites')
      .select('id, name, status, address, organization_id, manager_name, safety_manager_name')
      .eq('is_deleted', false)
      .order('name', { ascending: true })

    if (authResult.role === 'worker') {
      if (!profile.site_id) {
        return NextResponse.json({ success: true, data: [] })
      }
      query = query.eq('id', profile.site_id)
    } else if (authResult.role === 'site_manager') {
      // 현장관리자는 전체 목록을 노출 (추가 필터 없음)
    } else if (authResult.isRestricted) {
      if (!partnerCompanyId) {
        return NextResponse.json({ success: true, data: [] })
      }
      query = query.eq('organization_id', partnerCompanyId)
    }

    const { data, error } = await query.limit(500)

    if (error) {
      console.error('[mobile/sites/list] query error:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch sites' }, { status: 500 })
    }

    let sites = (data ?? []).map(site => ({
      id: site.id,
      name: site.name ?? '이름 없음',
      status: site.status,
      address: (site as any).address ?? null,
      organization_id: site.organization_id,
      manager_name: (site as any).manager_name ?? null,
      safety_manager_name: (site as any).safety_manager_name ?? null,
    }))

    try {
      sites = await withOrganizationMeta(serviceClient, sites)
    } catch (err) {
      console.error('[mobile/sites/list] organization metadata error:', err)
    }

    return NextResponse.json({ success: true, data: sites })
  } catch (error) {
    console.error('[mobile/sites/list] unexpected error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
