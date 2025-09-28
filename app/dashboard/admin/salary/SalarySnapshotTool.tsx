'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Worker = { id: string; full_name: string; role: string }

function formatYearMonth(date: Date) {
  const y = date.getFullYear()
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  return `${y}-${m}`
}

export default function SalarySnapshotTool() {
  const supabase = useMemo(() => createClient(), [])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [selectedWorker, setSelectedWorker] = useState<string>('')
  const [yearMonth, setYearMonth] = useState<string>(formatYearMonth(new Date()))
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any | null>(null)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const loadWorkers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('role', ['worker', 'site_manager'])
        .neq('status', 'inactive')
        .order('full_name', { ascending: true })
      if (!error && Array.isArray(data)) {
        setWorkers(data as Worker[])
        if (data.length > 0) setSelectedWorker(data[0].id)
      }
    }
    loadWorkers()
  }, [supabase])

  const handlePublishSnapshot = async () => {
    if (!selectedWorker || !yearMonth) return
    const [yStr, mStr] = yearMonth.split('-')
    const year = Number(yStr)
    const month = Number(mStr)
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/salary/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, month, workerId: selectedWorker }),
      })
      const json = await res.json()
      if (!json?.success) throw new Error(json?.error || '스냅샷 발행 실패')
      setResult({ type: 'publish', message: '스냅샷이 저장되었습니다.', data: json.data })
    } catch (e: any) {
      setError(e?.message || '스냅샷 발행 실패')
    } finally {
      setLoading(false)
    }
  }

  const handleFetchSummary = async () => {
    if (!selectedWorker || !yearMonth) return
    const [yStr, mStr] = yearMonth.split('-')
    const year = Number(yStr)
    const month = Number(mStr)
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch(
        `/api/salary/monthly?year=${year}&month=${month}&workerId=${encodeURIComponent(selectedWorker)}`
      )
      const json = await res.json()
      if (!json?.success) throw new Error(json?.error || '요약 조회 실패')
      setResult({ type: 'summary', data: json.data })
    } catch (e: any) {
      setError(e?.message || '요약 조회 실패')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenPayslip = () => {
    if (!selectedWorker || !yearMonth) return
    const [yStr, mStr] = yearMonth.split('-')
    const year = Number(yStr)
    const month = Number(mStr)
    window.open(`/payslip/${selectedWorker}/${year}/${month}`, '_blank')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          className="border rounded-md px-3 py-2 text-sm"
          value={selectedWorker}
          onChange={e => setSelectedWorker(e.target.value)}
          aria-label="작업자 선택"
        >
          {workers.map(w => (
            <option key={w.id} value={w.id}>
              {w.full_name} ({w.role})
            </option>
          ))}
        </select>
        <input
          type="month"
          className="border rounded-md px-3 py-2 text-sm"
          value={yearMonth}
          onChange={e => setYearMonth(e.target.value)}
          aria-label="년월 선택"
        />
        <button
          type="button"
          onClick={handlePublishSnapshot}
          className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm"
          disabled={loading}
        >
          스냅샷 발행
        </button>
        <button
          type="button"
          onClick={handleFetchSummary}
          className="px-3 py-2 bg-gray-100 text-gray-900 rounded-md text-sm border"
          disabled={loading}
        >
          월 요약 조회
        </button>
        <button
          type="button"
          onClick={handleOpenPayslip}
          className="px-3 py-2 bg-emerald-600 text-white rounded-md text-sm"
        >
          HTML 보기
        </button>
      </div>

      {loading && <p className="text-sm text-gray-600">처리 중...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {result && result.type === 'publish' && (
        <p className="text-sm text-green-700">{result.message}</p>
      )}
      {result && result.type === 'summary' && (
        <div className="text-sm border rounded-md p-3 bg-white">
          <div className="grid grid-cols-2 gap-2">
            <div>현장수</div>
            <div className="text-right font-medium">{result.data.siteCount}</div>
            <div>공수</div>
            <div className="text-right font-medium">{result.data.totalManDays}</div>
            <div>근무일</div>
            <div className="text-right font-medium">{result.data.workDays}</div>
            <div>총액</div>
            <div className="text-right font-medium">
              ₩{result.data.salary.total_gross_pay.toLocaleString()}
            </div>
            <div>공제</div>
            <div className="text-right font-medium">
              ₩{result.data.salary.total_deductions.toLocaleString()}
            </div>
            <div>실수령액</div>
            <div className="text-right font-semibold">
              ₩{result.data.salary.net_pay.toLocaleString()}
            </div>

            {/* 세율 출처/퍼센트 */}
            <div className="col-span-2 mt-2 border-t pt-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">세율 출처</span>
                <span className="inline-flex items-center gap-2">
                  <span
                    className={
                      'px-2 py-0.5 rounded-md text-xs ' +
                      (result.data.rateSource === 'custom'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-gray-100 text-gray-700 border border-gray-200')
                    }
                    title={(() => {
                      const r = result.data.rates || {}
                      const parts = [] as string[]
                      if (r.income_tax !== undefined) parts.push(`소득세 ${r.income_tax}%`)
                      if (r.local_tax !== undefined) parts.push(`지방세 ${r.local_tax}%`)
                      if (r.national_pension !== undefined)
                        parts.push(`국민 ${r.national_pension}%`)
                      if (r.health_insurance !== undefined)
                        parts.push(`건강 ${r.health_insurance}%`)
                      if (r.employment_insurance !== undefined)
                        parts.push(`고용 ${r.employment_insurance}%`)
                      return parts.join(' · ') || '세율 정보 없음'
                    })()}
                  >
                    {result.data.rateSource === 'custom' ? '개인설정' : '기본'}
                  </span>
                </span>
              </div>
              {result.data.rates && (
                <div className="grid grid-cols-2 gap-2 mt-2 text-gray-700">
                  {result.data.rates.income_tax !== undefined && (
                    <>
                      <div>소득세</div>
                      <div className="text-right">{result.data.rates.income_tax}%</div>
                    </>
                  )}
                  {result.data.rates.local_tax !== undefined && (
                    <>
                      <div>지방세</div>
                      <div className="text-right">{result.data.rates.local_tax}%</div>
                    </>
                  )}
                  {result.data.rates.national_pension !== undefined && (
                    <>
                      <div>국민연금</div>
                      <div className="text-right">{result.data.rates.national_pension}%</div>
                    </>
                  )}
                  {result.data.rates.health_insurance !== undefined && (
                    <>
                      <div>건강보험</div>
                      <div className="text-right">{result.data.rates.health_insurance}%</div>
                    </>
                  )}
                  {result.data.rates.employment_insurance !== undefined && (
                    <>
                      <div>고용보험</div>
                      <div className="text-right">{result.data.rates.employment_insurance}%</div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
