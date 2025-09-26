import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { getSalaryRecords } from '@/app/actions/admin/salary'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth
    const isAdmin = auth.role === 'admin' || auth.role === 'system_admin'
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: '권한이 없습니다.' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get('page') || '1')
    const limit = Number(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const status =
      (searchParams.get('status') as 'calculated' | 'approved' | 'paid' | null) || undefined
    const site_id = searchParams.get('site_id') || undefined
    const yearMonth = searchParams.get('yearMonth') || ''
    let date_from: string | undefined
    let date_to: string | undefined
    if (yearMonth) {
      const [y, m] = yearMonth.split('-')
      if (y && m) {
        const yNum = Number(y)
        const mNum = Number(m)
        date_from = `${yNum}-${String(mNum).padStart(2, '0')}-01`
        const end = new Date(yNum, mNum, 0)
        date_to = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(
          end.getDate()
        ).padStart(2, '0')}`
      }
    }

    const result = await getSalaryRecords(page, limit, search, status, site_id, date_from, date_to)
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }
    return NextResponse.json({ success: true, data: result.data })
  } catch (e: any) {
    console.error('GET /api/admin/salary/records error:', e)
    return NextResponse.json(
      { success: false, error: e?.message || 'Internal error' },
      { status: 500 }
    )
  }
}
