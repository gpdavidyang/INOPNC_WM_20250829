'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { t } from '@/lib/ui/strings'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'

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
  const { toast } = useToast()
  const [workers, setWorkers] = useState<Worker[]>([])
  const [selectedWorker, setSelectedWorker] = useState<string>('')
  const [items, setItems] = useState<Snapshot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [status, setStatus] = useState<'all' | 'issued' | 'approved' | 'paid'>('all')
  const [yearMonth, setYearMonth] = useState<string>('')
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [employmentType, setEmploymentType] = useState<
    '' | 'freelancer' | 'daily_worker' | 'regular_employee'
  >('')
  const [siteId, setSiteId] = useState<string>('')
  const [siteOptions, setSiteOptions] = useState<Array<{ id: string; name: string }>>([])
  const [workerSites, setWorkerSites] = useState<Record<string, string[]>>({})

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
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (status !== 'all') params.set('status', status)
      if (yearMonth) {
        const [y, m] = yearMonth.split('-')
        if (y && m) {
          params.set('year', String(Number(y)))
          params.set('month', String(Number(m)))
        }
      }
      if (employmentType) params.set('employmentType', employmentType)
      if (siteId) params.set('siteId', siteId)
      let url = ''
      if (selectedWorker) {
        params.set('workerId', selectedWorker)
        url = `/api/salary/snapshot/list?${params.toString()}`
      } else {
        url = `/api/admin/payroll/snapshots/list?${params.toString()}`
      }
      const res = await fetch(url)
      const json = await res.json().catch(() => null)
      if (!json || json?.success === false) throw new Error(json?.error || '목록 조회 실패')
      const data = Array.isArray(json.data)
        ? json.data
        : Array.isArray(json.data?.items)
          ? json.data.items
          : Array.isArray(json.snapshots)
            ? json.snapshots
            : []
      setItems(data as Snapshot[])
    } catch (e: any) {
      setError(e?.message || '목록 조회 실패')
    } finally {
      setLoading(false)
    }
  }

  const makeKey = (s: Snapshot) => `${s.worker_id}-${s.year}-${s.month}`
  const toggleSelect = (s: Snapshot) => {
    setSelectedKeys(prev => {
      const next = new Set(prev)
      const k = makeKey(s)
      if (next.has(k)) next.delete(k)
      else next.add(k)
      return next
    })
  }

  const onSelectAll = () => {
    setSelectedKeys(prev => {
      const list = Array.isArray(filtered) ? filtered : []
      if (prev.size === list.length) return new Set()
      const next = new Set<string>()
      list.forEach(s => next.add(makeKey(s)))
      return next
    })
  }

  const bulkApprove = async () => {
    const entries = items
      .filter(s => selectedKeys.has(makeKey(s)))
      .map(s => ({ userId: s.worker_id, year: s.year, month: s.month }))
    if (entries.length === 0) return
    try {
      const res = await fetch('/api/admin/payroll/snapshots/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries }),
      })
      const json = await res.json()
      if (!res.ok || json?.success === false) throw new Error(json?.error || '일괄 승인 실패')
      await fetchList()
      setSelectedKeys(new Set())
    } catch (e: any) {
      toast({ title: '승인 실패', description: e?.message || '일괄 승인 실패', variant: 'destructive' })
    }
  }

  const bulkPay = async () => {
    const entries = items
      .filter(s => selectedKeys.has(makeKey(s)))
      .map(s => ({ userId: s.worker_id, year: s.year, month: s.month }))
    if (entries.length === 0) return
    try {
      const res = await fetch('/api/admin/payroll/snapshots/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries }),
      })
      const json = await res.json()
      if (!res.ok || json?.success === false) throw new Error(json?.error || '일괄 지급 실패')
      await fetchList()
      setSelectedKeys(new Set())
    } catch (e: any) {
      toast({ title: '지급 실패', description: e?.message || '일괄 지급 실패', variant: 'destructive' })
    }
  }

  const exportCSV = () => {
    const headers = [
      'worker_id',
      'year',
      'month',
      'month_label',
      'status',
      'gross',
      'deductions',
      'net',
    ]
    const rows = items.map(s => [
      s.worker_id,
      s.year,
      s.month,
      s.month_label,
      s.status || 'issued',
      s.salary?.total_gross_pay ?? '',
      s.salary?.total_deductions ?? '',
      s.salary?.net_pay ?? '',
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'salary_snapshots.csv'
    a.click()
    URL.revokeObjectURL(url)
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
      toast({ title: '승인 실패', description: e?.message || '승인 실패', variant: 'destructive' })
    }
  }

  const handlePay = async (s: Snapshot) => {
    try {
      const res = await fetch('/api/salary/snapshot/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerId: s.worker_id, year: s.year, month: s.month }),
      })
      const json = await res.json()
      if (!json?.success) throw new Error(json?.error || '지급 처리 실패')
      await fetchList()
    } catch (e: any) {
      toast({ title: '지급 실패', description: e?.message || '지급 처리 실패', variant: 'destructive' })
    }
  }

  useEffect(() => {
    fetchList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWorker])

  // Load site map for month for site filter
  useEffect(() => {
    ;(async () => {
      try {
        if (!yearMonth) return
        const [y, m] = yearMonth.split('-')
        const start = `${y}-${m}-01`
        const end = new Date(Number(y), Number(m), 0).toISOString().split('T')[0]
        const { data: wr } = await supabase
          .from('work_records')
          .select('user_id, profile_id, site_id')
          .gte('work_date', start)
          .lte('work_date', end)
        const map: Record<string, Set<string>> = {}
        const siteSet: Set<string> = new Set()
        for (const r of wr || []) {
          const uid = (r as any).user_id || (r as any).profile_id
          const sid = (r as any).site_id
          if (!uid || !sid) continue
          if (!map[uid]) map[uid] = new Set()
          map[uid].add(sid)
          siteSet.add(sid)
        }
        const ids = Array.from(siteSet)
        if (ids.length) {
          const { data: sites } = await supabase.from('sites').select('id, name').in('id', ids)
          const options = (sites || []).map((s: any) => ({ id: s.id, name: s.name }))
          options.sort((a, b) => a.name.localeCompare(b.name))
          setSiteOptions(options)
        } else {
          setSiteOptions([])
        }
        const obj: Record<string, string[]> = {}
        for (const k of Object.keys(map)) obj[k] = Array.from(map[k])
        setWorkerSites(obj)
      } catch {
        setSiteOptions([])
        setWorkerSites({})
      }
    })()
  }, [items, yearMonth, supabase])

  const filtered = useMemo(() => {
    let list = Array.isArray(items) ? items : []
    if (employmentType) list = list.filter(s => (s as any).employment_type === employmentType)
    if (siteId) list = list.filter(s => (workerSites[s.worker_id] || []).includes(siteId))
    return list
  }, [items, employmentType, siteId, workerSites])

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <select
          className="h-10 rounded-md bg-white text-gray-900 border border-gray-300 px-3 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-blue-500/30"
          value={selectedWorker}
          onChange={e => setSelectedWorker(e.target.value)}
          aria-label="작업자 선택"
        >
          <option value="">전체</option>
          {workers.map(w => (
            <option key={w.id} value={w.id}>
              {w.full_name}
            </option>
          ))}
        </select>
        <select
          className="h-10 rounded-md bg-white text-gray-900 border border-gray-300 px-3 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-blue-500/30"
          value={status}
          onChange={e => setStatus(e.target.value as any)}
          aria-label="상태 필터"
        >
          <option value="all">전체</option>
          <option value="issued">발행</option>
          <option value="approved">승인</option>
          <option value="paid">지급</option>
        </select>
        <input
          type="month"
          className="h-10 rounded-md bg-white text-gray-900 border border-gray-300 px-3 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-blue-500/30"
          value={yearMonth}
          onChange={e => setYearMonth(e.target.value)}
          aria-label="년월 필터"
        />
        <select
          className="h-10 rounded-md bg-white text-gray-900 border border-gray-300 px-3 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-blue-500/30"
          value={employmentType}
          onChange={e => setEmploymentType(e.target.value as any)}
          aria-label="고용형태"
        >
          <option value="">전체 형태</option>
          <option value="freelancer">프리랜서</option>
          <option value="daily_worker">일용직</option>
          <option value="regular_employee">상용직</option>
        </select>
        <select
          className="h-10 rounded-md bg-white text-gray-900 border border-gray-300 px-3 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-blue-500/30"
          value={siteId}
          onChange={e => setSiteId(e.target.value)}
          aria-label="현장"
        >
          <option value="">전체 현장</option>
          {siteOptions.map(s => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <button
          className="px-3 py-2 text-sm border rounded-md bg-white text-gray-900 shadow-sm hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
          type="button"
          onClick={fetchList}
          disabled={loading}
        >
          {t('common.refresh')}
        </button>
        <button
          className="px-3 py-2 text-sm border rounded-md bg-white text-gray-900 shadow-sm hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
          type="button"
          onClick={exportCSV}
        >
          CSV 내보내기
        </button>
        <button
          className="px-3 py-2 text-sm border rounded-md bg-white text-gray-900 shadow-sm hover:bg-gray-50"
          type="button"
          onClick={bulkApprove}
          disabled={selectedKeys.size === 0}
        >
          선택 승인
        </button>
        <button
          className="px-3 py-2 text-sm border rounded-md bg-white text-gray-900 shadow-sm hover:bg-gray-50"
          type="button"
          onClick={bulkPay}
          disabled={selectedKeys.size === 0}
        >
          선택 지급
        </button>
      </div>

      {loading && <p className="text-sm text-gray-600">불러오는 중...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto border rounded-md">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-3 py-2">
                <input
                  type="checkbox"
                  aria-label="전체 선택"
                  checked={
                    selectedKeys.size === (Array.isArray(filtered) ? filtered.length : 0) &&
                    (Array.isArray(filtered) ? filtered.length > 0 : false)
                  }
                  onChange={onSelectAll}
                />
              </th>
              <th className="px-3 py-2">월</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2 text-right">총액</th>
              <th className="px-3 py-2 text-right">공제</th>
              <th className="px-3 py-2 text-right">실수령액</th>
              <th className="px-3 py-2">액션</th>
            </tr>
          </thead>
          <tbody>
            {(Array.isArray(filtered) ? filtered : []).map((s, idx) => (
              <tr key={`${s.worker_id}-${s.year}-${s.month}-${idx}`} className="border-t">
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    aria-label="선택"
                    checked={selectedKeys.has(makeKey(s))}
                    onChange={() => toggleSelect(s)}
                  />
                </td>
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
                    {s.status === 'approved' ? '승인' : s.status === 'paid' ? '지급' : '발행'}
                  </span>
                </td>
                <td className="px-3 py-2 text-right">
                  ₩{(s.salary?.total_gross_pay ?? 0).toLocaleString()}
                </td>
                <td className="px-3 py-2 text-right">
                  ₩{(s.salary?.total_deductions ?? 0).toLocaleString()}
                </td>
                <td className="px-3 py-2 text-right font-semibold">
                  ₩{(s.salary?.net_pay ?? 0).toLocaleString()}
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
                  {s.status !== 'paid' && (
                    <button
                      className="px-2 py-1 text-xs rounded-md bg-indigo-600 text-white"
                      onClick={() => handlePay(s)}
                    >
                      지급
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {(Array.isArray(filtered) ? filtered.length === 0 : true) && !loading && (
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
