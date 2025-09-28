'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Worker = { id: string; full_name: string; role: string }

function formatYM(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export default function PayrollPreviewPage() {
  const supabase = useMemo(() => createClient(), [])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [userId, setUserId] = useState('')
  const [yearMonth, setYearMonth] = useState(formatYM(new Date()))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<any | null>(null)

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('role', ['worker', 'site_manager'])
        .neq('status', 'inactive')
        .order('full_name')
      const arr = Array.isArray(data) ? (data as Worker[]) : []
      setWorkers(arr)
      if (arr.length && !userId) setUserId(arr[0].id)
    })()
  }, [supabase])

  const onPreview = async () => {
    if (!userId || !yearMonth) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const [y, m] = yearMonth.split('-')
      const res = await fetch('/api/admin/payroll/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, year: Number(y), month: Number(m) }),
      })
      const json = await res.json()
      if (!res.ok || json?.success === false) throw new Error(json?.error || '미리보기 실패')
      setResult(json.data)
    } catch (e: any) {
      setError(e?.message || '미리보기 실패')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          className="h-10 rounded-md bg-white text-gray-900 border border-gray-300 px-3 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-blue-500/30"
          value={userId}
          onChange={e => setUserId(e.target.value)}
          aria-label="사용자"
        >
          {workers.map(w => (
            <option key={w.id} value={w.id}>
              {w.full_name} ({w.role})
            </option>
          ))}
        </select>
        <input
          type="month"
          className="h-10 rounded-md bg-white text-gray-900 border border-gray-300 px-3 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-blue-500/30"
          value={yearMonth}
          onChange={e => setYearMonth(e.target.value)}
          aria-label="년월"
        />
        <button
          type="button"
          onClick={onPreview}
          disabled={loading || !userId}
          className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm disabled:bg-gray-400"
        >
          {loading ? '계산 중...' : '미리보기'}
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {result && (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="border rounded-md p-3">
            <h3 className="font-semibold mb-2">결과 요약</h3>
            <ul className="text-sm space-y-1">
              <li>
                공수: {result.work_days}일 / 총공수 {result.total_labor_hours}
              </li>
              <li>
                근무시간: {result.total_work_hours}h / 연장 {result.total_overtime_hours}h
              </li>
              <li>기본급: ₩{Number(result.base_pay || 0).toLocaleString()}</li>
              <li>연장수당: ₩{Number(result.overtime_pay || 0).toLocaleString()}</li>
              <li>보너스: ₩{Number(result.bonus_pay || 0).toLocaleString()}</li>
              <li>총액: ₩{Number(result.total_gross_pay || 0).toLocaleString()}</li>
              <li>공제: ₩{Number(result.total_deductions || 0).toLocaleString()}</li>
              <li className="font-semibold">
                실수령: ₩{Number(result.net_pay || 0).toLocaleString()}
              </li>
            </ul>
          </div>
          <div className="border rounded-md p-3">
            <h3 className="font-semibold mb-2">세율 정보</h3>
            <div className="text-sm space-y-1">
              <div>출처: {result.rate_source === 'custom' ? '개인설정' : '형태기본/가드'}</div>
              {result.rates && (
                <ul className="text-xs list-disc pl-5">
                  {Object.entries(result.rates).map(([k, v]) => (
                    <li key={k}>
                      {k}: {v}%
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
