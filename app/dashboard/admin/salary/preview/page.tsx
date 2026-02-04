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
import { t } from '@/lib/ui/strings'
import { Calendar, FileText, RefreshCw, Search } from 'lucide-react'
import React, { useEffect, useMemo, useState } from 'react'

type WorkerPreview = {
  worker_id: string
  name: string
  employment_type: string | null
  employment_type_label?: string | null
  daily_rate: number | null
  total_labor_hours: number
  total_gross_pay: number
  net_pay: number
  status?: 'issued' | 'approved' | 'paid' | null
  issued_at?: string | null
}

function ym(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function PayrollPreviewPage() {
  const { toast } = useToast()
  const [yearMonth, setYearMonth] = useState<string>(ym())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rows, setRows] = useState<WorkerPreview[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')
  const [detail, setDetail] = useState<any | null>(null)
  const [detailWorker, setDetailWorker] = useState<WorkerPreview | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [employmentType, setEmploymentType] = useState<
    '' | 'freelancer' | 'daily_worker' | 'regular_employee'
  >('')
  const [workerOptions, setWorkerOptions] = useState<Array<{ id: string; name: string }>>([])
  const [workerId, setWorkerId] = useState<string>('')
  const [publishLoading, setPublishLoading] = useState(false)
  const [publishProgress, setPublishProgress] = useState<{ total: number; current: number } | null>(
    null
  )

  const [y, m] = useMemo(() => yearMonth.split('-'), [yearMonth])

  const fetchAll = async () => {
    if (!yearMonth) return
    setLoading(true)
    setError('')
    try {
      const qs = new URLSearchParams({ year: String(Number(y)), month: String(Number(m)) })
      if (employmentType) qs.set('employmentType', employmentType)
      const res = await fetch(`/api/admin/payroll/summary/workers?${qs.toString()}`)
      const json = await res.json()
      if (!res.ok || json?.success === false) throw new Error(json?.error || '조회 실패')
      const list: WorkerPreview[] = json.data || []
      setRows(list)
      const workerMap = list.reduce((map, item) => {
        if (item.worker_id) {
          const name = (item.name || '').trim() || '-'
          if (!map.has(item.worker_id)) {
            map.set(item.worker_id, { id: item.worker_id, name })
          }
        }
        return map
      }, new Map<string, { id: string; name: string }>())
      const dedupedOptions = Array.from(workerMap.values()).sort((a, b) => {
        const an = (a?.name || '').trim()
        const bn = (b?.name || '').trim()
        if (!an && !bn) return 0
        if (!an) return 1
        if (!bn) return -1
        try {
          return an.localeCompare(bn, 'ko', { sensitivity: 'base' })
        } catch {
          return an > bn ? 1 : an < bn ? -1 : 0
        }
      })
      setWorkerOptions(dedupedOptions)
      setWorkerId(prev => {
        if (!prev) return ''
        return dedupedOptions.some(option => option.id === prev) ? prev : ''
      })
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

  const employmentTypeLabel = {
    freelancer: '프리랜서',
    daily_worker: '일용직',
    regular_employee: '상용직',
  } as Record<string, string>
  const formatEmploymentType = (
    val: string | null | undefined,
    label?: string | null | undefined
  ) => {
    if (label && label !== '-') return label
    const key = String(val || '').toLowerCase()
    return employmentTypeLabel[key] || val || '-'
  }

  const openDetail = async (worker: WorkerPreview) => {
    setDetail(null)
    setDetailWorker(worker)
    setDetailLoading(true)
    try {
      const res = await fetch('/api/admin/payroll/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: worker.worker_id, year: Number(y), month: Number(m) }),
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

  const summarizeDefaultRate = () => {
    const rawType = String(detail?.employment_type || detailWorker?.employment_type || '').trim()
    const normalized = rawType.toLowerCase()
    if (
      normalized === 'freelancer' ||
      normalized === 'daily_worker' ||
      rawType === '프리랜서' ||
      rawType === '일용직'
    ) {
      return '소득세 3.0% + 지방세 0.3%'
    }
    return null
  }

  const rateEntries = useMemo(() => {
    const entries = detail?.rates ? Object.entries(detail.rates as Record<string, number>) : []
    if (entries.length === 0) return null
    const labelMap: Record<string, string> = {
      income_tax: '소득세',
      local_tax: '지방세',
      national_pension: '국민연금',
      health_insurance: '건강보험',
      employment_insurance: '고용보험',
    }
    return entries.map(([key, value]) => ({
      label: labelMap[key] || key,
      value,
    }))
  }, [detail?.rates])

  const filtered = useMemo(() => {
    const q = query.trim()
    let list = rows
    if (q) list = list.filter(r => r.name?.toLowerCase().includes(q.toLowerCase()))
    if (employmentType) list = list.filter(r => r.employment_type === employmentType)
    if (workerId) list = list.filter(r => r.worker_id === workerId)
    return list
  }, [rows, query, employmentType, workerId])

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

  const publishableSelectedIds = useMemo(() => {
    return Array.from(selected).filter(id => {
      const row = rows.find(r => r.worker_id === id)
      return row && !row.status
    })
  }, [selected, rows])
  const hasPublishableSelection = publishableSelectedIds.length > 0

  const publishSelected = async () => {
    const ids = Array.from(publishableSelectedIds)
    if (ids.length === 0) {
      toast({ title: '발행 불가', description: '발행 가능한 선택 대상이 없습니다.', variant: 'destructive' })
      return
    }
    setPublishLoading(true)
    setPublishProgress({ total: ids.length, current: 0 })
    const res = await fetch('/api/admin/payroll/snapshots/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year: Number(y), month: Number(m), userIds: ids }),
    })
    const json = await res.json()
    if (!res.ok || json?.success === false) {
      toast({ title: '발행 실패', description: json?.error || '발행 실패', variant: 'destructive' })
    } else {
      setPublishProgress(prev =>
        prev ? { ...prev, current: prev.total } : { total: ids.length, current: ids.length }
      )
      toast({ title: '발행 완료', description: `${json.inserted}건 처리되었습니다.` })
      await fetchAll()
      setSelected(new Set())
    }
    setPublishProgress(null)
    setPublishLoading(false)
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border-gray-200 shadow-sm shadow-gray-200/50">
        <CardContent className="pt-6 space-y-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-medium text-muted-foreground tracking-tight ml-1">년월 선택</span>
              <div className="relative w-fit">
                <Input
                  type="month"
                  className="h-10 w-40 rounded-xl bg-gray-50 border-none pl-4 pr-10 text-sm font-medium"
                  value={yearMonth}
                  onChange={e => setYearMonth(e.target.value)}
                  aria-label="년월"
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
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

            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-medium text-muted-foreground tracking-tight ml-1">직접 이름 검색</span>
              <div className="relative w-fit">
                <Input
                  type="search"
                  placeholder="이름 검색"
                  className="h-10 w-64 rounded-xl bg-gray-50 border-none pl-10 pr-4 text-sm font-medium"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchAll}
                className="h-10 rounded-xl px-4 border-gray-200 font-bold"
                disabled={loading}
              >
                <span>{t('common.refresh')}</span>
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={publishSelected}
                disabled={!hasPublishableSelection || publishLoading}
                className="h-10 rounded-xl px-6 bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap font-bold"
              >
                <span>선택 발행 ({publishableSelectedIds.length})</span>
              </Button>
            </div>
          </div>

          {publishLoading && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 text-sm space-y-3">
              <div className="font-black text-blue-900 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                급여명세서 발행 중...
              </div>
              {publishProgress && (
                <div className="space-y-1.5">
                  <div className="h-1.5 w-full bg-blue-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${(publishProgress.current / publishProgress.total) * 100}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-blue-700 font-bold text-right">
                    {publishProgress.current} / {publishProgress.total} 처리 완료
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
            <div className="bg-slate-50 p-5 rounded-2xl flex flex-col gap-1.5 border border-slate-100">
              <div className="text-[11px] font-medium uppercase tracking-tighter text-[#1A254F] opacity-40">
                조회 인원
              </div>
              <div className="text-2xl font-bold text-[#1A254F] italic tracking-tight">
                {totals.count}<span className="text-sm font-medium not-italic ml-1 opacity-50">명</span>
              </div>
            </div>
            <div className="bg-indigo-50/50 p-5 rounded-2xl flex flex-col gap-1.5 border border-indigo-100/50">
              <div className="text-[11px] font-medium uppercase tracking-tighter text-[#1A254F] opacity-40">
                총지급액
              </div>
              <div className="text-2xl font-bold text-[#1A254F] italic tracking-tight">
                <span className="text-lg font-medium not-italic mr-0.5 opacity-50">₩</span>
                {totals.gross.toLocaleString()}
              </div>
            </div>
            <div className="bg-emerald-50/20 p-5 rounded-2xl flex flex-col gap-1.5 border border-emerald-100/50">
              <div className="text-[11px] font-medium uppercase tracking-tighter text-emerald-600 opacity-50">
                총실수령액
              </div>
              <div className="text-2xl font-bold text-emerald-700 italic tracking-tight">
                <span className="text-lg font-medium not-italic mr-0.5 opacity-50">₩</span>
                {totals.net.toLocaleString()}
              </div>
            </div>
            <div className="bg-slate-50 p-5 rounded-2xl flex flex-col gap-1.5 border border-slate-100">
              <div className="text-[11px] font-medium uppercase tracking-tighter text-[#1A254F] opacity-40">
                선택 대상
              </div>
              <div className="text-2xl font-bold text-[#1A254F] italic tracking-tight">
                {selected.size}<span className="text-sm font-medium not-italic ml-1 opacity-50">명</span>
              </div>
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
                        checked={selected.size > 0 && selected.size === filtered.length}
                        onChange={selectAll}
                        aria-label="전체 선택"
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-bold">이름</th>
                    <th className="px-4 py-3 text-left font-bold">고용형태</th>
                    <th className="px-4 py-3 text-left font-bold">상태</th>
                    <th className="px-4 py-3 text-right font-bold">총공수</th>
                    <th className="px-4 py-3 text-right font-bold">총실수령</th>
                    <th className="px-4 py-3 text-center font-bold">액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(w => {
                    const issued = Boolean(w.status)
                    return (
                      <tr key={w.worker_id} className={`hover:bg-gray-50/50 transition-colors ${issued ? 'bg-gray-50/20' : ''}`}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            checked={selected.has(w.worker_id)}
                            onChange={() => toggle(w.worker_id)}
                            disabled={publishLoading}
                          />
                        </td>
                        <td className="px-4 py-3 font-bold text-gray-900">{w.name}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-medium text-xs border border-gray-200">
                            {formatEmploymentType(w.employment_type, w.employment_type_label)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge 
                            variant={issued ? "default" : "outline"}
                            className={issued ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "text-gray-400 border-gray-200"}
                          >
                            {issued ? '발행완료' : '미발행'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-600">
                          {formatManhours(w.total_labor_hours)} <span className="text-[10px] opacity-40">공수</span>
                        </td>
                        <td className="px-4 py-3 text-right font-black text-[#1A254F]">
                          ₩{w.net_pay.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                             <Button
                                variant="outline"
                                size="xs"
                                className="h-8 rounded-md px-3 text-xs border-gray-200 whitespace-nowrap gap-1.5"
                                onClick={() => {
                                  const safeName = (w.name || '').trim()
                                  const query = safeName ? `?name=${encodeURIComponent(safeName)}` : ''
                                  window.open(`/payslip/${w.worker_id}/${y}/${m}${query}`, '_blank')
                                }}
                              >
                                <FileText className="w-3 h-3 text-gray-400" />
                                미리보기
                              </Button>
                              <Button
                                variant="secondary"
                                size="xs"
                                className="h-8 rounded-md px-3 text-xs whitespace-nowrap"
                                onClick={() => openDetail(w)}
                              >
                                계산상세
                              </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {!loading && filtered.length === 0 && (
                    <tr>
                      <td className="px-4 py-16 text-center text-gray-400" colSpan={7}>
                        조회된 데이터가 없습니다. 년월을 확인해 주세요.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {detailWorker && (
              <div className="space-y-4">
                <h4 className="text-lg font-black text-foreground flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-blue-600 rounded-sm" />
                  계산 상세 모니터: {detailWorker.name}
                </h4>
                {detailLoading ? (
                  <div className="p-10 text-center text-gray-400 animate-pulse">상세 계산 산출 중...</div>
                ) : detail ? (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col gap-3">
                      <div className="text-[11px] font-black uppercase tracking-tighter opacity-30 text-[#1A254F]">기본 지급 항목</div>
                      <dl className="grid grid-cols-2 gap-y-2 text-sm font-bold">
                        <dt className="text-gray-500">근무일수</dt>
                        <dd className="text-right">{detail.work_days}일</dd>
                        <dt className="text-gray-500">총 공수</dt>
                        <dd className="text-right">{formatManhours(detail.total_labor_hours)} H</dd>
                        <dt className="text-gray-500 pt-2 border-t border-slate-200">총급여액</dt>
                        <dd className="text-right pt-2 border-t border-slate-200 text-blue-700">₩{Number(detail.total_gross_pay).toLocaleString()}</dd>
                      </dl>
                    </div>
                    <div className="bg-rose-50/30 p-5 rounded-2xl border border-rose-100/50 flex flex-col gap-3">
                      <div className="text-[11px] font-black uppercase tracking-tighter opacity-30 text-rose-600">공제/세율 정보</div>
                      <div className="flex-1 space-y-2">
                        {rateEntries ? (
                          <div className="grid grid-cols-2 gap-y-1 text-xs font-bold text-rose-800">
                             {rateEntries.map(entry => (
                               <React.Fragment key={entry.label}>
                                 <dt>{entry.label}</dt>
                                 <dd className="text-right">{entry.value}%</dd>
                               </React.Fragment>
                             ))}
                          </div>
                        ) : (
                          <div className="text-xs text-rose-700/60 font-medium">
                            {summarizeDefaultRate() || '표준 세율 적용'}
                          </div>
                        )}
                        <div className="pt-2 border-t border-rose-200 flex justify-between items-center">
                          <span className="text-sm font-black text-rose-800">공제 합계</span>
                          <span className="text-sm font-black text-rose-800">₩{Number(detail.total_deductions).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
            
            {error && (
              <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl text-rose-700 text-sm flex items-center gap-3 self-end">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                {error}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function formatManhours(v: unknown): string {
  const n = Number(v)
  if (!Number.isFinite(n)) return '0.0'
  const floored = Math.floor(n * 10) / 10
  return floored.toFixed(1)
}
