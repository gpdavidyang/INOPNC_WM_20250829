import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { listSalarySnapshots } from '@/lib/services/salary-snapshot.service'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year') ? Number(searchParams.get('year')) : undefined
    const month = searchParams.get('month') ? Number(searchParams.get('month')) : undefined
    const workerIdParam = searchParams.get('workerId') || undefined
    const statusParam = searchParams.get('status') as 'issued' | 'approved' | 'paid' | null
    const isAdmin = auth.role === 'admin' || auth.role === 'system_admin'
    const workerId = workerIdParam && isAdmin ? workerIdParam : auth.userId

    const { snapshots } = await listSalarySnapshots({
      workerId,
      year,
      month,
      status: statusParam || undefined,
      limit: 100,
    })
    return NextResponse.json({ success: true, data: snapshots })
  } catch (e: any) {
    console.error('GET /api/salary/snapshot/list error:', e)
    return NextResponse.json(
      { success: false, error: e?.message || 'Internal error' },
      { status: 500 }
    )
  }
}
