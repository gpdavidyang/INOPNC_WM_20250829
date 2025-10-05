import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createClient } from '@/lib/supabase/server'
import { updateSiteStatus } from '@/app/actions/admin/sites'
import type { SiteStatus } from '@/types'

export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest) {
  const auth = await requireApiAuth()
  if (auth instanceof NextResponse) return auth

  const supabase = createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', auth.userId)
    .maybeSingle()

  if (!profile || !['admin', 'system_admin'].includes((profile as any).role || '')) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const siteIds: unknown = body?.siteIds
  const status: unknown = body?.status

  if (
    !Array.isArray(siteIds) ||
    siteIds.length === 0 ||
    siteIds.some(id => typeof id !== 'string')
  ) {
    return NextResponse.json({ success: false, error: 'Invalid siteIds' }, { status: 400 })
  }
  if (!['active', 'inactive', 'completed'].includes(String(status))) {
    return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 })
  }

  const result = await updateSiteStatus(siteIds as string[], status as SiteStatus)
  return NextResponse.json(result, { status: result.success ? 200 : 400 })
}
