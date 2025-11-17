'use client'

import React, { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import EmptyState from '@/components/ui/empty-state'
import { t } from '@/lib/ui/strings'
import { MonthPicker } from '@/components/ui/month-picker'

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
  const maxTrendGross = React.useMemo(() => {
    if (!trend.length) return 1
    const values = trend.map(t => Number(t.gross) || 0)
    const max = Math.max(...values, 1)
    return max <= 0 ? 1 : max
  }, [trend])
  const BAR_MAX_HEIGHT = 128

  return (
    <div className="px-0 pb-8">
      <PageHeader
        title="급여 대시보드"
        description="월별 요약/추이/인력별 상세"
        breadcrumbs={[{ label: '대시보드', href: '/dashboard/admin' }, { label: '급여 관리', href: '/dashboard/admin/salary' }, { label: '대시보드' }]}
      />
      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <MonthPicker
          value={yearMonth}
          onChange={setYearMonth}
          ariaLabel="년월"
          className="w-full sm:w-36"
        />
        <button
          type="button"
          onClick={fetchSummary}
          className="px-3 py-2 bg-white text-gray-900 rounded-md text-sm border shadow-sm hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
          disabled={loading}
        >
          {t('common.refresh')}
        </button>
      </div>
      {loading && <EmptyState description="불러오는 중..." />}
      {error && <EmptyState title="오류" description={error} />}
      <div className="flex items-center gap-3">
        <span
          className={`text-[11px] px-2 py-1 rounded-full border ${source === 'fallback' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : 'bg-green-50 border-green-200 text-green-700'}`}
          title={
            source === 'fallback' ? '스냅샷 부재시 작업기록 기반 추정치' : '스냅샷 데이터 기준'
          }
        >
          {source === 'fallback' ? '자료원: 추정(폴백)' : '자료원: 급여명세서'}
        </span>
        {source === 'fallback' && (
          <button
            type="button"
            onClick={() => setShowFallbackInfo(v => !v)}
            className="text-xs underline text-blue-600"
          >
            폴백 계산 기준
          </button>
        )}
      </div>

      {source === 'fallback' && showFallbackInfo && (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 text-yellow-900 p-3 text-xs">
          <div className="font-medium mb-1">폴백(추정) 계산 기준</div>
          <ul className="list-disc pl-4 space-y-1">
            <li>선택한 연월에 대해 salary_snapshots 데이터가 없을 때 적용</li>
            <li>해당 월의 work_records 범위에서 사용자 집합을 수집</li>
            <li>사용자별 월 급여를 서비스 권한으로 재계산(salaryCalculationService)</li>
            <li>개인 설정(worker_salary_settings)과 기본 세율(employment_tax_rates) 활용</li>
            <li>근무기록이 있지만 시간값이 비어 있으면 1일 8시간(1공수)로 보정</li>
          </ul>
          <div className="mt-2">
            <a href="/dashboard/admin/salary/defaults" className="underline text-blue-700">
              기본 세율 관리
            </a>
            <span className="mx-2 text-yellow-700">·</span>
            <a href="/dashboard/admin/salary/personal" className="underline text-blue-700">
              개인 세율/일당 관리
            </a>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-[#F3F7FA] border-[#BAC6E1] p-4 min-h-[96px]">
          <div className="text-sm text-[#8DA0CD] mb-1">발행 된 급여명세서 수</div>
          <div className="text-2xl font-semibold">{data.count}</div>
        </div>
        <div className="rounded-xl border bg-[#F3F7FA] border-[#BAC6E1] p-4 min-h-[96px]">
          <div className="text-sm text-[#8DA0CD] mb-1">총액</div>
          <div className="text-2xl font-semibold">₩{data.gross.toLocaleString()}</div>
        </div>
        <div className="rounded-xl border bg-[#F3F7FA] border-[#BAC6E1] p-4 min-h-[96px]">
          <div className="text-sm text-[#8DA0CD] mb-1">공제</div>
          <div className="text-2xl font-semibold">₩{data.deductions.toLocaleString()}</div>
        </div>
        <div className="rounded-xl border bg-[#F3F7FA] border-[#BAC6E1] p-4 min-h-[96px]">
          <div className="text-sm text-[#8DA0CD] mb-1">실수령</div>
          <div className="text-2xl font-semibold">₩{data.net.toLocaleString()}</div>
        </div>
      </div>

      {/* 추이: 최근 3개월 총급여지급액 표 */}
      <div className="mt-6 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">최근 추이 (3개월)</span>
        </div>
        <div className="overflow-x-auto border rounded-md">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-3 py-2">월</th>
                <th className="px-3 py-2 text-right">인원</th>
                <th className="px-3 py-2 text-right">총급여</th>
                <th className="px-3 py-2 text-right">공제</th>
                <th className="px-3 py-2 text-right">실수령</th>
              </tr>
            </thead>
            <tbody>
              {trend.map(t => (
                <tr key={t.month} className="border-t">
                  <td className="px-3 py-2">{t.month}</td>
                  <td className="px-3 py-2 text-right">{t.count}</td>
                  <td className="px-3 py-2 text-right">₩{t.gross.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">₩{t.deductions.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">₩{t.net.toLocaleString()}</td>
                </tr>
              ))}
              {trendLoading && (
                <tr>
                  <td className="px-3 py-6 text-center text-gray-500" colSpan={5}>
                    최근 추이 계산 중...
                  </td>
                </tr>
              )}
              {!trendLoading && trend.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center text-gray-500" colSpan={5}>
                    데이터가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 인력별 표 */}
      <div className="mt-6 space-y-3">
        <div className="text-sm font-semibold">인력별 상세 ({yearMonth})</div>
        <div className="overflow-x-auto border rounded-md">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-3 py-2">이름</th>
                <th className="px-3 py-2">고용형태</th>
                <th className="px-3 py-2 text-right">일당</th>
                <th className="px-3 py-2 text-right">총공수</th>
                <th className="px-3 py-2 text-right">총급여</th>
                <th className="px-3 py-2 text-right">실수령</th>
              </tr>
            </thead>
            <tbody>
              {workers.map(w => (
                <tr key={w.worker_id} className="border-t">
                  <td className="px-3 py-2">{w.name}</td>
                  <td className="px-3 py-2">{formatEmploymentType(w.employment_type)}</td>
                  <td className="px-3 py-2 text-right">
                    {w.daily_rate ? `₩${w.daily_rate.toLocaleString()}` : '-'}
                  </td>
                  <td className="px-3 py-2 text-right">{formatManhours(w.total_labor_hours)}</td>
                  <td className="px-3 py-2 text-right">₩{w.total_gross_pay.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">₩{w.net_pay.toLocaleString()}</td>
                </tr>
              ))}
              {workers.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center text-gray-500" colSpan={6}>
                    데이터가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
