'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useConfirm } from '@/components/ui/use-confirm'
import { PageHeader } from '@/components/ui/page-header'
import { useToast } from '@/components/ui/use-toast'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import { t } from '@/lib/ui/strings'
import { createClient } from '@/lib/supabase/client'

type PersonalRate = {
  id?: string
  worker_id: string
  employment_type: 'freelancer' | 'daily_worker' | 'regular_employee'
  daily_rate: number
  effective_date: string
  is_active: boolean
  custom_tax_rates?: Record<string, number> | null
  updated_at?: string
  profile?: { full_name?: string; email?: string; role?: string }
}

const DEFAULT_RATE_FIELDS = [
  'income_tax_rate',
  'local_tax_rate',
  'pension_rate',
  'health_insurance_rate',
  'employment_insurance_rate',
  'long_term_care_rate',
  'industrial_accident_rate',
] as const
type DefaultRateField = (typeof DEFAULT_RATE_FIELDS)[number]
type DefaultRateRecord = Record<DefaultRateField, number>
const createEmptyDefaultRateRecord = (): DefaultRateRecord => {
  const record = {} as DefaultRateRecord
  DEFAULT_RATE_FIELDS.forEach(field => {
    record[field] = 0
  })
  return record
}

export default function PersonalRatesPage() {
  const TYPE_LABEL: Record<PersonalRate['employment_type'], string> = {
    freelancer: '프리랜서',
    daily_worker: '일용직',
    regular_employee: '상용직',
  }
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const supabase = useMemo(() => createClient(), [])
  const [items, setItems] = useState<PersonalRate[]>([])
  const [activeRows, setActiveRows] = useState<PersonalRate[]>([])
  const [workers, setWorkers] = useState<Array<{ id: string; full_name: string; role: string }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<
    '' | 'freelancer' | 'daily_worker' | 'regular_employee'
  >('')
  const [defaultTotals, setDefaultTotals] = useState<Record<string, number>>({})
  const [defaultRates, setDefaultRates] = useState<Record<string, DefaultRateRecord>>({})
  const [editingTarget, setEditingTarget] = useState<{
    workerId: string
    rate: string
    employmentType: PersonalRate['employment_type'] | ''
    customTaxes: Array<{ key: string; value: string }>
  } | null>(null)

  const parseCustomTaxString = (input: string): Record<string, number> | null => {
    const entries = input
      .split(',')
      .map(token => token.trim())
      .filter(Boolean)
    const result: Record<string, number> = {}
    for (const entry of entries) {
      const [label, value] = entry.split(':')
      if (!label || value === undefined) continue
      const key = label.trim()
      const numeric = Number(value.replace(/[^0-9.\-]/g, ''))
      if (!key || !Number.isFinite(numeric)) continue
      result[key] = numeric
    }
    return Object.keys(result).length > 0 ? result : null
  }

  const coerceCustomTaxRecord = (value: unknown): Record<string, number> | null => {
    if (!value) return null
    if (typeof value === 'string') return parseCustomTaxString(value)
    if (typeof value === 'object' && !Array.isArray(value)) {
      const entries = Object.entries(value as Record<string, unknown>)
      const parsed: Record<string, number> = {}
      for (const [key, raw] of entries) {
        const trimmedKey = key.trim()
        const numeric = Number(raw)
        if (!trimmedKey || !Number.isFinite(numeric)) continue
        parsed[trimmedKey] = numeric
      }
      return Object.keys(parsed).length > 0 ? parsed : null
    }
    return null
  }

  const formatCustomTax = (rates: Record<string, number> | null | undefined) =>
    rates
      ? Object.entries(rates)
          .map(([k, v]) => `${k}:${v}%`)
          .join(', ')
      : '-'

  const normalizeCustomTax = (taxes: Array<{ key: string; value: string }>): Record<string, number> | null => {
    const map: Record<string, number> = {}
    taxes.forEach(({ key, value }) => {
      const trimmedKey = key.trim()
      const num = Number(value)
      if (!trimmedKey || !Number.isFinite(num)) return
      map[trimmedKey] = num
    })
    return Object.keys(map).length > 0 ? map : null
  }

  const ensureCustomTaxRows = (taxes?: Array<{ key: string; value: string }>) =>
    taxes && taxes.length > 0 ? taxes : [{ key: '', value: '' }]

  const toCustomTaxRows = (value: unknown) => {
    const record = coerceCustomTaxRecord(value)
    if (!record || Object.keys(record).length === 0) return ensureCustomTaxRows()
    const total = Object.values(record).reduce((sum, val) => sum + val, 0)
    return ensureCustomTaxRows([{ key: 'custom', value: String(total) }])
  }

  const buildDefaultCustomRates = (employmentType?: string | null) => {
    if (!employmentType) return null
    const record = defaultRates[employmentType]
    if (!record) return null
    return { ...record }
  }

  const formatEffectiveDate = (value?: string | null) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toISOString().split('T')[0]
  }

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/payroll/rates/personal')
      const json = await res.json()
      if (!res.ok || json?.success === false) throw new Error(json?.error || '목록 조회 실패')
      const rows = (json.data || []) as PersonalRate[]
      setItems(rows)
      const map = new Map<string, PersonalRate>()
      for (const r of rows) {
        const prev = map.get(r.worker_id)
        const curTime = new Date(r.updated_at || r.effective_date).getTime()
        if (!prev) map.set(r.worker_id, r)
        else {
          const prevTime = new Date(prev.updated_at || prev.effective_date).getTime()
          if (curTime >= prevTime && r.is_active) map.set(r.worker_id, r)
        }
      }
      setActiveRows(Array.from(map.values()))
      setSelected(new Set())
    } catch (e: any) {
      setError(e?.message || '목록 조회 실패')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Initialize query from URL (?q= or ?worker_id=)
    try {
      const q = searchParams.get('q') || ''
      const wid = searchParams.get('worker_id') || ''
      const initial = q || wid
      if (initial) setQuery(initial)
    } catch {
      // ignore
    }
    load()
    ;(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, role, status')
        .in('role', ['worker', 'site_manager'])
        .neq('status', 'inactive')
        .order('full_name')
      setWorkers(Array.isArray(data) ? (data as any) : [])
    })()
  }, [supabase, searchParams])

  useEffect(() => {
    const normalizeRateRecord = (value: any): DefaultRateRecord => {
      const record = createEmptyDefaultRateRecord()
      DEFAULT_RATE_FIELDS.forEach(field => {
        const raw = value?.[field]
        const num = Number(raw)
        record[field] = Number.isFinite(num) ? num : 0
      })
      return record
    }
    const extractRatesMap = (payload: any): Record<string, DefaultRateRecord> => {
      const map: Record<string, DefaultRateRecord> = {}
      if (payload?.rates && typeof payload.rates === 'object') {
        Object.entries(payload.rates).forEach(([type, rate]) => {
          if (!type) return
          map[type] = normalizeRateRecord(rate)
        })
        return map
      }
      if (Array.isArray(payload)) {
        payload.forEach(item => {
          const type = item?.employment_type
          if (!type) return
          map[type] = normalizeRateRecord(item)
        })
      }
      return map
    }
    const calcTotal = (record: DefaultRateRecord) =>
      DEFAULT_RATE_FIELDS.reduce((sum, field) => sum + (record[field] || 0), 0)

    ;(async () => {
      try {
        const res = await fetch('/api/admin/payroll/rates/defaults')
        const json = await res.json().catch(() => ({}))
        if (!res.ok || json?.success === false || !json?.data) {
          setDefaultTotals({})
          setDefaultRates({})
          return
        }
        const map = extractRatesMap(json.data)
        setDefaultRates(map)
        const totals: Record<string, number> = {}
        Object.entries(map).forEach(([type, record]) => {
          totals[type] = Number(calcTotal(record).toFixed(2))
        })
        setDefaultTotals(totals)
      } catch {
        setDefaultTotals({})
        setDefaultRates({})
      }
    })()
  }, [])

  const displayRows = useMemo(() => {
    const map = new Map(activeRows.map(r => [r.worker_id, r]))
    return workers.map(w => {
      const ar = map.get(w.id)
      return {
        worker_id: w.id,
        name: w.full_name || w.id,
        employment_type: ar?.employment_type ?? null,
        daily_rate: ar?.daily_rate ?? null,
        effective_date: ar?.effective_date ?? null,
        custom_tax_rates: coerceCustomTaxRecord(ar?.custom_tax_rates),
      }
    })
  }, [workers, activeRows])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return displayRows.filter(r => {
      const okType = typeFilter ? r.employment_type === typeFilter : true
      const okQuery = q
        ? r.name.toLowerCase().includes(q) || r.worker_id.toLowerCase().includes(q)
        : true
      return okType && okQuery
    })
  }, [displayRows, query, typeFilter])

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

  const changeRate = async (
    workerId: string,
    employment_type: PersonalRate['employment_type'] | null,
    newRateValue: string,
    customTaxes: Array<{ key: string; value: string }>
  ) => {
    if (!newRateValue) {
      toast({ title: '입력 오류', description: '일당을 입력해주세요.', variant: 'destructive' })
      return
    }
    const parsedRate = Number(newRateValue)
    if (!Number.isFinite(parsedRate)) {
      toast({ title: '입력 오류', description: '숫자를 입력해주세요.', variant: 'destructive' })
      return
    }
    let et: PersonalRate['employment_type'] | null = employment_type
    if (!et) {
      toast({ title: '입력 오류', description: '형태를 선택해주세요.', variant: 'destructive' })
      return
    }
    const parsedCustom = normalizeCustomTax(customTaxes)

    const payload = {
      worker_id: workerId,
      employment_type: et,
      daily_rate: parsedRate || 0,
      effective_date: new Date().toISOString().split('T')[0],
      is_active: true,
      custom_tax_rates: parsedCustom,
      replaceActive: true,
    }
    const res = await fetch('/api/admin/payroll/rates/personal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (!res.ok || json?.success === false) {
      toast({ title: '저장 실패', description: json?.error || '저장 실패', variant: 'destructive' })
    } else {
      toast({ title: '저장 완료', description: '일당이 변경되었습니다.' })
      setEditingTarget(null)
      await load()
    }
  }

  const bulkChangeRate = async () => {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    const input = prompt('선택 인원의 새 일당(원) 입력')
    if (!input) return
    const newRate = Number(input)
    if (!Number.isFinite(newRate)) {
      toast({ title: '입력 오류', description: '숫자를 입력해주세요', variant: 'destructive' })
      return
    }
    for (const r of displayRows.filter(r => ids.includes(r.worker_id))) {
      let et = r.employment_type
      if (!et) et = 'daily_worker'
      await fetch('/api/admin/payroll/rates/personal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worker_id: r.worker_id,
          employment_type: et,
          daily_rate: newRate,
          effective_date: new Date().toISOString().split('T')[0],
          is_active: true,
          custom_tax_rates: r.custom_tax_rates || null,
          replaceActive: true,
        }),
      })
    }
    await load()
  }

  const { confirm } = useConfirm()

  const bulkApplyDefaultRates = async () => {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    const ok = await confirm({
      title: '기본 세율 적용',
      description: '선택 인원에 기본 세율을 적용하시겠습니까? (개인 커스텀 세율 해제)',
      confirmText: '적용',
      cancelText: '취소',
      variant: 'warning',
    })
    if (!ok) return
    for (const r of displayRows.filter(r => ids.includes(r.worker_id))) {
      let et = r.employment_type
      if (!et) et = 'daily_worker'
      await fetch('/api/admin/payroll/rates/personal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worker_id: r.worker_id,
          employment_type: et,
          daily_rate: r.daily_rate || 0,
          effective_date: new Date().toISOString().split('T')[0],
          is_active: true,
          custom_tax_rates: buildDefaultCustomRates(et),
          replaceActive: true,
        }),
      })
    }
    await load()
  }

  return (
    <div className="px-0 pb-8">
      <PageHeader
        title="개인 세율/일당 관리"
        description="작업자별 일당 및 커스텀 세율 관리"
        breadcrumbs={[{ label: '대시보드', href: '/dashboard/admin' }, { label: '급여 관리', href: '/dashboard/admin/salary' }, { label: '개인 설정' }]}
      />
      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder={t('common.search')}
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="h-10 rounded-md bg-white text-gray-900 border border-gray-300 px-3 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-blue-500/30"
        />
        <select
          className="h-10 rounded-md bg-white text-gray-900 border border-gray-300 px-3 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-blue-500/30"
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value as any)}
        >
          <option value="">전체 형태</option>
          <option value="freelancer">{TYPE_LABEL.freelancer}</option>
          <option value="daily_worker">{TYPE_LABEL.daily_worker}</option>
          <option value="regular_employee">{TYPE_LABEL.regular_employee}</option>
        </select>
        <button
          type="button"
          onClick={load}
          className="px-3 py-2 bg-white text-gray-900 rounded-md text-sm border shadow-sm hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
          disabled={loading}
        >
          {t('common.refresh')}
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={bulkApplyDefaultRates}
          disabled={selected.size === 0}
          className="px-3 py-2 bg-indigo-600 text-white rounded-md text-sm disabled:bg-gray-400"
        >
          선택 기본세율 적용
        </button>
      </div>
      <div className="rounded-md border border-blue-100 bg-blue-50 text-blue-700 text-sm p-3 space-y-1">
        <p>1. 이미 발행된 급여명세서는 저장 시점의 일당·세율을 그대로 유지합니다. 이 화면에서 값을 변경하면 이후 새로 계산·발행하는 급여에만 적용됩니다.</p>
        <p>2. 개인세율을 입력하면 해당 사용자는 기본세율 대신 입력한 개인세율이 우선 적용되어 계산됩니다.</p>
        <p>3. 적용일은 새로 저장한 일당·세율이 효력을 발휘하기 시작한 날짜입니다. 이 날짜 이후 계산되는 급여부터 수정한 값이 적용됩니다.</p>
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
                  checked={selected.size > 0 && selected.size === filtered.length}
                  onChange={selectAll}
                />
              </th>
              <th className="px-3 py-2">사용자</th>
              <th className="px-3 py-2">형태</th>
              <th className="px-3 py-2 text-right">일당</th>
              <th className="px-3 py-2">적용일</th>
              <th className="px-3 py-2">기본세율</th>
              <th className="px-3 py-2">개인세율</th>
              <th className="px-3 py-2">작업</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(it => {
              const isEditing = editingTarget?.workerId === it.worker_id
              return (
                <tr key={it.worker_id} className="border-t">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selected.has(it.worker_id)}
                      onChange={() => toggle(it.worker_id)}
                    />
                  </td>
                  <td className="px-3 py-2">{it.name}</td>
                  <td className="px-3 py-2">
                    {isEditing ? (
                      <CustomSelect
                        value={editingTarget?.employmentType || ''}
                        onValueChange={value =>
                          setEditingTarget(prev =>
                            prev
                              ? {
                                  ...prev,
                                  employmentType: value as PersonalRate['employment_type'],
                                }
                              : prev
                          )
                        }
                      >
                        <CustomSelectTrigger className="h-9 w-40">
                          <CustomSelectValue placeholder="형태 선택" />
                        </CustomSelectTrigger>
                        <CustomSelectContent>
                          <CustomSelectItem value="freelancer">
                            {TYPE_LABEL.freelancer}
                          </CustomSelectItem>
                          <CustomSelectItem value="daily_worker">
                            {TYPE_LABEL.daily_worker}
                          </CustomSelectItem>
                          <CustomSelectItem value="regular_employee">
                            {TYPE_LABEL.regular_employee}
                          </CustomSelectItem>
                        </CustomSelectContent>
                      </CustomSelect>
                    ) : it.employment_type ? (
                      TYPE_LABEL[it.employment_type]
                    ) : (
                      '미설정'
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {isEditing ? (
                      <input
                        type="number"
                        className="w-28 rounded-md border border-gray-300 px-2 py-1 text-sm text-right"
                        value={editingTarget?.rate || ''}
                        onChange={e =>
                          setEditingTarget(prev => (prev ? { ...prev, rate: e.target.value } : prev))
                        }
                      />
                    ) : it.daily_rate != null ? (
                      `₩${Number(it.daily_rate || 0).toLocaleString()}`
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-3 py-2">{formatEffectiveDate(it.effective_date)}</td>
                  <td className="px-3 py-2">
                    {it.employment_type && defaultTotals[it.employment_type]
                      ? `${defaultTotals[it.employment_type].toFixed(2)}%`
                      : '-'}
                  </td>
                  <td className="px-3 py-2">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          className="w-28 rounded-md border border-gray-300 px-2 py-1 text-sm text-right"
                          placeholder="0"
                          value={editingTarget?.customTaxes?.[0]?.value || ''}
                          onChange={e =>
                            setEditingTarget(prev =>
                              prev
                                ? {
                                    ...prev,
                                    customTaxes: [{ key: 'custom', value: e.target.value }],
                                  }
                                : prev
                            )
                          }
                        />
                        <span className="text-sm text-gray-600">%</span>
                      </div>
                    ) : (
                      formatCustomTax(it.custom_tax_rates)
                    )}
                 </td>
                  <td className="px-3 py-2 flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <button
                          className="px-2 py-1 text-xs rounded-md bg-blue-600 text-white"
                          onClick={() =>
                            changeRate(
                              it.worker_id,
                              (editingTarget?.employmentType || it.employment_type || null) as
                                | PersonalRate['employment_type']
                                | null,
                              editingTarget?.rate || '',
                              editingTarget?.customTaxes || []
                            )
                          }
                        >
                          저장
                        </button>
                        <button
                          className="px-2 py-1 text-xs rounded-md bg-gray-200 text-gray-800"
                          onClick={() => setEditingTarget(null)}
                        >
                          취소
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="px-2 py-1 text-xs rounded-md bg-blue-600 text-white"
                          onClick={() =>
                            setEditingTarget({
                              workerId: it.worker_id,
                              rate: it.daily_rate != null ? String(it.daily_rate) : '',
                              employmentType: it.employment_type || '',
                              customTaxes: toCustomTaxRows(it.custom_tax_rates),
                            })
                          }
                        >
                          수정
                        </button>
                        <button
                          className="px-2 py-1 text-xs rounded-md bg-white border"
                          onClick={async () => {
                            const ok = await (async () =>
                              confirm({
                                title: '기본 세율 적용',
                                description: '이 사용자에 기본 세율을 적용하시겠습니까?',
                                confirmText: '적용',
                                cancelText: '취소',
                                variant: 'warning',
                              }))()
                            if (!ok) return
                            await fetch('/api/admin/payroll/rates/personal', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                worker_id: it.worker_id,
                                employment_type: it.employment_type || 'daily_worker',
                                daily_rate: it.daily_rate || 0,
                                effective_date: new Date().toISOString().split('T')[0],
                                is_active: true,
                                custom_tax_rates: buildDefaultCustomRates(
                                  it.employment_type || 'daily_worker'
                                ),
                                replaceActive: true,
                              }),
                            })
                            await load()
                          }}
                        >
                          기본세율 적용
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && !loading && (
              <tr>
                <td className="px-3 py-6 text-center text-gray-500" colSpan={7}>
                  데이터가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  )
}
