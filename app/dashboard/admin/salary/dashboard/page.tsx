'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { t } from '@/lib/ui/strings'
import { Calendar } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

export default function PayrollDashboardPage() {
  const [yearMonth, setYearMonth] = useState<string>(new Date().toISOString().slice(0, 7))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<{
    count: number
    gross: number
    deductions: number
    net: number
  }>({
    count: 0,
    gross: 0,
    deductions: 0,
    net: 0,
  })
  const [source, setSource] = useState<'snapshots' | 'fallback'>('snapshots')
  const [showFallbackInfo, setShowFallbackInfo] = useState(false)
  const [trend, setTrend] = useState<
    Array<{ month: string; count: number; gross: number; deductions: number; net: number }>
  >([])
  const [trendLoading, setTrendLoading] = useState(false)
  const [workers, setWorkers] = useState<
    Array<{
      worker_id: string
      name: string
      employment_type: string | null
      daily_rate: number | null
      total_labor_hours: number
      total_gross_pay: number
      net_pay: number
    }>
  >([])
  type WorkerSortKey =
    | 'name'
    | 'employment_type'
    | 'daily_rate'
    | 'total_labor_hours'
    | 'total_gross_pay'
    | 'net_pay'
  const [workerSort, setWorkerSort] = useState<{ key: WorkerSortKey; direction: 'asc' | 'desc' }>({
    key: 'name',
    direction: 'asc',
  })
  const sortedWorkers = useMemo(() => {
    const data = Array.isArray(workers) ? [...workers] : []
    data.sort((a, b) => {
      const { key, direction } = workerSort
      const dir = direction === 'asc' ? 1 : -1
      const av = (a as any)?.[key]
      const bv = (b as any)?.[key]
      if (key === 'name' || key === 'employment_type') {
        const aStr = (av || '').toString()
        const bStr = (bv || '').toString()
        return aStr.localeCompare(bStr) * dir
      }
      const aNum = Number(av) || 0
      const bNum = Number(bv) || 0
      if (aNum === bNum) return 0
      return aNum > bNum ? dir : -dir
    })
    return data
  }, [workers, workerSort])

  const toggleWorkerSort = (key: WorkerSortKey) => {
    setWorkerSort(prev => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
      }
      return { key, direction: 'asc' }
    })
  }

  const fetchSummary = async () => {
    if (!yearMonth) return
    const [y, m] = yearMonth.split('-')
    setLoading(true)
    setError('')
    try {
      const qs = new URLSearchParams({ year: String(Number(y)), month: String(Number(m)) })
      const res = await fetch(`/api/admin/payroll/summary?${qs.toString()}`)
      const json = await res.json()
      if (!res.ok || json?.success === false) throw new Error(json?.error || '요약 조회 실패')
      setData(json.data)
      if (json.source === 'fallback') setSource('fallback')
      else setSource('snapshots')
    } catch (e: any) {
      setError(e?.message || '요약 조회 실패')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearMonth])

  const fetchTrend = async () => {
    setTrendLoading(true)
    try {
      const res = await fetch(`/api/admin/payroll/summary/trend?months=3`)
      const json = await res.json()
      if (!res.ok || json?.success === false) throw new Error(json?.error || '추이 조회 실패')
      setTrend(json.data || [])
    } catch (e) {
      setTrend([])
    } finally {
      setTrendLoading(false)
    }
  }

  const fetchWorkers = async () => {
    const [y, m] = yearMonth.split('-')
    try {
      const res = await fetch(
        `/api/admin/payroll/summary/workers?year=${Number(y)}&month=${Number(m)}`
      )
      const json = await res.json()
      if (!res.ok || json?.success === false) throw new Error(json?.error || '인력별 조회 실패')
      setWorkers(json.data || [])
    } catch (e) {
      setWorkers([])
    }
  }

  useEffect(() => {
    fetchTrend()
  }, [])

  useEffect(() => {
    fetchWorkers()
  }, [yearMonth])

  const employmentTypeLabel = {
    freelancer: '프리랜서',
    daily_worker: '일용직',
    regular_employee: '상용직',
  } as Record<string, string>
  const formatEmploymentType = (val: string | null | undefined) => {
    const key = String(val || '').toLowerCase()
    return employmentTypeLabel[key] || val || '-'
  }
  const getSortIndicator = (key: WorkerSortKey) => {
    if (workerSort.key !== key) return ''
    return workerSort.direction === 'asc' ? '▲' : '▼'
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border-gray-200 shadow-sm shadow-gray-200/50">
        <CardContent className="pt-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative w-fit">
                <Input
                  type="month"
                  className="h-10 w-40 rounded-xl bg-gray-50 border-none pl-4 pr-10 text-sm font-medium"
                  value={yearMonth}
                  onChange={e => setYearMonth(e.target.value)}
                  aria-label="년월"
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchSummary}
                className="h-10 rounded-xl px-4 border-gray-200 font-bold"
                disabled={loading}
              >
                <span>{t('common.refresh')}</span>
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`text-[11px] font-bold uppercase tracking-tighter px-3 py-1 rounded-full border ${
                  source === 'fallback' 
                    ? 'bg-amber-50 border-amber-200 text-amber-700' 
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                }`}
                title={
                  source === 'fallback' ? '스냅샷 부재시 작업기록 기반 추정치' : '스냅샷 데이터 기준'
                }
              >
                {source === 'fallback' ? '자료원: 추정(폴백)' : '자료원: 명세서 기반'}
              </span>
              {source === 'fallback' && (
                <Button 
                  variant="ghost" 
                  size="xs" 
                  onClick={() => setShowFallbackInfo(v => !v)}
                  className="text-[11px] font-bold uppercase text-blue-600 hover:bg-blue-50"
                >
                  폴백 기준 보기
                </Button>
              )}
            </div>
          </div>

          {source === 'fallback' && showFallbackInfo && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 text-sm space-y-3">
              <div className="font-black text-amber-900 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                폴백(추정) 계산 기준
              </div>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-amber-800/80 text-xs">
                <li className="flex items-start gap-2">
                  <span className="opacity-50">•</span>
                  <span>명세서 데이터(salary_snapshots) 부재 시 적용</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="opacity-50">•</span>
                  <span>해당 월의 실제 근무기록(work_records) 기반 추출</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="opacity-50">•</span>
                  <span>salaryCalculationService를 통한 실시간 재계산</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="opacity-50">•</span>
                  <span>개인 설정 및 기본 세율 정보를 최우선 적용</span>
                </li>
              </ul>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
            <div className="bg-slate-50 p-5 rounded-2xl flex flex-col gap-1.5 border border-slate-100">
              <div className="text-[11px] font-medium uppercase tracking-tighter text-[#1A254F] opacity-40">
                발행 명세서 수
              </div>
              <div className="text-2xl font-bold text-[#1A254F] italic tracking-tight">
                {data.count}<span className="text-sm font-medium not-italic ml-1 opacity-50">건</span>
              </div>
            </div>
            <div className="bg-indigo-50/50 p-5 rounded-2xl flex flex-col gap-1.5 border border-indigo-100/50">
              <div className="text-[11px] font-medium uppercase tracking-tighter text-[#1A254F] opacity-40">
                총지급액
              </div>
              <div className="text-2xl font-bold text-[#1A254F] italic tracking-tight">
                <span className="text-lg font-medium not-italic mr-0.5 opacity-50">₩</span>
                {data.gross.toLocaleString()}
              </div>
            </div>
            <div className="bg-rose-50/30 p-5 rounded-2xl flex flex-col gap-1.5 border border-rose-100/50">
              <div className="text-[11px] font-medium uppercase tracking-tighter text-rose-600 opacity-50">
                총공제액
              </div>
              <div className="text-2xl font-bold text-rose-700 italic tracking-tight">
                <span className="text-lg font-medium not-italic mr-0.5 opacity-50">₩</span>
                {data.deductions.toLocaleString()}
              </div>
            </div>
            <div className="bg-emerald-50/20 p-5 rounded-2xl flex flex-col gap-1.5 border border-emerald-100/50">
              <div className="text-[11px] font-medium uppercase tracking-tighter text-emerald-600 opacity-50">
                총실수령액
              </div>
              <div className="text-2xl font-bold text-emerald-700 italic tracking-tight">
                <span className="text-lg font-medium not-italic mr-0.5 opacity-50">₩</span>
                {data.net.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 최근 추이 */}
            <div className="lg:col-span-1 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">최근 추이 (3개월)</h3>
              </div>
              <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-[#8da0cd] text-white">
                        <th className="px-3 py-2.5 font-bold text-left">월</th>
                        <th className="px-3 py-2.5 font-bold text-right">인원</th>
                        <th className="px-3 py-2.5 font-bold text-right">실수령</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {trend.map(t => (
                        <tr key={t.month} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-3 py-3 font-medium">{t.month}</td>
                          <td className="px-3 py-3 text-right font-bold text-gray-900">{t.count}<span className="text-[10px] ml-0.5 opacity-40">명</span></td>
                          <td className="px-3 py-3 text-right font-black text-[#1A254F]">₩{t.net.toLocaleString()}</td>
                        </tr>
                      ))}
                      {trendLoading && (
                        <tr>
                          <td className="px-3 py-10 text-center text-gray-400" colSpan={3}>
                            추이 데이터 계산 중...
                          </td>
                        </tr>
                      )}
                      {!trendLoading && trend.length === 0 && (
                        <tr>
                          <td className="px-3 py-10 text-center text-gray-400" colSpan={3}>
                            데이터가 없습니다.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 인력별 상세 */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">인력별 상세 <span className="text-sm font-medium text-muted-foreground ml-2">({yearMonth})</span></h3>
              </div>
              <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-[#8da0cd] text-white">
                        <th className="px-4 py-2.5 text-left font-bold">
                          <button
                            type="button"
                            onClick={() => toggleWorkerSort('name')}
                            className="flex items-center gap-1 hover:text-white/80 transition-colors"
                          >
                            이름 <span className="text-[10px]">{getSortIndicator('name')}</span>
                          </button>
                        </th>
                        <th className="px-4 py-2.5 text-left font-bold">고용형태</th>
                        <th className="px-4 py-2.5 text-right font-bold">
                          <button
                            type="button"
                            onClick={() => toggleWorkerSort('total_labor_hours')}
                            className="inline-flex items-center gap-1 hover:text-white/80 transition-colors"
                          >
                            총공수 <span className="text-[10px]">{getSortIndicator('total_labor_hours')}</span>
                          </button>
                        </th>
                        <th className="px-4 py-2.5 text-right font-bold">
                          <button
                            type="button"
                            onClick={() => toggleWorkerSort('net_pay')}
                            className="inline-flex items-center gap-1 hover:text-white/80 transition-colors"
                          >
                            실수령 <span className="text-[10px]">{getSortIndicator('net_pay')}</span>
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {sortedWorkers.map(w => (
                        <tr key={w.worker_id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3 font-bold text-gray-900">{w.name}</td>
                          <td className="px-4 py-3 text-xs">
                            <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-medium border border-gray-200">
                              {formatEmploymentType(w.employment_type)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-gray-600">
                            {formatManhours(w.total_labor_hours)} <span className="text-[10px] opacity-40 ml-0.5">공수</span>
                          </td>
                          <td className="px-4 py-3 text-right font-black text-[#1A254F]">₩{w.net_pay.toLocaleString()}</td>
                        </tr>
                      ))}
                      {loading && workers.length === 0 && (
                        <tr>
                          <td className="px-4 py-16 text-center text-gray-400" colSpan={4}>
                            데이터를 불러오는 중입니다...
                          </td>
                        </tr>
                      )}
                      {!loading && workers.length === 0 && (
                        <tr>
                          <td className="px-4 py-16 text-center text-gray-400" colSpan={4}>
                            해당 월의 데이터가 없습니다.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl text-rose-700 text-sm flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-rose-600" />
          {error}
        </div>
      )}
    </div>
  )
}

function formatManhours(v: unknown): string {
  const n = Number(v)
  if (!Number.isFinite(n)) return '0.0'
  const floored = Math.floor(n * 10) / 10
  return floored.toFixed(1)
}
