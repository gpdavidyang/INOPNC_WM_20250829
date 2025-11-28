import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

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

    let query = serviceClient
      .from('sites')
      .select('id, name, status, organization_id')
      .order('name', { ascending: true })

    if (authResult.role === 'worker' || authResult.role === 'site_manager') {
      if (!profile.site_id) {
        return NextResponse.json({ success: true, data: [] })
      }
      query = query.eq('id', profile.site_id)
    } else if (authResult.isRestricted) {
      const orgId =
        profile.partner_company_id || profile.organization_id || authResult.restrictedOrgId
      if (!orgId) {
        return NextResponse.json({ success: true, data: [] })
      }
      query = query.eq('organization_id', orgId)
    }

    const { data, error } = await query

    if (error) {
      console.error('[mobile/sites/list] query error:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch sites' }, { status: 500 })
    }

    const sites = (data ?? []).map(site => ({
      id: site.id,
      name: site.name ?? '이름 없음',
      status: site.status,
      organization_id: site.organization_id,
    }))

    return NextResponse.json({ success: true, data: sites })
  } catch (error) {
    console.error('[mobile/sites/list] unexpected error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
