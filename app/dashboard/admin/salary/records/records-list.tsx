'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { t } from '@/lib/ui/strings'
import EmptyState from '@/components/ui/empty-state'
import { createClient } from '@/lib/supabase/client'

type Worker = { id: string; full_name: string }
type RecordRow = {
  worker_id: string
  worker: { full_name: string; role: string }
  site: { name: string }
  work_date: string
  base_pay: number
  overtime_pay: number
  bonus_pay: number
}

export default function SalaryRecordsList() {
  const supabase = useMemo(() => createClient(), [])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [selectedWorker, setSelectedWorker] = useState<string>('')
  const [yearMonth, setYearMonth] = useState<string>('')
  const [search, setSearch] = useState<string>('')
  const [items, setItems] = useState<RecordRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

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
      }
    }
    load()
  }, [supabase])

  const fetchRecords = async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      params.set('page', '1')
      params.set('limit', '100')
      if (search) params.set('search', search)
      if (yearMonth) params.set('yearMonth', yearMonth)
      // site_id/status는 필요 시 추가
      const res = await fetch(`/api/admin/salary/records?${params.toString()}`)
      const json = await res.json()
      if (!json?.success) throw new Error(json?.error || '레코드 조회 실패')
      let rows = (json.data.records || []) as RecordRow[]
      if (selectedWorker) {
        rows = rows.filter(r => r.worker_id === selectedWorker)
      }
      setItems(rows)
    } catch (e: any) {
      setError(e?.message || '레코드 조회 실패')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecords()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openPayslip = (r: RecordRow) => {
    if (!r.work_date || !r.worker_id) return
    const d = new Date(r.work_date)
    const y = d.getFullYear()
    const m = d.getMonth() + 1
    window.open(`/payslip/${r.worker_id}/${y}/${m}`, '_blank')
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('common.search')}
          className="border rounded-md px-3 py-2 text-sm"
        />
        <input
          type="month"
          value={yearMonth}
          onChange={e => setYearMonth(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm"
          aria-label="년월 필터"
        />
        <select
          className="border rounded-md px-3 py-2 text-sm"
          value={selectedWorker}
          onChange={e => setSelectedWorker(e.target.value)}
          aria-label="작업자 필터"
        >
          <option value="">전체 작업자</option>
          {workers.map(w => (
            <option key={w.id} value={w.id}>
              {w.full_name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="px-3 py-2 text-sm border rounded-md"
          onClick={fetchRecords}
          disabled={loading}
        >
          {t('common.search')}
        </button>
      </div>

      {loading && <EmptyState description="불러오는 중..." />}
      {error && <EmptyState title="오류" description={error} />}

      <div className="overflow-x-auto border rounded-md">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-3 py-2">작업자</th>
              <th className="px-3 py-2">현장</th>
              <th className="px-3 py-2">작업일</th>
              <th className="px-3 py-2 text-right">기본</th>
              <th className="px-3 py-2 text-right">연장</th>
              <th className="px-3 py-2 text-right">합계</th>
              <th className="px-3 py-2">액션</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r, idx) => (
              <tr key={`${r.worker_id}-${r.work_date}-${idx}`} className="border-t">
                <td className="px-3 py-2">{r.worker.full_name}</td>
                <td className="px-3 py-2">{r.site.name}</td>
                <td className="px-3 py-2">{r.work_date}</td>
                <td className="px-3 py-2 text-right">₩{r.base_pay.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">₩{r.overtime_pay.toLocaleString()}</td>
                <td className="px-3 py-2 text-right font-medium">
                  ₩{(r.base_pay + r.overtime_pay + (r.bonus_pay || 0)).toLocaleString()}
                </td>
                <td className="px-3 py-2">
                  <button
                    className="px-2 py-1 text-xs rounded-md bg-emerald-600 text-white"
                    onClick={() => openPayslip(r)}
                  >
                    HTML 보기
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && !loading && (
              <tr>
                <td className="px-3 py-6" colSpan={7}>
                  <EmptyState description="데이터가 없습니다." />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
