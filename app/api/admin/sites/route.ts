import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { ADMIN_SITES_STUB } from '@/lib/admin/stub-data'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const authResult = await requireApiAuth()

  if (authResult instanceof NextResponse) {
    return authResult
  }

  const { role } = authResult

  if (!role || !['admin', 'system_admin', 'site_manager'].includes(role)) {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const limitParam = searchParams.get('limit')
  const limit = limitParam ? Math.max(1, Number.parseInt(limitParam, 10)) : undefined

  let filtered = ADMIN_SITES_STUB

  if (status && status !== 'all') {
    filtered = filtered.filter((site) => site.status === status)
  }

  const items = limit ? filtered.slice(0, limit) : filtered

  return NextResponse.json({
    success: true,
    data: {
      sites: items,
      total: filtered.length,
    },
  })
}
