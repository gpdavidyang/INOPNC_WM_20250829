import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createClient } from '@/lib/supabase/server'
import { deleteSites } from '@/app/actions/admin/sites'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
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
  if (!Array.isArray(siteIds) || siteIds.some(id => typeof id !== 'string' || !id)) {
    return NextResponse.json({ success: false, error: 'Invalid siteIds' }, { status: 400 })
  }

  const result = await deleteSites(siteIds as string[])
  return NextResponse.json(result, { status: result.success ? 200 : 400 })
}
