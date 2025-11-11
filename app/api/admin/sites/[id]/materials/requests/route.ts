import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { getMaterialRequests } from '@/app/actions/admin/materials'

export const dynamic = 'force-dynamic'

// GET /api/admin/sites/:id/materials/requests
// Query: q, status, sort(date|status|number), order(asc|desc), limit, offset
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const siteId = params.id
    if (!siteId) {
      return NextResponse.json({ success: false, error: 'Missing site id' }, { status: 400 })
    }

    const { searchParams } = new URL(req.url)
    const q = (searchParams.get('q') || '').trim()
    const statusParam = (searchParams.get('status') || 'all').trim()
    const sortParam = (searchParams.get('sort') || 'date').trim() as 'date' | 'status' | 'number'
    const orderParam = (searchParams.get('order') || 'desc').trim() as 'asc' | 'desc'
    const limit = Math.max(1, Math.min(200, Number(searchParams.get('limit') || '21') || 21))
    const offset = Math.max(0, Number(searchParams.get('offset') || '0') || 0)

    const page = Math.floor(offset / limit) + 1
    const result = await getMaterialRequests(
      page,
      limit,
      q,
      siteId,
      undefined,
      undefined,
      statusParam === 'all' ? undefined : (statusParam as any)
    )

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to load requests' },
        { status: 500 }
      )
    }

    const requests = result.data?.requests || []
    const total = result.data?.total || 0
    return NextResponse.json({ success: true, data: requests, total })
  } catch (e) {
    console.error('[admin/sites/:id/materials/requests] error:', e)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
