import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { calculateMonthlySalary } from '@/app/actions/salary'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
    overtime_pay: number
    bonus_pay: number
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
      overtime_pay: daily.overtime_pay,
      bonus_pay: daily.bonus_pay,
      gross: daily.total_gross_pay,
      net: daily.net_pay,
    })
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">근로자 급여 요약</h1>
        <p className="text-sm text-muted-foreground">
          {params.workerId} · {year}-{String(month).padStart(2, '0')}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>총 근로시간</CardTitle>
            <CardDescription>정규+추가</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {calc ? calc.total_labor_hours : <span className="text-muted-foreground">-</span>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>총급여</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {calc ? (
                `₩${Number(calc.total_gross_pay || 0).toLocaleString()}`
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>공제합계</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {calc ? (
                `₩${Number(calc.total_deductions || 0).toLocaleString()}`
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>실수령</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {calc ? (
                `₩${Number(calc.net_pay || 0).toLocaleString()}`
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </div>
          </CardContent>
        </Card>
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

      <div className="mt-6 rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
        <div className="mb-3 text-sm text-muted-foreground">일자별 근태/금액 브레이크다운</div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>날짜</TableHead>
              <TableHead className="text-right">근로시간</TableHead>
              <TableHead className="text-right">공수</TableHead>
              <TableHead className="text-right">기본급</TableHead>
              <TableHead className="text-right">추가수당</TableHead>
              <TableHead className="text-right">보너스</TableHead>
              <TableHead className="text-right">총급여</TableHead>
              <TableHead className="text-right">실수령</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {breakdown.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                  표시할 데이터가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              breakdown.map(d => (
                <TableRow key={d.date}>
                  <TableCell>{new Date(d.date).toLocaleDateString('ko-KR')}</TableCell>
                  <TableCell className="text-right">{d.hours}</TableCell>
                  <TableCell className="text-right">{formatManhours(d.labor)}</TableCell>
                  <TableCell className="text-right">₩{d.base_pay.toLocaleString()}</TableCell>
                  <TableCell className="text-right">₩{d.overtime_pay.toLocaleString()}</TableCell>
                  <TableCell className="text-right">₩{d.bonus_pay.toLocaleString()}</TableCell>
                  <TableCell className="text-right">₩{d.gross.toLocaleString()}</TableCell>
                  <TableCell className="text-right">₩{d.net.toLocaleString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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
