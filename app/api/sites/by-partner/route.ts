import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const dynamic = 'force-dynamic'

/**
 * GET /api/sites/by-partner?partner_company_id=...
 * Returns raw array of sites for the given partner company id.
 * Strategy: partner_companies.id -> company_name -> organizations.name match -> sites by organization_id
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()
    const { searchParams } = new URL(request.url)
    const partnerId = (searchParams.get('partner_company_id') || '').trim()
    if (!partnerId) return NextResponse.json([])

    // 1) Resolve company_name from partner_companies
    const { data: pc, error: pcErr } = await supabase
      .from('partner_companies')
      .select('company_name')
      .eq('id', partnerId)
      .maybeSingle()

    if (pcErr || !pc?.company_name) return NextResponse.json([])

    const name = String(pc.company_name).trim()
    // 2) Resolve organization by name (strict or ilike)
    const { data: orgStrict } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('name', name)
    let orgIds: string[] = Array.isArray(orgStrict) ? orgStrict.map(r => String((r as any).id)) : []
    if (orgIds.length === 0) {
      const { data: orgLike } = await supabase
        .from('organizations')
        .select('id, name')
        .ilike('name', name)
      orgIds = Array.isArray(orgLike) ? orgLike.map(r => String((r as any).id)) : []
    }

    if (orgIds.length === 0) return NextResponse.json([])

    // 3) Fetch sites for these organizations
    const { data: sites, error: sitesErr } = await supabase
      .from('sites')
      .select('id, name, organization_id')
      .in('organization_id', orgIds)
      .order('name', { ascending: true })

    if (sitesErr) return NextResponse.json([])
    return NextResponse.json(sites || [])
  } catch (e) {
    return NextResponse.json([])
  }
}

