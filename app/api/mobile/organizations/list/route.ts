import { NextResponse } from 'next/server'
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

export async function GET() {
  const authResult = await requireApiAuth()
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const role = authResult.role ?? ''
  if (!ALLOWED_ROLES.has(role)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  let supabase
  try {
    supabase = createServiceRoleClient()
  } catch {
    supabase = createClient()
  }

  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name, is_active')
      .order('name', { ascending: true })

    if (error) {
      console.error('[mobile/organizations/list] query error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch organizations' },
        { status: 500 }
      )
    }

    const organizations =
      data?.filter(org => org?.is_active !== false).map(org => ({
        id: org.id,
        name: org.name ?? '이름 없음',
      })) ?? []

    return NextResponse.json({ success: true, data: organizations })
  } catch (error) {
    console.error('[mobile/organizations/list] unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
