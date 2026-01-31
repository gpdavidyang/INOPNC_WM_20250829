import { setDailyReportApproval } from '@/app/actions/admin/daily-reports'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const reportId = params.id
    if (!reportId) {
      return NextResponse.json({ success: false, error: 'Report ID is required.' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const action = typeof body?.action === 'string' ? body.action : 'approve'
    const reason = typeof body?.reason === 'string' ? body.reason : undefined

    let nextStatus: 'approved' | 'submitted' | 'rejected'
    if (action === 'approve') nextStatus = 'approved'
    else if (action === 'reject') nextStatus = 'rejected'
    else nextStatus = 'submitted' // revert

    const result = await setDailyReportApproval(reportId, nextStatus, reason)
    return NextResponse.json(result, { status: result.success ? 200 : 400 })
  } catch (error) {
    console.error('[admin/daily-reports/approval] error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
