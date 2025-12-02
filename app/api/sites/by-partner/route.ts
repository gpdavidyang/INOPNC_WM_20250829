import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const dynamic = 'force-dynamic'

/**
 * GET /api/sites/by-partner?partner_company_id=...
 * Returns raw array of sites for the given partner company id.
 * Strategy: partner_companies.id -> company_name -> organizations.name match -> sites by organization_id
 */
export async function GET(request: NextRequest) {
  try {
    let supabase
    try {
      supabase = createServiceRoleClient()
    } catch {
      // Fallback to session client when service role is unavailable (dev env)
      supabase = createClient()
    }
    const { searchParams } = new URL(request.url)
    const partnerId = (
      searchParams.get('partner_company_id') ||
      searchParams.get('organization_id') ||
      ''
    ).trim()
    if (!partnerId) return NextResponse.json([])

    const sites: Array<{ id: string; name: string; organization_id?: string | null }> = []
    const pushSite = (site: any) => {
      if (!site?.id) return
      const id = String(site.id)
      if (sites.some(s => s.id === id)) return
      sites.push({
        id,
        name: site.name || '현장',
        organization_id: site.organization_id ?? null,
      })
    }

    // 1) Prefer partner_site_mappings (activation-flag friendly)
    const { data: mappings, error: mappingError } = await supabase
      .from('partner_site_mappings')
      .select('site_id, is_active, sites(id, name, organization_id)')
      .eq('partner_company_id', partnerId)
      .order('is_active', { ascending: false })
      .order('site_id', { ascending: true })

    if (!mappingError && Array.isArray(mappings)) {
      mappings.forEach(row => {
        if ((row as any)?.sites) pushSite((row as any).sites)
      })
    }

    // 2) Legacy fallback: site_partners (optional env gate for compatibility)
    const legacyFallbackEnabled = process.env.ENABLE_SITE_PARTNERS_FALLBACK === 'true'
    if (sites.length === 0 && legacyFallbackEnabled) {
      const { data: legacyRows, error: legacyError } = await supabase
        .from('site_partners')
        .select('site_id, sites(id, name, organization_id)')
        .eq('partner_company_id', partnerId)

      if (!legacyError && Array.isArray(legacyRows)) {
        legacyRows.forEach(row => {
          if ((row as any)?.sites) pushSite((row as any).sites)
        })
      }
    }

    // 3) Fallback to name-based organization matching (legacy behavior) if still empty
    if (sites.length === 0) {
      const { data: pc, error: pcErr } = await supabase
        .from('partner_companies')
        .select('company_name')
        .eq('id', partnerId)
        .maybeSingle()

      if (!pcErr && pc?.company_name) {
        const name = String(pc.company_name).trim()
        const { data: orgStrict } = await supabase
          .from('organizations')
          .select('id, name')
          .eq('name', name)
        let orgIds: string[] = Array.isArray(orgStrict)
          ? orgStrict.map(r => String((r as any).id))
          : []
        if (orgIds.length === 0) {
          const { data: orgLike } = await supabase
            .from('organizations')
            .select('id, name')
            .ilike('name', name)
          orgIds = Array.isArray(orgLike) ? orgLike.map(r => String((r as any).id)) : []
        }

        if (orgIds.length > 0) {
          const { data: siteRows } = await supabase
            .from('sites')
            .select('id, name, organization_id')
            .in('organization_id', orgIds)
            .order('name', { ascending: true })

          ;(siteRows || []).forEach(pushSite)
        }
      }
    }

    return NextResponse.json(sites)
  } catch (e) {
    return NextResponse.json([])
  }
}
