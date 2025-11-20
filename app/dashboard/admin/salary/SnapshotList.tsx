'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { t } from '@/lib/ui/strings'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import {
  CustomSelect,
  CustomSelectTrigger,
  CustomSelectValue,
  CustomSelectContent,
  CustomSelectItem,
} from '@/components/ui/custom-select'
import { openFileRecordInNewTab } from '@/lib/files/preview'

const getDefaultYearMonth = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

type Worker = { id: string; full_name: string }
type Snapshot = {
  worker_id: string
  year: number
  month: number
  month_label: string
  status?: 'issued' | 'approved' | 'paid'
  daily_rate?: number | null
  totalManDays?: number | null
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
  const [yearMonth, setYearMonth] = useState<string>(() => getDefaultYearMonth())
  const [employmentType, setEmploymentType] = useState<
    '' | 'freelancer' | 'daily_worker' | 'regular_employee'
  >('')
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [recentWorker, setRecentWorker] = useState<string>('')
  const [recentRange, setRecentRange] = useState<'3' | '6' | '12'>('3')
  const [recentItems, setRecentItems] = useState<Snapshot[]>([])
  const [recentLoading, setRecentLoading] = useState(false)
  const [recentError, setRecentError] = useState('')
  const [recentSelected, setRecentSelected] = useState<Set<string>>(new Set())
  const workerNameMap = useMemo(() => {
    const map: Record<string, string> = {}
    workers.forEach(w => {
      map[w.id] = w.full_name
    })
    return map
  }, [workers])
  const uniqueWorkerOptions = useMemo(() => {
    const seen = new Set<string>()
    return workers.filter(w => {
      if (!w.full_name) return false
      const key = w.full_name.trim()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [workers])

  const normalizeSnapshot = (item: any): Snapshot => {
    const workerId =
      item.worker_id ||
      item.workerId ||
      item.userId ||
      item.user_id ||
      item.worker?.id ||
      item.profile_id ||
      ''
    let year = item.year || item.snapshot_year
    let month = item.month || item.snapshot_month
    if ((!year || !month) && typeof item.month_label === 'string') {
      const [y, m] = item.month_label.split('-')
      year = year || Number(y)
      month = month || Number(m)
    }
    const monthLabel =
      item.month_label ||
      (year && month ? `${year}-${String(month).padStart(2, '0')}` : '—')
    return {
      ...item,
      worker_id: workerId,
      year: Number(year) || new Date().getFullYear(),
      month: Number(month) || new Date().getMonth() + 1,
      month_label: monthLabel,
    }
  }

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

  const fetchList = async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (yearMonth) {
        const [y, m] = yearMonth.split('-')
        if (y && m) {
          params.set('year', String(Number(y)))
          params.set('month', String(Number(m)))
        }
      }
      if (employmentType) params.set('employmentType', employmentType)
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
      const normalized = (data as Snapshot[]).map(normalizeSnapshot)
      setItems(normalized)
      setSelectedKeys(new Set())
    } catch (e: any) {
      setError(e?.message || '목록 조회 실패')
    } finally {
      setLoading(false)
    }
  }

  const exportCSV = () => {
    const headers = ['이름', 'worker_id', '년', '월', '상태', '총지급액', '총공제액', '실지급액']
    const rows = items.map(s => [
      workerNameMap[s.worker_id] || '',
      s.worker_id,
      s.year,
      s.month,
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

  useEffect(() => {
    fetchList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWorker, yearMonth])

  const filtered = useMemo(() => {
    let list = Array.isArray(items) ? items : []
    if (employmentType) list = list.filter(s => (s as any).employment_type === employmentType)
    return list
  }, [items, employmentType])

  const makeKey = (s: Snapshot) => `${s.worker_id}-${Number(s.year)}-${Number(s.month)}`
  const makeEntryKey = (entry: { userId: string; year: number; month: number }) =>
    `${entry.userId}-${entry.year}-${entry.month}`
  const toEntry = (snapshot: Snapshot) => {
    const workerId = snapshot.worker_id
    const year = Number(snapshot.year)
    const month = Number(snapshot.month)
    if (!workerId || Number.isNaN(year) || Number.isNaN(month)) return null
    return { userId: workerId, year, month }
  }
  const markPaidEntries = (entries: Array<{ userId: string; year: number; month: number }>) => {
    if (!entries.length) return
    const targetKeys = new Set(entries.map(makeEntryKey))
    setItems(prev =>
      Array.isArray(prev)
        ? prev.map(item => (targetKeys.has(makeKey(item)) ? { ...item, status: 'paid' } : item))
        : prev
    )
    setRecentItems(prev =>
      Array.isArray(prev)
        ? prev.map(item => (targetKeys.has(makeKey(item)) ? { ...item, status: 'paid' } : item))
        : prev
    )
  }
  const toggleSelect = (s: Snapshot) => {
    setSelectedKeys(prev => {
      const next = new Set(prev)
      const key = makeKey(s)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const onSelectAll = () => {
    setSelectedKeys(prev => {
      const data = Array.isArray(filtered) ? filtered : []
      if (prev.size === data.length) return new Set()
      const next = new Set<string>()
      data.forEach(s => next.add(makeKey(s)))
      return next
    })
  }

  const toggleRecentEntry = (s: Snapshot) => {
    setRecentSelected(prev => {
      const next = new Set(prev)
      const key = makeKey(s)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const onSelectAllRecent = () => {
    if (!recentWorker) return
    setRecentSelected(prev => {
      if (recentItems.length === 0) return new Set()
      if (prev.size === recentItems.length) return new Set()
      const next = new Set<string>()
      recentItems.forEach(item => next.add(makeKey(item)))
      return next
    })
  }

  const paySnapshotEntry = async (entry: { userId: string; year: number; month: number }) => {
    if (!entry.userId || !entry.year || !entry.month) {
      throw new Error('지급 정보가 부족합니다.')
    }
    const res = await fetch('/api/admin/payroll/snapshots/pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workerId: entry.userId, year: entry.year, month: entry.month }),
    })
    const json = await res.json().catch(() => null)
    if (!res.ok || json?.success === false) throw new Error(json?.error || '지급 실패')
  }

  const paySelected = async (override?: Array<{ userId: string; year: number; month: number }>) => {
    let invalidCount = 0
    const targets = override
      ? override
      : filtered
          .filter(s => selectedKeys.has(makeKey(s)))
          .map(snapshot => {
            const entry = toEntry(snapshot)
            if (!entry) invalidCount += 1
            return entry
          })
          .filter((entry): entry is { userId: string; year: number; month: number } => !!entry)
    if (!targets.length) {
      toast({ title: '선택 없음', description: '지급할 항목을 선택해주세요.' })
      return
    }
    if (!override && invalidCount) {
      toast({
        title: '유효하지 않은 항목 제외',
        description: '일부 항목은 필수 정보가 없어 제외되었습니다.',
      })
    }
    try {
      await Promise.all(targets.map(paySnapshotEntry))
      toast({ title: '지급 완료', description: `${targets.length}건이 지급 처리되었습니다.` })
      markPaidEntries(targets)
      const updated = await fetchList()
    } catch (e: any) {
      toast({ title: '지급 실패', description: e?.message || '선택 지급 실패', variant: 'destructive' })
    }
  }

  const paySingle = async (s: Snapshot) => {
    const entry = toEntry(s)
    if (!entry) {
      toast({ title: '지급 불가', description: '필수 정보가 없어 지급할 수 없습니다.' })
      return
    }
    try {
      await paySnapshotEntry(entry)
      toast({ title: '지급 완료', description: `${workerNameMap[s.worker_id] || '작업자'} 지급 처리` })
      markPaidEntries([entry])
      const updated = await fetchList()
    } catch (e: any) {
      toast({ title: '지급 실패', description: e?.message || '지급 실패', variant: 'destructive' })
    }
  }

  const fetchRecentSnapshots = async () => {
    if (!recentWorker) {
      setRecentItems([])
      setRecentError('')
      return
    }
    setRecentLoading(true)
    setRecentError('')
    try {
      const range = Number(recentRange)
      const now = new Date()
      const requests: Array<{ year: number; month: number }> = []
      for (let i = 0; i < range; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        requests.push({ year: d.getFullYear(), month: d.getMonth() + 1 })
      }
      const entries = await Promise.all(
        requests.map(async ({ year, month }) => {
          const params = new URLSearchParams({
            year: String(year),
            month: String(month),
            workerId: recentWorker,
          })
          const res = await fetch(`/api/admin/payroll/snapshots/list?${params.toString()}`)
          const json = await res.json().catch(() => null)
          if (!json || json?.success === false) return []
          const data = Array.isArray(json.data)
            ? json.data
            : Array.isArray(json.data?.items)
              ? json.data.items
              : Array.isArray(json.snapshots)
                ? json.snapshots
                : []
          return data as Snapshot[]
        })
      )
      const flat = entries
        .flat()
        .map(normalizeSnapshot)
        .filter(s => s.worker_id === recentWorker)
        .sort((a, b) => {
          if (a.year === b.year) return b.month - a.month
          return b.year - a.year
        })
      setRecentItems(flat)
      setRecentSelected(new Set())
    } catch (e: any) {
      setRecentItems([])
      setRecentError(e?.message || '이름별 조회 실패')
    } finally {
      setRecentLoading(false)
    }
  }

  useEffect(() => {
    fetchRecentSnapshots()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recentWorker, recentRange])

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
          <div className="w-full md:w-auto">
            <input
              type="month"
              className="h-10 w-full md:w-36 rounded-md bg-white text-gray-900 border border-gray-300 px-3 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-blue-500/30"
              value={yearMonth}
              onChange={e => setYearMonth(e.target.value || getDefaultYearMonth())}
              aria-label="조회 년월"
            />
          </div>
          <div className="w-full md:w-64">
            <CustomSelect
            value={selectedWorker || 'all'}
            onValueChange={value => setSelectedWorker(value === 'all' ? '' : value)}
          >
            <CustomSelectTrigger className="h-10 w-full" aria-label="작업자 선택">
              <CustomSelectValue placeholder="전체 작업자" />
            </CustomSelectTrigger>
            <CustomSelectContent className="min-w-[220px]">
              <CustomSelectItem value="all">전체</CustomSelectItem>
              {workers.map(w => (
                <CustomSelectItem key={w.id} value={w.id}>
                  {w.full_name}
                </CustomSelectItem>
              ))}
            </CustomSelectContent>
          </CustomSelect>
          </div>
          <div className="w-full md:w-52">
            <CustomSelect
            value={employmentType || 'all'}
            onValueChange={value => setEmploymentType(value === 'all' ? '' : (value as any))}
          >
            <CustomSelectTrigger className="h-10 w-full rounded-md bg-white text-gray-900 border border-gray-300 px-3 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-blue-500/30" aria-label="고용형태">
              <CustomSelectValue placeholder="전체 형태" />
            </CustomSelectTrigger>
            <CustomSelectContent>
              <CustomSelectItem value="all">전체 형태</CustomSelectItem>
              <CustomSelectItem value="freelancer">프리랜서</CustomSelectItem>
              <CustomSelectItem value="daily_worker">일용직</CustomSelectItem>
              <CustomSelectItem value="regular_employee">상용직</CustomSelectItem>
            </CustomSelectContent>
          </CustomSelect>
          </div>
        </div>
        <div className="flex justify-end gap-2">
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
          className="px-3 py-2 text-sm border rounded-md bg-white text-gray-900 shadow-sm hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
          type="button"
          onClick={() => paySelected()}
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
                    selectedKeys.size > 0 &&
                    selectedKeys.size === (Array.isArray(filtered) ? filtered.length : 0)
                  }
                  onChange={onSelectAll}
                />
              </th>
              <th className="px-3 py-2">이름</th>
              <th className="px-3 py-2">월</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2 text-right">일당</th>
              <th className="px-3 py-2 text-right">총공수</th>
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
                <td className="px-3 py-2 text-sm text-gray-900">
                  {workerNameMap[s.worker_id] || '—'}
                </td>
                <td className="px-3 py-2">
                  {s.month_label || `${s.year}-${String(s.month).padStart(2, '0')}`}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    <span className="px-2 py-1 rounded-full text-xs bg-amber-50 text-amber-700">발행</span>
                    {s.status === 'paid' && (
                      <span className="px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-700">지급</span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 text-right">
                  {s.daily_rate != null
                    ? `₩${Number(s.daily_rate).toLocaleString()}`
                    : '—'}
                </td>
                <td className="px-3 py-2 text-right">
                  {typeof s.totalManDays === 'number'
                    ? Number(s.totalManDays).toFixed(1)
                    : typeof (s as any).workDays === 'number'
                      ? Number((s as any).workDays).toFixed(1)
                      : '—'}
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
                    onClick={() => {
                      const displayName = (workerNameMap[s.worker_id] || '').trim()
                      const query = displayName ? `?name=${encodeURIComponent(displayName)}` : ''
                      openFileRecordInNewTab({
                        file_url: `/payslip/${s.worker_id}/${s.year}/${s.month}${query}`,
                        file_name: `${displayName || 'payslip'}-${s.year}-${s.month}.html`,
                        title: `${displayName || '급여'} ${s.year}-${s.month}`,
                      })
                    }}
                  >
                    HTML 보기
                  </button>
                  <button
                    className="px-2 py-1 text-xs rounded-md bg-indigo-600 text-white"
                    onClick={() => paySingle(s)}
                  >
                    지급
                  </button>
                </td>
              </tr>
            ))}
            {(Array.isArray(filtered) ? filtered.length === 0 : true) && !loading && (
              <tr>
                <td className="px-3 py-6 text-center text-gray-500" colSpan={10}>
                  발행 된 급여명세서가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">이름별 조회</h3>
        <p className="text-sm text-gray-600">선택한 작업자의 최근 기간(기본 3개월) 발행 내역을 확인하세요.</p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-full md:w-64">
            <CustomSelect
              value={recentWorker || undefined}
              onValueChange={value => setRecentWorker(value)}
            >
              <CustomSelectTrigger className="h-10 w-full" aria-label="이름 선택">
                <CustomSelectValue
                  placeholder="이름을 선택하세요"
                  className={`text-sm ${recentWorker ? 'text-gray-900' : 'text-gray-500'}`}
                />
              </CustomSelectTrigger>
              <CustomSelectContent className="min-w-[220px]">
                {uniqueWorkerOptions.map(w => (
                  <CustomSelectItem key={w.id} value={w.id}>
                    {w.full_name}
                  </CustomSelectItem>
                ))}
              </CustomSelectContent>
            </CustomSelect>
          </div>
          <div className="w-full md:w-40">
            <CustomSelect
              value={recentRange}
              onValueChange={value => setRecentRange(value as '3' | '6' | '12')}
            >
              <CustomSelectTrigger className="h-10 w-full" aria-label="기간">
                <CustomSelectValue placeholder="최근 3개월" />
              </CustomSelectTrigger>
              <CustomSelectContent>
                <CustomSelectItem value="3">최근 3개월</CustomSelectItem>
                <CustomSelectItem value="6">최근 6개월</CustomSelectItem>
                <CustomSelectItem value="12">최근 12개월</CustomSelectItem>
              </CustomSelectContent>
            </CustomSelect>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            className="px-3 py-2 text-sm border rounded-md bg-white text-gray-900 shadow-sm hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
            type="button"
            onClick={fetchRecentSnapshots}
            disabled={recentLoading}
          >
            {t('common.refresh')}
          </button>
          <button
            className="px-3 py-2 text-sm border rounded-md bg-white text-gray-900 shadow-sm hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
            type="button"
            onClick={() => exportCSV()}
          >
            CSV 내보내기
          </button>
          <button
            className="px-3 py-2 text-sm border rounded-md bg-white text-gray-900 shadow-sm hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
            type="button"
          onClick={async () => {
              const entries = recentItems
                .filter(s => recentSelected.has(makeKey(s)))
                .map(toEntry)
                .filter((entry): entry is { userId: string; year: number; month: number } => !!entry)
              if (!entries.length) {
                toast({ title: '선택 없음', description: '지급할 내역이 없습니다.' })
                return
              }
              await paySelected(entries)
              setRecentSelected(new Set())
            }}
            disabled={!recentWorker || recentSelected.size === 0}
          >
            선택 지급
          </button>
        </div>
        {recentLoading && <p className="text-sm text-gray-600">불러오는 중...</p>}
        {recentError && <p className="text-sm text-red-600">{recentError}</p>}
        <div className="overflow-x-auto border rounded-md">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-3 py-2">
                  <input
                    type="checkbox"
                    aria-label="전체 선택"
                    checked={
                      recentWorker &&
                      recentSelected.size > 0 &&
                      recentSelected.size === recentItems.length
                    }
                    onChange={onSelectAllRecent}
                    disabled={!recentWorker || recentItems.length === 0}
                  />
                </th>
                <th className="px-3 py-2">이름</th>
                <th className="px-3 py-2">월</th>
                <th className="px-3 py-2">상태</th>
                <th className="px-3 py-2 text-right">일당</th>
                <th className="px-3 py-2 text-right">총공수</th>
                <th className="px-3 py-2 text-right">총액</th>
                <th className="px-3 py-2 text-right">공제</th>
                <th className="px-3 py-2 text-right">실수령액</th>
                <th className="px-3 py-2">액션</th>
              </tr>
            </thead>
            <tbody>
              {(recentWorker ? recentItems : []).map((s, idx) => (
                <tr key={`recent-${s.worker_id}-${s.year}-${s.month}-${idx}`} className="border-t">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      aria-label="선택"
                      checked={recentSelected.has(makeKey(s))}
                      onChange={() => toggleRecentEntry(s)}
                    />
                  </td>
                  <td className="px-3 py-2">{workerNameMap[s.worker_id] || '—'}</td>
                  <td className="px-3 py-2">{s.month_label || `${s.year}-${String(s.month).padStart(2, '0')}`}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      <span className="px-2 py-1 rounded-full text-xs bg-amber-50 text-amber-700">발행</span>
                      {s.status === 'paid' && (
                        <span className="px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-700">지급</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right">
                    {s.daily_rate != null ? `₩${Number(s.daily_rate).toLocaleString()}` : '—'}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {typeof s.totalManDays === 'number'
                      ? Number(s.totalManDays).toFixed(1)
                      : typeof (s as any).workDays === 'number'
                        ? Number((s as any).workDays).toFixed(1)
                        : '—'}
                  </td>
                  <td className="px-3 py-2 text-right">₩{(s.salary?.total_gross_pay ?? 0).toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">₩{(s.salary?.total_deductions ?? 0).toLocaleString()}</td>
                  <td className="px-3 py-2 text-right font-semibold">₩{(s.salary?.net_pay ?? 0).toLocaleString()}</td>
                  <td className="px-3 py-2 flex items-center gap-2">
                    <button
                      className="px-2 py-1 text-xs rounded-md bg-emerald-600 text-white"
                    onClick={() => {
                      const displayName = (workerNameMap[s.worker_id] || '').trim()
                      const query = displayName ? `?name=${encodeURIComponent(displayName)}` : ''
                      openFileRecordInNewTab({
                        file_url: `/payslip/${s.worker_id}/${s.year}/${s.month}${query}`,
                        file_name: `${displayName || 'payslip'}-${s.year}-${s.month}.html`,
                        title: `${displayName || '급여'} ${s.year}-${s.month}`,
                      })
                    }}
                  >
                      HTML 보기
                    </button>
                    <button
                      className="px-2 py-1 text-xs rounded-md bg-indigo-600 text-white"
                      onClick={() => paySingle(s)}
                    >
                      지급
                    </button>
                  </td>
                </tr>
              ))}
              {recentWorker && recentItems.length === 0 && !recentLoading && (
                <tr>
                  <td className="px-3 py-6 text-center text-gray-500" colSpan={10}>
                    최근 데이터가 없습니다.
                  </td>
                </tr>
              )}
              {!recentWorker && (
                <tr>
                  <td className="px-3 py-6 text-center text-gray-500" colSpan={10}>
                    이름을 선택하면 최근 명세서가 표시됩니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
