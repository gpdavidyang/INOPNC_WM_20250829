'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Worker = { id: string; full_name: string }
type Snapshot = {
  worker_id: string
  year: number
  month: number
  month_label: string
  status?: 'issued' | 'approved' | 'paid'
  salary: { total_gross_pay: number; total_deductions: number; net_pay: number }
}

export default function SnapshotList() {
  const supabase = useMemo(() => createClient(), [])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [selectedWorker, setSelectedWorker] = useState<string>('')
  const [items, setItems] = useState<Snapshot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [status, setStatus] = useState<'all' | 'issued' | 'approved' | 'paid'>('all')
  const [yearMonth, setYearMonth] = useState<string>('')

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('role', ['worker', 'site_manager'])
        .neq('status', 'inactive')
        .order('full_name', { ascending: true })
      if (Array.isArray(data)) {
        setWorkers(data as Worker[])
        if (!selectedWorker && data.length > 0) setSelectedWorker(data[0].id)
      }
    }
    load()
  }, [supabase])

  const fetchList = async () => {
    if (!selectedWorker) return
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      params.set('workerId', selectedWorker)
      if (status !== 'all') params.set('status', status)
      if (yearMonth) {
        const [y, m] = yearMonth.split('-')
        if (y && m) {
          params.set('year', String(Number(y)))
          params.set('month', String(Number(m)))
        }
      }
      const res = await fetch(`/api/salary/snapshot/list?${params.toString()}`)
      const json = await res.json()
      if (!json?.success) throw new Error(json?.error || '목록 조회 실패')
      setItems(json.data as Snapshot[])
    } catch (e: any) {
      setError(e?.message || '목록 조회 실패')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (s: Snapshot) => {
    try {
      const res = await fetch('/api/salary/snapshot/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerId: s.worker_id, year: s.year, month: s.month }),
      })
      const json = await res.json()
      if (!json?.success) throw new Error(json?.error || '승인 실패')
      await fetchList()
    } catch (e: any) {
      alert(e?.message || '승인 실패')
    }
  }

  useEffect(() => {
    fetchList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWorker])

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <select
          className="border rounded-md px-3 py-2 text-sm"
          value={selectedWorker}
          onChange={e => setSelectedWorker(e.target.value)}
          aria-label="작업자 선택"
        >
          {workers.map(w => (
            <option key={w.id} value={w.id}>
              {w.full_name}
            </option>
          ))}
        </select>
        <select
          className="border rounded-md px-3 py-2 text-sm"
          value={status}
          onChange={e => setStatus(e.target.value as any)}
          aria-label="상태 필터"
        >
          <option value="all">전체</option>
          <option value="issued">issued</option>
          <option value="approved">approved</option>
          <option value="paid">paid</option>
        </select>
        <input
          type="month"
          className="border rounded-md px-3 py-2 text-sm"
          value={yearMonth}
          onChange={e => setYearMonth(e.target.value)}
          aria-label="년월 필터"
        />
        <button
          className="px-3 py-2 text-sm border rounded-md"
          type="button"
          onClick={fetchList}
          disabled={loading}
        >
          새로고침
        </button>
      </div>

      {loading && <p className="text-sm text-gray-600">불러오는 중...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto border rounded-md">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-3 py-2">월</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2 text-right">총액</th>
              <th className="px-3 py-2 text-right">공제</th>
              <th className="px-3 py-2 text-right">실수령액</th>
              <th className="px-3 py-2">액션</th>
            </tr>
          </thead>
          <tbody>
            {items.map((s, idx) => (
              <tr key={`${s.worker_id}-${s.year}-${s.month}-${idx}`} className="border-t">
                <td className="px-3 py-2">
                  {s.month_label || `${s.year}-${String(s.month).padStart(2, '0')}`}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      s.status === 'approved'
                        ? 'bg-green-50 text-green-700'
                        : s.status === 'paid'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {s.status || 'issued'}
                  </span>
                </td>
                <td className="px-3 py-2 text-right">
                  ₩{s.salary.total_gross_pay.toLocaleString()}
                </td>
                <td className="px-3 py-2 text-right">
                  ₩{s.salary.total_deductions.toLocaleString()}
                </td>
                <td className="px-3 py-2 text-right font-semibold">
                  ₩{s.salary.net_pay.toLocaleString()}
                </td>
                <td className="px-3 py-2 flex items-center gap-2">
                  <button
                    className="px-2 py-1 text-xs rounded-md bg-emerald-600 text-white"
                    onClick={() =>
                      window.open(`/payslip/${s.worker_id}/${s.year}/${s.month}`, '_blank')
                    }
                  >
                    HTML 보기
                  </button>
                  {s.status !== 'approved' && (
                    <button
                      className="px-2 py-1 text-xs rounded-md bg-blue-600 text-white"
                      onClick={() => handleApprove(s)}
                    >
                      승인
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {items.length === 0 && !loading && (
              <tr>
                <td className="px-3 py-6 text-center text-gray-500" colSpan={6}>
                  스냅샷이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
