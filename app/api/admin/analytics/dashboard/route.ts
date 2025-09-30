import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createClient } from '@/lib/supabase/server'

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

  const supabase = createClient()
  const { searchParams } = new URL(request.url)
  const period = (searchParams.get('period') ?? 'month') as keyof typeof PERIOD_TO_WINDOW

  const attendanceWindow = PERIOD_TO_WINDOW[period] ?? PERIOD_TO_WINDOW.month
  const materialWindow = MATERIAL_WINDOW[period] ?? MATERIAL_WINDOW.month

  // Date ranges
  const now = new Date()
  const start = new Date(now)
  start.setDate(now.getDate() - attendanceWindow + 1)
  const startISO = new Date(
    Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())
  ).toISOString()
  const prevStart = new Date(start)
  const prevEnd = new Date(start)
  prevStart.setDate(start.getDate() - attendanceWindow)
  prevEnd.setDate(start.getDate() - 1)
  const prevStartISO = prevStart.toISOString()
  const prevEndISO = prevEnd.toISOString()

  // Overview totals (with fallbacks)
  const [usersCountRes, activeSitesCountRes, docsCountRes, prevDocsCountRes] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    (async () => {
      // prefer is_active=true else status='active'
      const byActive = await supabase
        .from('sites')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
      if (!byActive.error && (byActive.count ?? 0) > 0) return byActive
      return supabase
        .from('sites')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
    })(),
    supabase.from('unified_document_system').select('*', { count: 'exact', head: true }),
    supabase
      .from('unified_document_system')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', startISO),
  ])

  const totalUsers = usersCountRes.count || 0
  const activeSites = activeSitesCountRes.count || 0
  const totalDocuments = docsCountRes.count || 0
  const prevDocuments = prevDocsCountRes.count || 0

  // Changes (simple deltas vs previous period)
  const workersChange = 0
  const sitesChange = 0
  const documentsChange = prevDocuments
    ? Math.round(((totalDocuments - prevDocuments) / prevDocuments) * 100)
    : 0
  const monthlyExpense = 0
  const expenseChange = 0

  const overview = {
    totalWorkers: totalUsers,
    activeSites,
    totalDocuments,
    monthlyExpense,
    workersChange,
    sitesChange,
    documentsChange,
    expenseChange,
  }

  // Attendance trend = daily report counts per day (출근), 결근/지각=0 (데이터 부재 시)
  const { data: reportsWindow } = await supabase
    .from('daily_reports')
    .select('created_at')
    .gte('created_at', startISO)

  const dateKey = (d: Date) => d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
  const countsByDay: Record<string, number> = {}
  ;(reportsWindow || []).forEach((r: any) => {
    const d = new Date(r.created_at)
    const key = dateKey(d)
    countsByDay[key] = (countsByDay[key] || 0) + 1
  })

  const attendanceTrend = Array.from({ length: attendanceWindow }).map((_, i) => {
    const d = new Date(now)
    d.setDate(now.getDate() - (attendanceWindow - 1 - i))
    const key = dateKey(d)
    return { date: key, 출근: countsByDay[key] || 0, 결근: 0, 지각: 0 }
  })

  // Site performance: top 5 sites by report count during window
  const { data: siteReportRows } = await supabase
    .from('daily_reports')
    .select('site_id, created_at')
    .gte('created_at', startISO)
  const countsBySite: Record<string, number> = {}
  ;(siteReportRows || []).forEach((r: any) => {
    if (r.site_id) countsBySite[r.site_id] = (countsBySite[r.site_id] || 0) + 1
  })
  const topSites = Object.entries(countsBySite)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
  let siteNames: Record<string, string> = {}
  if (topSites.length > 0) {
    const ids = topSites.map(([id]) => id)
    const { data: siteRows } = await supabase.from('sites').select('id, name').in('id', ids)
    siteNames = Object.fromEntries((siteRows || []).map((s: any) => [s.id, s.name || s.id]))
  }
  const sitePerformance = topSites.map(([id, cnt]) => ({
    name: siteNames[id] || id,
    진행률: Math.min(100, Math.round((cnt / attendanceWindow) * 100)),
    작업자: cnt,
    안전점수: 100,
  }))

  // Document distribution by category
  const { data: docRows } = await supabase.from('unified_document_system').select('category_type')
  const byCategory: Record<string, number> = {}
  ;(docRows || []).forEach((r: any) => {
    const k = r.category_type || 'unknown'
    byCategory[k] = (byCategory[k] || 0) + 1
  })
  const docTotal = Object.values(byCategory).reduce((a, b) => a + b, 0)
  const documentDistribution = Object.entries(byCategory).map(([name, value]) => ({
    name,
    value,
    percentage: docTotal ? Math.round((value / docTotal) * 100) : 0,
  }))

  // Material usage trend: use photo_grid_reports per day
  const matStart = new Date(now)
  matStart.setDate(now.getDate() - materialWindow + 1)
  const matStartISO = new Date(
    Date.UTC(matStart.getFullYear(), matStart.getMonth(), matStart.getDate())
  ).toISOString()
  const { data: grids } = await supabase
    .from('photo_grid_reports')
    .select('created_at')
    .gte('created_at', matStartISO)
  const byDayPG: Record<string, number> = {}
  ;(grids || []).forEach((r: any) => {
    const d = new Date(r.created_at)
    const key = dateKey(d)
    byDayPG[key] = (byDayPG[key] || 0) + 1
  })
  const materialUsageTrend = Array.from({ length: materialWindow }).map((_, i) => {
    const d = new Date(now)
    d.setDate(now.getDate() - (materialWindow - 1 - i))
    const key = dateKey(d)
    return { date: key, 'NPC-1000': byDayPG[key] || 0, 기타자재: 0 }
  })

  // Salary distribution & safety incidents & productivity (basic placeholders based on available data)
  const salaryDistribution: Array<{ range: string; count: number }> = [
    { range: '0-1M', count: 0 },
    { range: '1-2M', count: 0 },
    { range: '2-3M', count: 0 },
    { range: '3M+', count: 0 },
  ]
  const safetyIncidents: Array<{ month: string; incidents: number; nearMiss: number }> = []
  const productivityMetrics: Array<{
    metric: string
    current: number
    target: number
    unit: string
  }> = [
    {
      metric: '일일보고/일',
      current: Number(
        (attendanceTrend.reduce((a, b) => a + b.출근, 0) / attendanceWindow).toFixed(1)
      ),
      target: 10,
      unit: '건',
    },
    { metric: '문서증가율', current: documentsChange, target: 5, unit: '%' },
  ]

  return NextResponse.json({
    success: true,
    data: {
      overview,
      attendanceTrend,
      sitePerformance,
      documentDistribution,
      materialUsageTrend,
      salaryDistribution,
      safetyIncidents,
      productivityMetrics,
    },
  })
}
