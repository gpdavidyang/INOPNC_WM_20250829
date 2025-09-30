import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'

/**
 * GET /api/partner/sites/[id]/assignments
 * Returns active assignments for the site, verifying the site is accessible by the partner.
 * Shape mirrors admin getSiteAssignments: { success, data: assignments[] }
 */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const siteId = params.id
    if (!siteId) {
      return NextResponse.json({ success: false, error: 'Site ID is required' }, { status: 400 })
    }

    const supabase = createClient()

    // Verify partner access to site via partner_site_mappings; allow admins
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, partner_company_id, organization_id')
      .eq('id', auth.userId)
      .single()

    const role = profile?.role || auth.role || ''

    if (!['admin', 'system_admin', 'site_manager'].includes(role)) {
      const partnerCompanyId: string | null =
        (profile as any)?.partner_company_id || profile?.organization_id || null
      if (!partnerCompanyId) {
        return NextResponse.json(
          { success: false, error: 'Partner access required' },
          { status: 403 }
        )
      }

      const { data: mapping } = await supabase
        .from('partner_site_mappings')
        .select('id')
        .eq('site_id', siteId)
        .eq('partner_company_id', partnerCompanyId)
        .limit(1)
        .maybeSingle()

      if (!mapping) {
        return NextResponse.json(
          { success: false, error: 'Access denied to this site' },
          { status: 403 }
        )
      }
    }

    // Fetch assignments first (avoid relying on PostgREST relationships)
    const { data: assigns, error: aErr } = await supabase
      .from('site_assignments')
      .select('*')
      .eq('site_id', siteId)
      .eq('is_active', true)

    if (aErr) {
      console.error('[partner/sites/:id/assignments] query error:', aErr)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch assignments' },
        { status: 500 }
      )
    }

    const userIds = Array.from(new Set((assigns || []).map((a: any) => a.user_id).filter(Boolean)))
    let profiles: any[] = []
    if (userIds.length > 0) {
      const { data: profs, error: pErr } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, organization_id')
        .in('id', userIds)
      if (pErr) {
        console.error('[partner/sites/:id/assignments] profiles query error:', pErr)
      } else {
        profiles = profs || []
      }
    }

    // Optional: map organization name
    const orgIds = Array.from(
      new Set(profiles.map(p => (p as any).organization_id).filter(Boolean))
    )
    const orgMap: Record<string, { id: string; name?: string | null }> = {}
    if (orgIds.length > 0) {
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name')
        .in('id', orgIds)
      for (const o of orgs || [])
        orgMap[(o as any).id] = { id: (o as any).id, name: (o as any).name }
    }

    const pMap = new Map<string, any>()
    for (const p of profiles) pMap.set((p as any).id, p)

    const enriched = (assigns || []).map(a => {
      const p = pMap.get((a as any).user_id)
      const orgId = p?.organization_id || null
      const org = orgId ? orgMap[orgId] : undefined
      return {
        ...a,
        profile: p
          ? { id: p.id, full_name: p.full_name, email: p.email, role: p.role, organization: org }
          : null,
      }
    })

    return NextResponse.json({ success: true, data: enriched })
  } catch (error) {
    console.error('[partner/sites/:id/assignments] error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
