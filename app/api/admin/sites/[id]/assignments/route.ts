import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { listSiteAssignments } from '@/lib/api/adapters/site-assignments'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

  const includeInactive = (() => {
    try {
      const sp = new URL(request.url).searchParams
      const v = sp.get('includeInactive')
      return v === '1' || v === 'true'
    } catch {
      return false
    }
  })()

  try {
    const data = await listSiteAssignments(siteId, includeInactive)
    return NextResponse.json({ success: true, data }, { status: 200 })
  } catch (e) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assignments' },
      { status: 500 }
    )
  }
}
