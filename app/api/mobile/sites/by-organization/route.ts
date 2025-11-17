import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const ALLOWED_ROLES = new Set([
  'worker',
  'site_manager',
  'customer_manager',
  'admin',
  'system_admin',
])

export async function GET(request: NextRequest) {
  const authResult = await requireApiAuth()
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const role = authResult.role ?? ''
  if (!ALLOWED_ROLES.has(role)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const organizationId = (searchParams.get('organization_id') || '').trim()
  if (!organizationId) {
    return NextResponse.json({ success: true, data: [] })
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
      .select('id, name, organization_id')
      .eq('organization_id', organizationId)
      .order('name', { ascending: true })

    if (error) {
      console.error('[mobile/sites/by-organization] query error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch sites' },
        { status: 500 }
      )
    }

    const sites =
      data?.map(site => ({
        id: site.id,
        name: site.name ?? '이름 없음',
        organization_id: site.organization_id ?? null,
      })) ?? []

    return NextResponse.json({ success: true, data: sites })
  } catch (error) {
    console.error('[mobile/sites/by-organization] unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
