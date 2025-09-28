'use client'

import React, { useEffect, useState } from 'react'

export default function PayrollDashboardPage() {
  const [yearMonth, setYearMonth] = useState<string>(new Date().toISOString().slice(0, 7))
  const [status, setStatus] = useState<'all' | 'issued' | 'approved' | 'paid'>('all')
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

  const fetchSummary = async () => {
    if (!yearMonth) return
    const [y, m] = yearMonth.split('-')
    setLoading(true)
    setError('')
    try {
      const qs = new URLSearchParams({ year: String(Number(y)), month: String(Number(m)) })
      if (status !== 'all') qs.set('status', status)
      const res = await fetch(`/api/admin/payroll/summary?${qs.toString()}`)
      const json = await res.json()
      if (!res.ok || json?.success === false) throw new Error(json?.error || '요약 조회 실패')
      setData(json.data)
    } catch (e: any) {
      setError(e?.message || '요약 조회 실패')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearMonth, status])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="month"
          className="h-10 rounded-md bg-white text-gray-900 border border-gray-300 px-3 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-blue-500/30"
          value={yearMonth}
          onChange={e => setYearMonth(e.target.value)}
          aria-label="년월"
        />
        <select
          className="h-10 rounded-md bg-white text-gray-900 border border-gray-300 px-3 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-blue-500/30"
          value={status}
          onChange={e => setStatus(e.target.value as any)}
          aria-label="상태"
        >
          <option value="all">전체</option>
          <option value="issued">issued</option>
          <option value="approved">approved</option>
          <option value="paid">paid</option>
        </select>
        <button
          type="button"
          onClick={fetchSummary}
          className="px-3 py-2 bg-white text-gray-900 rounded-md text-sm border shadow-sm hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
          disabled={loading}
        >
          새로고침
        </button>
      </div>
      {loading && <p className="text-sm text-gray-600">불러오는 중...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg border p-4 bg-white">
          <div className="text-xs text-gray-500">스냅샷 수</div>
          <div className="text-2xl font-semibold">{data.count}</div>
        </div>
        <div className="rounded-lg border p-4 bg-white">
          <div className="text-xs text-gray-500">총액</div>
          <div className="text-2xl font-semibold">₩{data.gross.toLocaleString()}</div>
        </div>
        <div className="rounded-lg border p-4 bg-white">
          <div className="text-xs text-gray-500">공제</div>
          <div className="text-2xl font-semibold">₩{data.deductions.toLocaleString()}</div>
        </div>
        <div className="rounded-lg border p-4 bg-white">
          <div className="text-xs text-gray-500">실수령</div>
          <div className="text-2xl font-semibold">₩{data.net.toLocaleString()}</div>
        </div>
      </div>
    </div>
  )
}
