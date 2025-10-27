import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { deleteDailyReports } from '@/app/actions/admin/daily-reports'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const body = await request.json().catch(() => null)
    const rawIds = Array.isArray(body?.reportIds)
      ? body.reportIds
      : Array.isArray(body?.ids)
        ? body.ids
        : null

    if (!rawIds) {
      return NextResponse.json(
        { success: false, error: '삭제할 작업일지를 선택하세요.' },
        { status: 400 }
      )
    }

    const ids = rawIds
      .map((id: unknown) => (typeof id === 'string' || typeof id === 'number' ? String(id) : ''))
      .map(id => id.trim())
      .filter(id => id.length > 0)

    if (ids.length === 0) {
      return NextResponse.json(
        { success: false, error: '삭제할 작업일지를 선택하세요.' },
        { status: 400 }
      )
    }

    const result = await deleteDailyReports(ids)
    return NextResponse.json(result, { status: result.success ? 200 : 400 })
  } catch (error) {
    console.error('[admin/daily-reports:bulk-delete] error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
