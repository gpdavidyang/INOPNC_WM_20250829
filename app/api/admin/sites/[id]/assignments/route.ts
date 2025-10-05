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
    const sp = new URL(request.url).searchParams
    const q = sp.get('q') || undefined
    const role = sp.get('role') || undefined
    const sortParam = sp.get('sort') as 'name' | 'role' | 'company' | 'date' | null
    const orderParam = sp.get('order') as 'asc' | 'desc' | null
    const companyParam = sp.get('company') || undefined
    const limit = sp.get('limit')
      ? Math.min(200, Math.max(1, Number(sp.get('limit')) || 0))
      : undefined
    const offset = sp.get('offset') ? Math.max(0, Number(sp.get('offset')) || 0) : undefined

    const result = await listSiteAssignments(siteId, includeInactive, {
      search: q,
      role: role as any,
      sort: (sortParam || undefined) as any,
      order: (orderParam || undefined) as any,
      company: (companyParam || undefined) as any,
      limit,
      offset,
    })
    return NextResponse.json(
      { success: true, data: result.rows, total: result.total },
      { status: 200 }
    )
  } catch (e) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assignments' },
      { status: 500 }
    )
  }
}
