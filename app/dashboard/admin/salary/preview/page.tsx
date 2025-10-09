'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { t } from '@/lib/ui/strings'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'

type WorkerPreview = {
  worker_id: string
  name: string
  employment_type: string | null
  daily_rate: number | null
  total_labor_hours: number
  total_gross_pay: number
  net_pay: number
}

function ym(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function PayrollPreviewPage() {
  const supabase = useMemo(() => createClient(), [])
  const { toast } = useToast()
  const [yearMonth, setYearMonth] = useState<string>(ym())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rows, setRows] = useState<WorkerPreview[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')
  const [detail, setDetail] = useState<any | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [employmentType, setEmploymentType] = useState<
    '' | 'freelancer' | 'daily_worker' | 'regular_employee'
  >('')
  const [siteId, setSiteId] = useState<string>('')
  const [siteOptions, setSiteOptions] = useState<Array<{ id: string; name: string }>>([])
  const [workerSites, setWorkerSites] = useState<Record<string, string[]>>({})
  const [autoProcess, setAutoProcess] = useState<boolean>(false)

  const [y, m] = useMemo(() => yearMonth.split('-'), [yearMonth])

  const fetchAll = async () => {
    if (!yearMonth) return
    setLoading(true)
    setError('')
    try {
      const qs = new URLSearchParams({ year: String(Number(y)), month: String(Number(m)) })
      if (employmentType) qs.set('employmentType', employmentType)
      if (siteId) qs.set('siteId', siteId)
      const res = await fetch(`/api/admin/payroll/summary/workers?${qs.toString()}`)
      const json = await res.json()
      if (!res.ok || json?.success === false) throw new Error(json?.error || '조회 실패')
      const list: WorkerPreview[] = json.data || []
      setRows(list)
      // Load sites for month to support site filter
      await loadSitesForMonth(list.map(r => r.worker_id))
      setSelected(new Set())
    } catch (e: any) {
      setRows([])
      setError(e?.message || '조회 실패')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearMonth])

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    setSelected(prev => {
      if (prev.size === filtered.length) return new Set()
      return new Set(filtered.map(r => r.worker_id))
    })
  }

  const publishSelected = async () => {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    const res = await fetch('/api/admin/payroll/snapshots/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year: Number(y), month: Number(m), userIds: ids }),
    })
    const json = await res.json()
    if (!res.ok || json?.success === false) {
      toast({ title: '발행 실패', description: json?.error || '발행 실패', variant: 'destructive' })
    } else {
      if (autoProcess) {
        const entries = ids.map(id => ({ userId: id, year: Number(y), month: Number(m) }))
        try {
          const approveRes = await fetch('/api/admin/payroll/snapshots/approve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entries }),
          })
          const approveJson = await approveRes.json()
          if (!approveRes.ok || approveJson?.success === false)
            throw new Error(approveJson?.error || '승인 실패')
          const payRes = await fetch('/api/admin/payroll/snapshots/pay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entries }),
          })
          const payJson = await payRes.json()
          if (!payRes.ok || payJson?.success === false)
            throw new Error(payJson?.error || '지급 실패')
          toast({ title: '완료', description: `발행/승인/지급 완료 (${json.inserted}건)` })
        } catch (e: any) {
          toast({ title: '처리 실패', description: e?.message || '연속 처리 중 오류', variant: 'destructive' })
        }
      } else {
        toast({ title: '발행 완료', description: `${json.inserted}건 처리되었습니다.` })
      }
    }
  }

  const publishAll = async () => {
    const ids = filtered.map(r => r.worker_id)
    if (ids.length === 0) return
    const res = await fetch('/api/admin/payroll/snapshots/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year: Number(y), month: Number(m), userIds: ids }),
    })
    const json = await res.json()
    if (!res.ok || json?.success === false) {
      toast({ title: '발행 실패', description: json?.error || '발행 실패', variant: 'destructive' })
    } else {
      if (autoProcess) {
        const entries = ids.map(id => ({ userId: id, year: Number(y), month: Number(m) }))
        try {
          const approveRes = await fetch('/api/admin/payroll/snapshots/approve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entries }),
          })
          const approveJson = await approveRes.json()
          if (!approveRes.ok || approveJson?.success === false)
            throw new Error(approveJson?.error || '승인 실패')
          const payRes = await fetch('/api/admin/payroll/snapshots/pay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entries }),
          })
          const payJson = await payRes.json()
          if (!payRes.ok || payJson?.success === false)
            throw new Error(payJson?.error || '지급 실패')
          toast({ title: '완료', description: `발행/승인/지급 완료 (${json.inserted}건)` })
        } catch (e: any) {
          toast({ title: '처리 실패', description: e?.message || '연속 처리 중 오류', variant: 'destructive' })
        }
      } else {
        toast({ title: '발행 완료', description: `${json.inserted}건 처리되었습니다.` })
      }
    }
  }

  const approveSelected = async () => {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    const entries = ids.map(id => ({ userId: id, year: Number(y), month: Number(m) }))
    try {
      const res = await fetch('/api/admin/payroll/snapshots/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries }),
      })
      const json = await res.json()
      if (!res.ok || json?.success === false) throw new Error(json?.error || '선택 승인 실패')
      toast({ title: '승인 완료', description: '선택 항목이 승인되었습니다.' })
    } catch (e: any) {
      toast({ title: '승인 실패', description: e?.message || '선택 승인 실패', variant: 'destructive' })
    }
  }

  const paySelected = async () => {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    const entries = ids.map(id => ({ userId: id, year: Number(y), month: Number(m) }))
    try {
      const res = await fetch('/api/admin/payroll/snapshots/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries }),
      })
      const json = await res.json()
      if (!res.ok || json?.success === false) throw new Error(json?.error || '선택 지급 실패')
      toast({ title: '지급 완료', description: '선택 항목이 지급 처리되었습니다.' })
    } catch (e: any) {
      toast({ title: '지급 실패', description: e?.message || '선택 지급 실패', variant: 'destructive' })
    }
  }

  async function loadSitesForMonth(workerIds: string[]) {
    try {
      const year = Number(y)
      const month = Number(m)
      if (!year || !month) return
      const start = `${y}-${m}-01`
      const end = new Date(year, month, 0).toISOString().split('T')[0]
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
  }

  const openDetail = async (workerId: string) => {
    setDetail(null)
    setDetailLoading(true)
    try {
      const res = await fetch('/api/admin/payroll/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: workerId, year: Number(y), month: Number(m) }),
      })
      const json = await res.json()
      if (!res.ok || json?.success === false) throw new Error(json?.error || '미리보기 실패')
      setDetail(json.data)
    } catch (e: any) {
      toast({ title: '미리보기 실패', description: e?.message || '미리보기 실패', variant: 'destructive' })
    } finally {
      setDetailLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim()
    let list = rows
    if (q) list = list.filter(r => r.name?.toLowerCase().includes(q.toLowerCase()))
    if (employmentType) list = list.filter(r => r.employment_type === employmentType)
    if (siteId) list = list.filter(r => (workerSites[r.worker_id] || []).includes(siteId))
    return list
  }, [rows, query, employmentType, siteId, workerSites])

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, r) => {
        acc.count += 1
        acc.gross += r.total_gross_pay || 0
        acc.net += r.net_pay || 0
        return acc
      },
      { count: 0, gross: 0, net: 0 }
    )
  }, [filtered])

  return (
    <div className="px-0 pb-8">
      <PageHeader
        title="급여 스냅샷 미리보기"
        description="선택 월/필터에 따라 발행 대상 및 금액 확인"
        breadcrumbs={[{ label: '대시보드', href: '/dashboard/admin' }, { label: '급여 관리', href: '/dashboard/admin/salary' }, { label: '스냅샷 미리보기' }]}
      />
      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-4">
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
        <input
          type="search"
          placeholder={t('common.search')}
          className="h-10 rounded-md bg-white text-gray-900 border border-gray-300 px-3 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-blue-500/30"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button
          type="button"
          onClick={fetchAll}
          className="px-3 py-2 bg-white text-gray-900 rounded-md text-sm border shadow-sm hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
          disabled={loading}
        >
          {t('common.refresh')}
        </button>
        <div className="flex-1" />
        <label className="inline-flex items-center gap-2 text-sm mr-2">
          <input
            type="checkbox"
            checked={autoProcess}
            onChange={e => setAutoProcess(e.target.checked)}
          />
          발행 후 자동 승인/지급
        </label>
        <button
          type="button"
          onClick={publishSelected}
          disabled={selected.size === 0}
          className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm disabled:bg-gray-400"
        >
          선택 발행
        </button>
        <button
          type="button"
          onClick={approveSelected}
          disabled={selected.size === 0}
          className="px-3 py-2 bg-white text-gray-900 rounded-md text-sm border shadow-sm disabled:opacity-60"
        >
          선택 승인
        </button>
        <button
          type="button"
          onClick={paySelected}
          disabled={selected.size === 0}
          className="px-3 py-2 bg-white text-gray-900 rounded-md text-sm border shadow-sm disabled:opacity-60"
        >
          선택 지급
        </button>
        <button
          type="button"
          onClick={publishAll}
          disabled={filtered.length === 0}
          className="px-3 py-2 bg-indigo-600 text-white rounded-md text-sm disabled:bg-gray-400"
        >
          전체 발행
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-[#F3F7FA] border-[#BAC6E1] p-4 min-h-[96px]">
          <div className="text-sm text-[#8DA0CD] mb-1">인원</div>
          <div className="text-2xl font-semibold">{totals.count}</div>
        </div>
        <div className="rounded-xl border bg-[#F3F7FA] border-[#BAC6E1] p-4 min-h-[96px]">
          <div className="text-sm text-[#8DA0CD] mb-1">총급여</div>
          <div className="text-2xl font-semibold">₩{totals.gross.toLocaleString()}</div>
        </div>
        <div className="rounded-xl border bg-[#F3F7FA] border-[#BAC6E1] p-4 min-h-[96px]">
          <div className="text-sm text-[#8DA0CD] mb-1">실수령</div>
          <div className="text-2xl font-semibold">₩{totals.net.toLocaleString()}</div>
        </div>
        <div className="rounded-xl border bg-[#F3F7FA] border-[#BAC6E1] p-4 min-h-[96px]">
          <div className="text-sm text-[#8DA0CD] mb-1">선택</div>
          <div className="text-2xl font-semibold">{selected.size}</div>
        </div>
      </div>

      <div className="overflow-x-auto border rounded-md">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-3 py-2">
                <input
                  type="checkbox"
                  aria-label="전체 선택"
                  checked={selected.size > 0 && selected.size === filtered.length}
                  onChange={selectAll}
                />
              </th>
              <th className="px-3 py-2">이름</th>
              <th className="px-3 py-2">형태</th>
              <th className="px-3 py-2 text-right">일당</th>
              <th className="px-3 py-2 text-right">총공수</th>
              <th className="px-3 py-2 text-right">총급여</th>
              <th className="px-3 py-2 text-right">실수령</th>
              <th className="px-3 py-2">액션</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(w => (
              <tr key={w.worker_id} className="border-t">
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    aria-label="선택"
                    checked={selected.has(w.worker_id)}
                    onChange={() => toggle(w.worker_id)}
                  />
                </td>
                <td className="px-3 py-2">{w.name}</td>
                <td className="px-3 py-2">{w.employment_type || '-'}</td>
                <td className="px-3 py-2 text-right">
                  {w.daily_rate ? `₩${w.daily_rate.toLocaleString()}` : '-'}
                </td>
                <td className="px-3 py-2 text-right">{formatManhours(w.total_labor_hours)}</td>
                <td className="px-3 py-2 text-right">₩{w.total_gross_pay.toLocaleString()}</td>
                <td className="px-3 py-2 text-right font-semibold">
                  ₩{w.net_pay.toLocaleString()}
                </td>
                <td className="px-3 py-2 flex items-center gap-2">
                  <button
                    className="px-2 py-1 text-xs rounded-md bg-emerald-600 text-white"
                    onClick={() => window.open(`/payslip/${w.worker_id}/${y}/${m}`, '_blank')}
                  >
                    HTML 보기
                  </button>
                  <button
                    className="px-2 py-1 text-xs rounded-md bg-white border"
                    onClick={() => openDetail(w.worker_id)}
                  >
                    상세
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && !loading && (
              <tr>
                <td className="px-3 py-6 text-center text-gray-500" colSpan={8}>
                  표시할 데이터가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {detailLoading && <p className="text-sm text-gray-600">상세 계산 불러오는 중...</p>}
      {detail && (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="border rounded-md p-3">
            <h3 className="font-semibold mb-2">결과 요약</h3>
            <ul className="text-sm space-y-1">
              <li>
                공수: {detail.work_days}일 / 총공수 {formatManhours(detail.total_labor_hours)}
              </li>
              <li>
                근무시간: {detail.total_work_hours}h / 연장 {detail.total_overtime_hours}h
              </li>
              <li>기본급: ₩{Number(detail.base_pay || 0).toLocaleString()}</li>
              <li>연장수당: ₩{Number(detail.overtime_pay || 0).toLocaleString()}</li>
              <li>보너스: ₩{Number(detail.bonus_pay || 0).toLocaleString()}</li>
              <li>총액: ₩{Number(detail.total_gross_pay || 0).toLocaleString()}</li>
              <li>공제: ₩{Number(detail.total_deductions || 0).toLocaleString()}</li>
              <li className="font-semibold">
                실수령: ₩{Number(detail.net_pay || 0).toLocaleString()}
              </li>
            </ul>
          </div>
          <div className="border rounded-md p-3">
            <h3 className="font-semibold mb-2">세율 정보</h3>
            <div className="text-sm space-y-1">
              <div>출처: {detail.rate_source === 'custom' ? '개인설정' : '형태기본/가드'}</div>
              {detail.rates && (
                <ul className="text-xs list-disc pl-5">
                  {Object.entries(detail.rates).map(([k, v]) => (
                    <li key={k}>
                      {k}: {String(v)}%
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
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
