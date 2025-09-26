import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import {
  saveSalarySnapshot,
  getSalarySnapshot,
  type SalarySnapshot,
} from '@/lib/services/salary-snapshot.service'
import { salaryCalculationService } from '@/lib/services/salary-calculation.service'

export const dynamic = 'force-dynamic'

// GET /api/salary/snapshot?year=YYYY&month=M&workerId=optional
export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(request.url)
    const year = Number(searchParams.get('year'))
    const month = Number(searchParams.get('month'))
    const workerIdParam = searchParams.get('workerId') || undefined
    const isAdmin = auth.role === 'admin' || auth.role === 'system_admin'
    const workerId = workerIdParam && isAdmin ? workerIdParam : auth.userId
    if (!year || !month) {
      return NextResponse.json(
        { success: false, error: 'year, month가 필요합니다.' },
        { status: 400 }
      )
    }

    // Non-admin can only access self
    if (!isAdmin && workerId !== auth.userId) {
      return NextResponse.json({ success: false, error: '권한이 없습니다.' }, { status: 403 })
    }

    const { snapshot } = await getSalarySnapshot(workerId, year, month)
    if (!snapshot) {
      return NextResponse.json({ success: false, error: '스냅샷 없음' }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: snapshot })
  } catch (e: any) {
    console.error('GET /api/salary/snapshot error:', e)
    return NextResponse.json(
      { success: false, error: e?.message || 'Internal error' },
      { status: 500 }
    )
  }
}

// POST /api/salary/snapshot
// Body: { year, month }
// Generates current snapshot for the authenticated worker and saves it
export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const body = await request.json()
    const year = Number(body?.year)
    const month = Number(body?.month)
    const workerIdParam = body?.workerId as string | undefined
    const isAdmin = auth.role === 'admin' || auth.role === 'system_admin'
    const workerId = workerIdParam && isAdmin ? workerIdParam : auth.userId
    if (!year || !month) {
      return NextResponse.json(
        { success: false, error: 'year, month가 필요합니다.' },
        { status: 400 }
      )
    }

    // Calculate monthly salary
    const monthly = await salaryCalculationService.calculateMonthlySalary(workerId, year, month)

    // Build snapshot
    const month_label = `${year}-${String(month).padStart(2, '0')}`

    const snapshot: SalarySnapshot = {
      worker_id: workerId,
      year,
      month,
      month_label,
      snapshot_version: '1.0.0',
      html_template_version: '1.0.0',
      issued_at: new Date().toISOString(),
      issuer_id: auth.userId,
      employment_type: null,
      daily_rate: null,
      siteCount: 0,
      workDays: monthly.work_days,
      totalManDays: Number(monthly.total_labor_hours.toFixed(1)),
      salary: monthly,
    }

    const result = await saveSalarySnapshot(snapshot)
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || '스냅샷 저장 실패' },
        { status: 500 }
      )
    }
    return NextResponse.json({ success: true, data: { source: result.source || 'db' } })
  } catch (e: any) {
    console.error('POST /api/salary/snapshot error:', e)
    return NextResponse.json(
      { success: false, error: e?.message || 'Internal error' },
      { status: 500 }
    )
  }
}
