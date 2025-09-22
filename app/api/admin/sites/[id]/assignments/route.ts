import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { getSiteAssignments } from '@/app/actions/admin/sites'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireApiAuth()

  if (authResult instanceof NextResponse) {
    return authResult
  }

  if (!authResult.role || !['admin', 'system_admin', 'site_manager'].includes(authResult.role)) {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
  }

  const siteId = params.id
  if (!siteId) {
    return NextResponse.json({ success: false, error: 'Site ID is required' }, { status: 400 })
  }

  const result = await getSiteAssignments(siteId)
  return NextResponse.json(result, { status: result.success ? 200 : 500 })
}
