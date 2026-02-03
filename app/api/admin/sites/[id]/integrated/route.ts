import { getIntegratedSiteDetail } from '@/lib/admin/site-detail'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/admin/sites/:id/integrated
// Optimized integrated overview bundle for the site detail Overview tab
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const siteId = params.id
    if (!siteId)
      return NextResponse.json({ success: false, error: 'Missing site id' }, { status: 400 })

    const data = await getIntegratedSiteDetail(siteId)
    if (!data) {
      return NextResponse.json({ success: false, error: 'Site not found' }, { status: 404 })
    }

    // Return the bundle in the expected format (without site/org at top for this API)
    return NextResponse.json({
      success: true,
      data: {
        stats: data.stats,
        docs: data.docs,
        reports: data.reports,
        assignments: data.assignments,
        requests: data.requests,
      },
    })
  } catch (e) {
    console.error('[admin/sites/:id/integrated] error:', e)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
