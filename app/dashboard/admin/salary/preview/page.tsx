'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { t } from '@/lib/ui/strings'
import { useToast } from '@/components/ui/use-toast'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'

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
  const statusLabel: Record<NonNullable<WorkerPreview['status']>, string> = {
    issued: '발행',
    approved: '승인',
    paid: '지급',
  }
  const getStatusBadgeClass = (status?: WorkerPreview['status']) => {
    if (status === 'paid') return 'bg-slate-100 text-slate-700'
    if (status === 'approved') return 'bg-green-50 text-green-700'
    if (status === 'issued') return 'bg-amber-50 text-amber-700'
    return 'bg-gray-100 text-gray-500'
  }
  const isPublished = (row: WorkerPreview) => Boolean(row.status)

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

  const employmentSelectValue = employmentType || 'all'
  const workerSelectValue = workerId || 'all'

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
      return row && !isPublished(row)
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
    <div className="px-0 pb-8">
      <PageHeader
        title="급여계산 & 급여명세서 발행"
        description="선택 월/필터에 따라 급여를 계산하고 필요한 대상에게 즉시 발행하세요"
        breadcrumbs={[
          { label: '대시보드', href: '/dashboard/admin' },
          { label: '급여 관리', href: '/dashboard/admin/salary' },
          { label: '급여계산 & 급여명세서 발행' },
        ]}
      />
      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-auto">
          <input
            type="month"
            className="h-10 w-full sm:w-36 rounded-md bg-white text-gray-900 border border-gray-300 px-3 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-blue-500/30"
            value={yearMonth}
            onChange={e => setYearMonth(e.target.value)}
            aria-label="년월"
          />
        </div>
        <div className="w-full sm:w-40">
          <CustomSelect
            value={employmentSelectValue}
            onValueChange={value =>
              setEmploymentType(value === 'all' ? '' : (value as typeof employmentType))
            }
          >
            <CustomSelectTrigger
              className="h-10 w-full rounded-md bg-white text-gray-900 border border-gray-300 px-3 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-blue-500/30"
              aria-label="고용형태"
            >
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
        <div className="w-full sm:w-40">
          <CustomSelect
            value={workerSelectValue}
            onValueChange={value => setWorkerId(value === 'all' ? '' : value)}
          >
            <CustomSelectTrigger
              className="h-10 w-full rounded-md bg-white text-gray-900 border border-gray-300 px-3 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-blue-500/30"
              aria-label="이름"
            >
              <CustomSelectValue placeholder="전체 이름" />
            </CustomSelectTrigger>
            <CustomSelectContent>
              <CustomSelectItem value="all">전체 이름</CustomSelectItem>
              {workerOptions.map(option => (
                <CustomSelectItem key={option.id} value={option.id}>
                  {option.name}
                </CustomSelectItem>
              ))}
            </CustomSelectContent>
          </CustomSelect>
        </div>
        <div className="flex-1 min-w-[160px]">
          <input
            type="search"
            placeholder="이름 검색"
            className="h-10 w-full rounded-md bg-white text-gray-900 border border-gray-300 px-3 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-blue-500/30"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      </div>
      <p className="text-xs text-gray-500">
        선택한 월에 대해 계산된 급여명세서가 있는 작업자만 이름 목록에 표시됩니다.
      </p>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={fetchAll}
          className="px-3 py-2 bg-white text-gray-900 rounded-md text-sm border shadow-sm hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
          disabled={loading}
        >
          {t('common.refresh')}
        </button>
        <button
          type="button"
          onClick={publishSelected}
          disabled={!hasPublishableSelection || publishLoading}
          className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm disabled:bg-gray-400"
        >
          선택 발행
        </button>
      </div>

      {publishLoading && (
        <div className="border border-blue-200 bg-blue-50 text-blue-800 text-sm rounded-md p-3">
          <div className="font-medium mb-1">급여명세서 발행 중...</div>
          {publishProgress && publishProgress.total > 0 ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-blue-100 rounded">
                <div
                  className="h-2 bg-blue-500 rounded"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round((publishProgress.current / publishProgress.total) * 100)
                    )}%`,
                  }}
                />
              </div>
              <div className="text-xs">
                {publishProgress.current}/{publishProgress.total}
              </div>
            </div>
          ) : (
            <div className="text-xs">요청 준비 중...</div>
          )}
        </div>
      )}

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
              <th className="px-3 py-2">고용형태</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2 text-right">일당</th>
              <th className="px-3 py-2 text-right">총공수</th>
              <th className="px-3 py-2 text-right">총급여</th>
              <th className="px-3 py-2 text-right">실수령</th>
              <th className="px-3 py-2">액션</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(w => (
              <tr key={w.worker_id} className={`border-t ${isPublished(w) ? 'bg-gray-50/60' : ''}`}>
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    aria-label="선택"
                    checked={selected.has(w.worker_id)}
                    onChange={() => toggle(w.worker_id)}
                    disabled={publishLoading}
                  />
                </td>
                <td className="px-3 py-2">{w.name}</td>
                <td className="px-3 py-2">
                  {formatEmploymentType(w.employment_type, w.employment_type_label)}
                </td>
                <td className="px-3 py-2">
                  {w.status === 'paid' ? (
                    <div className="flex flex-wrap gap-1">
                      {(['issued', 'paid'] as const).map(st => (
                        <span
                          key={`${w.worker_id}-${st}`}
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeClass(st)}`}
                        >
                          {statusLabel[st]}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeClass(w.status)}`}
                    >
                      {w.status ? statusLabel[w.status] : '미발행'}
                    </span>
                  )}
                </td>
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
                    onClick={() => {
                      const safeName = (w.name || '').trim()
                      const query = safeName ? `?name=${encodeURIComponent(safeName)}` : ''
                      openFileRecordInNewTab({
                        file_url: `/payslip/${w.worker_id}/${y}/${m}${query}`,
                        file_name: `${safeName || 'payslip'}-${y}-${m}.html`,
                        title: `${safeName || '급여'} ${y}-${m}`,
                      })
                    }}
                  >
                    HTML 보기
                  </button>
                  <button
                    className="px-2 py-1 text-xs rounded-md bg-white border"
                    onClick={() => openDetail(w)}
                  >
                    상세
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && !loading && (
              <tr>
                <td className="px-3 py-6 text-center text-gray-500" colSpan={9}>
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
              <li>기본급: ₩{Number(detail.base_pay || 0).toLocaleString()}</li>
              <li>총액: ₩{Number(detail.total_gross_pay || 0).toLocaleString()}</li>
              <li>공제: ₩{Number(detail.total_deductions || 0).toLocaleString()}</li>
              <li className="font-semibold">
                실수령: ₩{Number(detail.net_pay || 0).toLocaleString()}
              </li>
            </ul>
          </div>
          <div className="border rounded-md p-3">
            <h3 className="font-semibold mb-2">세율 정보</h3>
            <div className="text-sm space-y-2">
              <div>
                고용형태:{' '}
                {formatEmploymentType(
                  detail?.employment_type || detailWorker?.employment_type,
                  detailWorker?.employment_type_label
                )}
              </div>
              {detail.rate_source && (
                <div>
                  세율 출처: {detail.rate_source === 'custom' ? '개인 설정' : '고용형태 기본' }
                </div>
              )}
              {rateEntries ? (
                <ul className="text-xs list-disc pl-5">
                  {rateEntries.map(entry => (
                    <li key={entry.label}>
                      {entry.label}: {entry.value}%
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs text-gray-600">
                  기본세율: {summarizeDefaultRate() || '세율 정보 없음'}
                </div>
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
