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

    const { data: assignments, error } = await supabase
      .from('site_assignments')
      .select(
        `
        *,
        profile:profiles(*)
      `
      )
      .eq('site_id', siteId)
      .eq('is_active', true)

    if (error) {
      console.error('[partner/sites/:id/assignments] query error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch assignments' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: assignments || [] })
  } catch (error) {
    console.error('[partner/sites/:id/assignments] error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
