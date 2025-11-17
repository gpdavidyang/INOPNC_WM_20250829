import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { calculateMonthlySalary } from '@/app/actions/salary'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import StatsCard from '@/components/ui/stats-card'
import { PageHeader } from '@/components/ui/page-header'
import DataTable, { type Column } from '@/components/admin/DataTable'
import { createClient } from '@/lib/supabase/server'
import { salaryCalculationService } from '@/lib/services/salary-calculation.service'

export const metadata: Metadata = { title: '근로자 급여 캘린더' }

interface WorkerCalendarPageProps {
  params: { workerId: string }
  searchParams?: { [key: string]: string | string[] | undefined }
}

export default async function AdminWorkerSalaryCalendarPage({
  params,
  searchParams,
}: WorkerCalendarPageProps) {
  await requireAdminProfile()
  const year = Number((searchParams?.year as string) || new Date().getFullYear())
  const month = Number((searchParams?.month as string) || new Date().getMonth() + 1)

  const result = await calculateMonthlySalary({ user_id: params.workerId, year, month })
  const calc = result.success ? (result.data as any) : null

  // 일자별 근태/금액 브레이크다운
  const supabase = createClient()
  const periodStart = new Date(year, month - 1, 1).toISOString().slice(0, 10)
  const periodEnd = new Date(year, month, 0).toISOString().slice(0, 10)
  const { data: records } = await supabase
    .from('work_records')
    .select('*')
    .or(`user_id.eq.${params.workerId},profile_id.eq.${params.workerId}`)
    .gte('work_date', periodStart)
    .lte('work_date', periodEnd)
    .order('work_date', { ascending: true })

  const breakdown: Array<{
    date: string
    hours: number
    labor: number
    base_pay: number
    gross: number
    net: number
  }> = []

  for (const r of records || []) {
    const workHours = Number((r as any).work_hours || 0)
    let laborDays = Number((r as any).labor_hours || 0)
    if (!(laborDays > 0) && workHours > 0) laborDays = workHours / 8
    if (laborDays <= 0 && workHours <= 0) continue
    const daily = await salaryCalculationService.calculateDailySalary({
      user_id: params.workerId,
      work_date: (r as any).work_date,
      labor_hours: laborDays,
      site_id: (r as any).site_id,
    })
    breakdown.push({
      date: (r as any).work_date,
      hours: workHours || laborDays * 8,
      labor: laborDays,
      base_pay: daily.base_pay,
      gross: daily.total_gross_pay,
      net: daily.net_pay,
    })
  }

  return (
    <div className="px-0 pb-8">
      <PageHeader
        title="근로자 급여 요약"
        description={`${params.workerId} · ${year}-${String(month).padStart(2, '0')}`}
        breadcrumbs={[{ label: '대시보드', href: '/dashboard/admin' }, { label: '급여 관리', href: '/dashboard/admin/salary' }, { label: '근로자 캘린더' }]}
        showBackButton
        backButtonHref="/dashboard/admin/salary/records"
      />
      <div className="px-4 sm:px-6 lg:px-8 py-8">

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatsCard label="총 근로시간" value={Number(calc?.total_labor_hours || 0)} unit="count" />
        <StatsCard label="총급여" value={Number(calc?.total_gross_pay || 0)} unit="won" currency />
        <StatsCard label="공제합계" value={Number(calc?.total_deductions || 0)} unit="won" currency />
        <StatsCard label="실수령" value={Number(calc?.net_pay || 0)} unit="won" currency />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>기간</CardTitle>
          <CardDescription>급여 계산 기준</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            {calc ? (
              <span>
                {calc.period_start} ~ {calc.period_end}
              </span>
            ) : (
              <span>데이터가 없습니다.</span>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6">
        <div className="mb-3 text-sm text-muted-foreground">일자별 근태/금액 브레이크다운</div>
        <DataTable<typeof breakdown[number]>
          data={breakdown}
          rowKey={d => d.date}
          stickyHeader
          emptyMessage="표시할 데이터가 없습니다."
          columns={([
            { key: 'date', header: '날짜', sortable: true, render: d => new Date(d.date).toLocaleDateString('ko-KR') },
            { key: 'hours', header: '근로시간', sortable: true, align: 'right', render: d => d.hours },
            { key: 'labor', header: '공수', sortable: true, align: 'right', render: d => formatManhours(d.labor) },
            { key: 'base_pay', header: '기본급', sortable: true, align: 'right', render: d => `₩${d.base_pay.toLocaleString()}` },
            { key: 'gross', header: '총급여', sortable: true, align: 'right', render: d => `₩${d.gross.toLocaleString()}` },
            { key: 'net', header: '실수령', sortable: true, align: 'right', render: d => `₩${d.net.toLocaleString()}` },
          ] as Column<typeof breakdown[number]>)}
        />
      </div>
    </div>
    </div>
  )
}

function formatManhours(v: unknown): string {
  const n = Number(v)
  if (!Number.isFinite(n)) return '0.0'
  const floored = Math.floor(n * 10) / 10
  return floored.toFixed(1)
}
