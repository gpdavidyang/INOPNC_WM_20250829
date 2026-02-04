'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'
import { Calendar, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

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
    <div className="space-y-8">
      {/* 월별 조회 섹션 */}
      <Card className="rounded-3xl border-gray-200 shadow-sm shadow-gray-200/50">
        <CardContent className="pt-6 space-y-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <div className="w-1.5 h-6 bg-blue-600 rounded-sm" />
              월별 명세서 조회
            </h2>
            <p className="text-sm text-muted-foreground">발행된 명세서를 조건별로 검색하고 승인/지급 상태를 관리합니다.</p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-medium text-muted-foreground tracking-tight ml-1">년월 선택</span>
              <div className="relative w-fit">
                <Input
                  type="month"
                  className="h-10 w-40 rounded-xl bg-gray-50 border-none pl-4 pr-10 text-sm font-medium"
                  value={yearMonth}
                  onChange={e => setYearMonth(e.target.value || getDefaultYearMonth())}
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-medium text-muted-foreground tracking-tight ml-1">작업자 필터</span>
              <CustomSelect
                value={selectedWorker || 'all'}
                onValueChange={value => setSelectedWorker(value === 'all' ? '' : value)}
              >
                <CustomSelectTrigger className="h-10 w-48 rounded-xl bg-gray-50 border-none px-4 text-sm font-medium">
                  <CustomSelectValue placeholder="전체 작업자" />
                </CustomSelectTrigger>
                <CustomSelectContent>
                  <CustomSelectItem value="all">전체 작업자</CustomSelectItem>
                  {workers.map(w => (
                    <CustomSelectItem key={w.id} value={w.id}>{w.full_name}</CustomSelectItem>
                  ))}
                </CustomSelectContent>
              </CustomSelect>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-medium text-muted-foreground tracking-tight ml-1">고용 형태</span>
              <CustomSelect
                value={employmentType || 'all'}
                onValueChange={value => setEmploymentType(value === 'all' ? '' : (value as any))}
              >
                <CustomSelectTrigger className="h-10 w-40 rounded-xl bg-gray-50 border-none px-4 text-sm font-medium">
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

            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchList}
                className="h-10 rounded-xl px-4 border-gray-200 font-bold"
                disabled={loading}
              >
                <span>동기화</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportCSV}
                className="h-10 rounded-xl px-4 border-gray-200 font-bold"
              >
                <span>CSV 다운로드</span>
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => paySelected()}
                disabled={selectedKeys.size === 0}
                className="h-10 rounded-xl px-6 bg-[#1A254F] hover:bg-[#2A355F] text-white font-bold"
              >
                <span>선택 지급 ({selectedKeys.size})</span>
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-[#8da0cd] text-white">
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        className="rounded border-none bg-white/20"
                        checked={selectedKeys.size > 0 && selectedKeys.size === filtered.length}
                        onChange={onSelectAll}
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-bold">이름</th>
                    <th className="px-4 py-3 text-left font-bold">년월</th>
                    <th className="px-4 py-3 text-left font-bold">상태</th>
                    <th className="px-4 py-3 text-right font-bold">총공수</th>
                    <th className="px-4 py-3 text-right font-bold">실수령액</th>
                    <th className="px-4 py-3 text-center font-bold">액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-600">
                  {filtered.map((s, idx) => {
                    const isPaid = s.status === 'paid'
                    return (
                      <tr key={`${s.worker_id}-${s.year}-${s.month}-${idx}`} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            checked={selectedKeys.has(makeKey(s))}
                            onChange={() => toggleSelect(s)}
                          />
                        </td>
                        <td className="px-4 py-3 font-bold text-gray-900">{workerNameMap[s.worker_id] || '—'}</td>
                        <td className="px-4 py-3 font-medium">{s.month_label}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-100">발행</Badge>
                            {isPaid && <Badge variant="default" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-100">지급완료</Badge>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-bold">
                          {Number(s.totalManDays || (s as any).workDays || 0).toFixed(1)} <span className="text-[10px] opacity-40">공수</span>
                        </td>
                        <td className="px-4 py-3 text-right font-black text-[#1A254F]">
                          ₩{(s.salary?.net_pay ?? 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                             <Button
                                variant="outline"
                                size="xs"
                                className="h-8 rounded-md px-3 text-xs border-gray-200 gap-1.5"
                                onClick={() => {
                                  const displayName = (workerNameMap[s.worker_id] || '').trim()
                                  const query = displayName ? `?name=${encodeURIComponent(displayName)}` : ''
                                  window.open(`/payslip/${s.worker_id}/${s.year}/${s.month}${query}`, '_blank')
                                }}
                              >
                                <Search className="w-3 h-3 text-gray-400" />
                                명세서
                              </Button>
                              {!isPaid && (
                                <Button
                                  variant="secondary"
                                  size="xs"
                                  className="h-8 rounded-md px-3 text-xs"
                                  onClick={() => paySingle(s)}
                                >
                                  지급처리
                                </Button>
                              )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {filtered.length === 0 && !loading && (
                    <tr>
                      <td className="px-4 py-16 text-center text-gray-400" colSpan={7}>
                        {selectedWorker ? "해당 작업자의 발행 내역이 없습니다." : "조회된 명세서가 없습니다."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 이름별 조회 섹션 */}
      <Card className="rounded-3xl border-gray-200 shadow-sm shadow-gray-200/50">
        <CardContent className="pt-6 space-y-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-black text-foreground flex items-center gap-2">
              <div className="w-1.5 h-6 bg-emerald-600 rounded-sm" />
              이름별 최근 내역 모니터링
            </h2>
            <p className="text-sm text-muted-foreground">특정 작업자의 과거 발행 내역을 시계열로 확인하고 일괄 관리합니다.</p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-medium text-muted-foreground tracking-tight ml-1">작업자 선택</span>
              <CustomSelect
                value={recentWorker || undefined}
                onValueChange={value => setRecentWorker(value)}
              >
                <CustomSelectTrigger className="h-10 w-64 rounded-xl bg-gray-50 border-none px-4 text-sm font-medium">
                  <CustomSelectValue placeholder="이름을 선택하세요" />
                </CustomSelectTrigger>
                <CustomSelectContent>
                  {uniqueWorkerOptions.map(w => (
                    <CustomSelectItem key={w.id} value={w.id}>{w.full_name}</CustomSelectItem>
                  ))}
                </CustomSelectContent>
              </CustomSelect>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-medium text-muted-foreground tracking-tight ml-1">조회 범위</span>
              <CustomSelect
                value={recentRange}
                onValueChange={value => setRecentRange(value as any)}
              >
                <CustomSelectTrigger className="h-10 w-40 rounded-xl bg-gray-50 border-none px-4 text-sm font-medium">
                  <CustomSelectValue placeholder="최근 3개월" />
                </CustomSelectTrigger>
                <CustomSelectContent>
                  <CustomSelectItem value="3">최근 3개월</CustomSelectItem>
                  <CustomSelectItem value="6">최근 6개월</CustomSelectItem>
                  <CustomSelectItem value="12">최근 12개월</CustomSelectItem>
                </CustomSelectContent>
              </CustomSelect>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchRecentSnapshots}
                className="h-10 rounded-xl px-4 border-gray-200 font-bold"
                disabled={recentLoading}
              >
                <span>새로고침</span>
              </Button>
              <Button
                variant="default"
                size="sm"
                className="h-10 rounded-xl px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                onClick={async () => {
                  const entries = recentItems.filter(s => recentSelected.has(makeKey(s))).map(toEntry).filter(e => !!e) as any[]
                  await paySelected(entries)
                  setRecentSelected(new Set())
                }}
                disabled={!recentWorker || recentSelected.size === 0}
              >
                <span>선택 지급 ({recentSelected.size})</span>
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-[#8da0cd] text-white">
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        className="rounded border-none bg-white/20"
                        checked={recentWorker && recentSelected.size > 0 && recentSelected.size === recentItems.length}
                        onChange={onSelectAllRecent}
                        disabled={!recentWorker || recentItems.length === 0}
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-bold">대상 월</th>
                    <th className="px-4 py-3 text-left font-bold">상태</th>
                    <th className="px-4 py-3 text-right font-bold">실수령액</th>
                    <th className="px-4 py-3 text-center font-bold">액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-600">
                  {recentItems.map((s, idx) => {
                     const isPaid = s.status === 'paid'
                     return (
                        <tr key={`recent-${s.worker_id}-${s.year}-${s.month}-${idx}`} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300"
                              checked={recentSelected.has(makeKey(s))}
                              onChange={() => toggleRecentEntry(s)}
                            />
                          </td>
                          <td className="px-4 py-3 font-bold text-gray-900">{s.month_label}</td>
                          <td className="px-4 py-3">
                             <div className="flex gap-1">
                                <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-100">발행</Badge>
                                {isPaid && <Badge variant="default" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-100">지급완료</Badge>}
                             </div>
                          </td>
                          <td className="px-4 py-3 text-right font-black text-[#1A254F]">
                             ₩{(s.salary?.net_pay ?? 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center gap-2">
                               <Button variant="outline" size="xs" className="h-8 rounded-md" onClick={() => {
                                  const displayName = (workerNameMap[s.worker_id] || '').trim()
                                  const query = displayName ? `?name=${encodeURIComponent(displayName)}` : ''
                                  window.open(`/payslip/${s.worker_id}/${s.year}/${s.month}${query}`, '_blank')
                               }}>명세서</Button>
                               {!isPaid && <Button variant="secondary" size="xs" className="h-8 rounded-md" onClick={() => paySingle(s)}>지급</Button>}
                            </div>
                          </td>
                        </tr>
                     )
                  })}
                  {recentWorker && recentItems.length === 0 && !recentLoading && (
                    <tr>
                      <td className="px-4 py-16 text-center text-gray-400" colSpan={5}>
                        해당 기간의 발행 내역이 없습니다.
                      </td>
                    </tr>
                  )}
                  {!recentWorker && (
                    <tr>
                      <td className="px-4 py-16 text-center text-gray-400" colSpan={5}>
                        좌측 이름 선택 후 조회를 시작하세요.
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
