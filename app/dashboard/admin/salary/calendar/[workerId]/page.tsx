import { calculateMonthlySalary } from '@/app/actions/salary'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { salaryCalculationService } from '@/lib/services/salary-calculation.service'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, Banknote, Clock, ShieldAlert, Wallet } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

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
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" asChild className="h-9 rounded-xl border-gray-200">
           <Link href="/dashboard/admin/salary/records">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              목록으로 돌아가기
           </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-3xl border-gray-200 shadow-sm bg-[#1A254F] text-white overflow-hidden">
          <CardContent className="p-5 flex flex-col gap-1">
             <span className="text-[11px] font-black uppercase text-white/50 tracking-tighter">총 근로시간</span>
             <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black italic">{Number(calc?.total_labor_hours || 0).toFixed(1)}</span>
                <span className="text-xs font-bold text-white/70">시간</span>
             </div>
             <Clock className="absolute right-4 top-4 w-10 h-10 text-white/5 pointer-events-none" />
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-gray-200 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-5 flex flex-col gap-1">
             <span className="text-[11px] font-black uppercase text-muted-foreground tracking-tighter">총 지급액 (세전)</span>
             <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black italic text-[#1A254F]">₩ {Number(calc?.total_gross_pay || 0).toLocaleString()}</span>
             </div>
             <Banknote className="absolute right-4 top-4 w-10 h-10 text-gray-50 pointer-events-none" />
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-gray-200 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-5 flex flex-col gap-1">
             <span className="text-[11px] font-black uppercase text-rose-600/70 tracking-tighter">공제 합계</span>
             <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black italic text-rose-600">₩ {Number(calc?.total_deductions || 0).toLocaleString()}</span>
             </div>
             <ShieldAlert className="absolute right-4 top-4 w-10 h-10 text-rose-50 pointer-events-none" />
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-gray-200 shadow-sm bg-blue-600 text-white overflow-hidden">
          <CardContent className="p-5 flex flex-col gap-1">
             <span className="text-[11px] font-black uppercase text-white/50 tracking-tighter">실지급액 (세후)</span>
             <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black italic">₩ {Number(calc?.net_pay || 0).toLocaleString()}</span>
             </div>
             <Wallet className="absolute right-4 top-4 w-10 h-10 text-white/10 pointer-events-none" />
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border-gray-200 shadow-sm overflow-hidden">
        <CardContent className="pt-6 space-y-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-black text-foreground flex items-center gap-2">
              <div className="w-1.5 h-6 bg-blue-600 rounded-sm" />
              일자별 급여 산출 내역
            </h2>
            <p className="text-sm text-muted-foreground">
               {year}년 {month}월 · {calc?.period_start} ~ {calc?.period_end} 기준
            </p>
          </div>

          <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-[#8da0cd] text-white">
                    <th className="px-4 py-3 text-left font-bold">날짜</th>
                    <th className="px-4 py-3 text-right font-bold w-32">근로시간</th>
                    <th className="px-4 py-3 text-right font-bold w-32">공수(MD)</th>
                    <th className="px-4 py-3 text-right font-bold w-40">기본급</th>
                    <th className="px-4 py-3 text-right font-bold w-40">총급여</th>
                    <th className="px-4 py-3 text-right font-bold w-40">실수령</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {breakdown.map((d) => (
                    <tr key={d.date} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-bold text-gray-900 tabular-nums">
                         {new Date(d.date).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit', weekday: 'short' })}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600 tabular-nums">
                         {d.hours} <span className="text-[10px] text-muted-foreground font-black">H</span>
                      </td>
                      <td className="px-4 py-3 text-right font-black text-blue-600 italic tabular-nums">
                         {formatManhours(d.labor)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600 tabular-nums">
                         ₩{d.base_pay.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800 tabular-nums">
                         ₩{d.gross.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-black text-[#1A254F] italic tabular-nums">
                         ₩{d.net.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {breakdown.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-20 text-center text-gray-400">
                         해당 기간의 급여 산출 내역이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function formatManhours(v: unknown): string {
  const n = Number(v)
  if (!Number.isFinite(n)) return '0.0'
  const floored = Math.floor(n * 10) / 10
  return floored.toFixed(1)
}
