import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { getSites, createSite } from '@/app/actions/admin/sites'
import type { SiteStatus } from '@/types'

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
  const page = Number.parseInt(searchParams.get('page') || '1', 10)
  const limit = Number.parseInt(searchParams.get('limit') || '50', 10)
  const search = searchParams.get('search') || ''
  const statusParam = (searchParams.get('status') || '') as SiteStatus | ''
  const sort = searchParams.get('sort') || 'created_at'
  const direction = (searchParams.get('direction') || 'desc') as 'asc' | 'desc'

  const pageNumber = Number.isFinite(page) && page > 0 ? page : 1
  const limitNumber = Number.isFinite(limit) && limit > 0 ? limit : 10
  const siteStatus = statusParam && statusParam !== 'all' ? (statusParam as SiteStatus) : undefined

  const result = await getSites(pageNumber, limitNumber, search, siteStatus, sort, direction)

  return NextResponse.json(result, { status: result.success ? 200 : 500 })
}

export async function POST(request: NextRequest) {
  const authResult = await requireApiAuth()

  if (authResult instanceof NextResponse) {
    return authResult
  }

  const { role } = authResult
  if (!role || !['admin', 'system_admin'].includes(role)) {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
  }

  const data = await request.json().catch(() => ({}))
  const result = await createSite(data)
  return NextResponse.json(result, { status: result.success ? 200 : 400 })
}
