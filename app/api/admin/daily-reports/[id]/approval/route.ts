import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { setDailyReportApproval } from '@/app/actions/admin/daily-reports'

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
    const nextStatus = action === 'approve' ? 'approved' : 'submitted'

    const result = await setDailyReportApproval(reportId, nextStatus)
    return NextResponse.json(result, { status: result.success ? 200 : 400 })
  } catch (error) {
    console.error('[admin/daily-reports/approval] error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
