import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { createClient } from '@/lib/supabase/server'
import { withOrganizationMeta } from '@/lib/sites/site-response'

export const dynamic = 'force-dynamic'

const ALLOWED_ROLES = new Set([
  'worker',
  'site_manager',
  'customer_manager',
  'admin',
  'system_admin',
])

export async function GET(_request: NextRequest, context: { params: { siteId: string } }) {
  const authResult = await requireApiAuth()
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const role = authResult.role ?? ''
  if (!ALLOWED_ROLES.has(role)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const siteId = (context.params?.siteId || '').trim()
  if (!siteId) {
    return NextResponse.json({ success: false, error: 'Site ID is required' }, { status: 400 })
  }

  let supabase
  try {
    supabase = createServiceRoleClient()
  } catch {
    supabase = createClient()
  }

  try {
    const { data, error } = await supabase
      .from('sites')
      .select('id, name, status, organization_id')
      .eq('id', siteId)
      .maybeSingle()

    if (error || !data) {
      return NextResponse.json({ success: false, error: 'Site not found' }, { status: 404 })
    }

    const [siteWithMeta] = await withOrganizationMeta(supabase, [
      {
        id: data.id,
        name: data.name ?? '현장',
        status: data.status,
        organization_id: data.organization_id ?? null,
      },
    ])

    return NextResponse.json({ success: true, data: siteWithMeta })
  } catch (err) {
    console.error('[mobile/sites/:siteId] unexpected error:', err)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch site information' },
      { status: 500 }
    )
  }
}
