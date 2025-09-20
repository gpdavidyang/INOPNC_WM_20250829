import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { ADMIN_ANALYTICS_STUB } from '@/lib/admin/stub-data'

export const dynamic = 'force-dynamic'

const PERIOD_TO_WINDOW: Record<string, number> = {
  week: 7,
  month: 30,
  quarter: 90,
}

const MATERIAL_WINDOW: Record<string, number> = {
  week: 14,
  month: 30,
  quarter: 60,
}

export async function GET(request: NextRequest) {
  const authResult = await requireApiAuth()

  if (authResult instanceof NextResponse) {
    return authResult
  }

  const { role } = authResult

  if (!role || !['admin', 'system_admin'].includes(role)) {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') ?? 'month'

  const attendanceWindow = PERIOD_TO_WINDOW[period] ?? PERIOD_TO_WINDOW.month
  const materialWindow = MATERIAL_WINDOW[period] ?? MATERIAL_WINDOW.month

  const attendanceTrend = ADMIN_ANALYTICS_STUB.attendanceTrend.slice(-attendanceWindow)
  const materialUsageTrend = ADMIN_ANALYTICS_STUB.materialUsageTrend.slice(-materialWindow)

  return NextResponse.json({
    success: true,
    data: {
      overview: ADMIN_ANALYTICS_STUB.overview,
      attendanceTrend,
      sitePerformance: ADMIN_ANALYTICS_STUB.sitePerformance,
      documentDistribution: ADMIN_ANALYTICS_STUB.documentDistribution,
      materialUsageTrend,
      salaryDistribution: ADMIN_ANALYTICS_STUB.salaryDistribution,
      safetyIncidents: ADMIN_ANALYTICS_STUB.safetyIncidents,
      productivityMetrics: ADMIN_ANALYTICS_STUB.productivityMetrics,
    },
  })
}
