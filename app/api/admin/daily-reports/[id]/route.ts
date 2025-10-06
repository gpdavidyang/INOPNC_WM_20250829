import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { deleteDailyReport, updateDailyReport } from '@/app/actions/admin/daily-reports'

export const dynamic = 'force-dynamic'

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApiAuth()
  if (auth instanceof NextResponse) return auth

  if (!auth.role || !['admin', 'system_admin'].includes(auth.role)) {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
  }

  try {
    const result = await deleteDailyReport(params.id)
    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to delete daily report' },
      { status: 400 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApiAuth()
  if (auth instanceof NextResponse) return auth

  if (!auth.role || !['admin', 'system_admin'].includes(auth.role)) {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const result = await updateDailyReport(params.id, body)
    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update daily report' },
      { status: 400 }
    )
  }
}
