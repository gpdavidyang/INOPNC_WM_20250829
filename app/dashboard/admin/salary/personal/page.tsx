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
import { useConfirm } from '@/components/ui/use-confirm'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'
import { Check, Search, X } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

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

  const TAX_LABEL_MAP: Record<string, string> = {
    income_tax_rate: '소득세',
    income_tax: '소득세',
    local_tax_rate: '지방세',
    local_tax: '지방세',
    national_pension: '국민연금',
    pension_rate: '국민연금',
    health_insurance_rate: '건강보험',
    health_insurance: '건강보험',
    employment_insurance_rate: '고용보험',
    employment_insurance: '고용보험',
    long_term_care_rate: '장기요양',
    industrial_accident_rate: '산재보험',
  }
  const formatCustomTax = (rates: Record<string, number> | null | undefined) => {
    if (!rates) return '-'
    const total = Object.values(rates)
      .map(v => Number(v) || 0)
      .reduce((sum, v) => sum + v, 0)
    if (total <= 0) return '세율 입력 없음'
    return `${Number(total.toFixed(2)).toString()}%`
  }

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
          custom_tax_rates: null,
          replaceActive: true,
        }),
      })
    }
    await load()
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border-gray-200 shadow-sm shadow-gray-200/50">
        <CardContent className="pt-6 space-y-6">
          <div className="flex flex-wrap items-end gap-3">
             <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-medium text-muted-foreground tracking-tight ml-1">사용자 검색</span>
                <div className="relative w-fit">
                   <Input
                     type="search"
                     placeholder="이름 또는 ID 검색"
                     value={query}
                     onChange={e => setQuery(e.target.value)}
                     className="h-10 w-64 rounded-xl bg-gray-50 border-none pl-10 pr-4 text-sm font-medium"
                   />
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
             </div>

             <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-medium text-muted-foreground tracking-tight ml-1">고용 형태 필터</span>
                <CustomSelect
                  value={typeFilter || 'all'}
                  onValueChange={value => setTypeFilter(value === 'all' ? '' : (value as any))}
                >
                  <CustomSelectTrigger className="h-10 w-40 rounded-xl bg-gray-50 border-none px-4 text-sm font-medium">
                    <CustomSelectValue placeholder="전체 형태" />
                  </CustomSelectTrigger>
                  <CustomSelectContent>
                    <CustomSelectItem value="all">전체 형태</CustomSelectItem>
                    <CustomSelectItem value="freelancer">{TYPE_LABEL.freelancer}</CustomSelectItem>
                    <CustomSelectItem value="daily_worker">{TYPE_LABEL.daily_worker}</CustomSelectItem>
                    <CustomSelectItem value="regular_employee">{TYPE_LABEL.regular_employee}</CustomSelectItem>
                  </CustomSelectContent>
                </CustomSelect>
             </div>

             <div className="flex items-center gap-2 ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={load}
                  className="h-10 rounded-xl px-4 border-gray-200"
                  disabled={loading}
                >
                  <span>새로고침</span>
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={bulkApplyDefaultRates}
                  disabled={selected.size === 0}
                  className="h-10 rounded-xl px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  <span>선택 기본세율 적용 ({selected.size})</span>
                </Button>
             </div>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 text-xs font-medium text-blue-900 grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="flex gap-2">
                <div className="w-1 h-full bg-blue-600 rounded-full" />
                <span>변경사항은 이후 발행하는 급여에만 적용됩니다.</span>
             </div>
             <div className="flex gap-2">
                <div className="w-1 h-full bg-blue-600 rounded-full" />
                <span>개인세율 설정 시 기본세율보다 우선 적용됩니다.</span>
             </div>
             <div className="flex gap-2">
                <div className="w-1 h-full bg-blue-600 rounded-full" />
                <span>적용일은 설정값이 효력을 발휘하는 기준일입니다.</span>
             </div>
          </div>

          <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-[#8da0cd] text-white">
                    <th className="px-4 py-3 text-left w-12">
                      <input
                        type="checkbox"
                        className="rounded border-none bg-white/20"
                        checked={selected.size > 0 && selected.size === filtered.length}
                        onChange={selectAll}
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-bold w-40">사용자</th>
                    <th className="px-4 py-3 text-left font-bold w-40">형태</th>
                    <th className="px-4 py-3 text-right font-bold w-40">일당 설정</th>
                    <th className="px-4 py-3 text-left font-bold w-32">적용일</th>
                    <th className="px-4 py-3 text-center font-bold">기본세율</th>
                    <th className="px-4 py-3 text-center font-bold">개인세율</th>
                    <th className="px-4 py-3 text-center font-bold">환경설정</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(it => {
                    const isEditing = editingTarget?.workerId === it.worker_id
                    const hasCustomTax = it.custom_tax_rates && Object.keys(it.custom_tax_rates).length > 0
                    return (
                      <tr key={it.worker_id} className={`hover:bg-gray-50/50 transition-colors ${isEditing ? 'bg-blue-50/30' : ''}`}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            checked={selected.has(it.worker_id)}
                            onChange={() => toggle(it.worker_id)}
                          />
                        </td>
                        <td className="px-4 py-3">
                           <div className="flex flex-col">
                              <span className="font-black text-gray-900">{it.name}</span>
                              <span className="text-[10px] text-muted-foreground uppercase">{it.worker_id.slice(0, 8)}</span>
                           </div>
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <CustomSelect
                              value={editingTarget?.employmentType || ''}
                              onValueChange={value => setEditingTarget(prev => prev ? { ...prev, employmentType: value as any } : prev)}
                            >
                              <CustomSelectTrigger className="h-9 w-full rounded-lg bg-white border-blue-200 text-xs font-bold">
                                <CustomSelectValue placeholder="형태 선택" />
                              </CustomSelectTrigger>
                              <CustomSelectContent>
                                <CustomSelectItem value="freelancer">{TYPE_LABEL.freelancer}</CustomSelectItem>
                                <CustomSelectItem value="daily_worker">{TYPE_LABEL.daily_worker}</CustomSelectItem>
                                <CustomSelectItem value="regular_employee">{TYPE_LABEL.regular_employee}</CustomSelectItem>
                              </CustomSelectContent>
                            </CustomSelect>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-100">
                               {it.employment_type ? TYPE_LABEL[it.employment_type] : '미설정'}
                            </Badge>
                          )}
                        </td>
                         <td className="px-4 py-3 text-right">
                          {isEditing ? (
                            <div className="relative">
                               <Input
                                type="number"
                                className="h-9 w-full text-right rounded-lg bg-white border-blue-200 font-bold text-blue-700 pr-8"
                                value={editingTarget?.rate || ''}
                                onChange={e => setEditingTarget(prev => prev ? { ...prev, rate: e.target.value } : prev)}
                              />
                               <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-blue-400">₩</span>
                            </div>
                          ) : (
                            <span className="font-bold text-gray-900 italic">
                               {it.daily_rate != null ? `₩ ${Number(it.daily_rate).toLocaleString()}` : '-'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground tabular-nums">
                           {formatEffectiveDate(it.effective_date)}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-gray-500">
                          {it.employment_type && defaultTotals[it.employment_type]
                            ? `${defaultTotals[it.employment_type].toFixed(2)} %`
                            : '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isEditing ? (
                             <div className="flex items-center justify-center gap-1">
                                <Input
                                  type="number"
                                  step="0.01"
                                  className="h-9 w-16 text-center rounded-lg bg-white border-blue-200 font-black text-blue-700"
                                  placeholder="0"
                                  value={editingTarget?.customTaxes?.[0]?.value || ''}
                                  onChange={e => setEditingTarget(prev => prev ? { ...prev, customTaxes: [{ key: 'custom', value: e.target.value }] } : prev)}
                                />
                                <span className="text-[10px] font-black text-blue-400">%</span>
                             </div>
                          ) : (
                             <span className={`font-black ${hasCustomTax ? 'text-indigo-600' : 'text-gray-300'}`}>
                                {formatCustomTax(it.custom_tax_rates)}
                             </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                             {isEditing ? (
                                <>
                                  <Button
                                    size="xs"
                                    className="h-8 rounded-md bg-blue-600 hover:bg-blue-700 text-white gap-1"
                                    onClick={() => changeRate(it.worker_id, (editingTarget?.employmentType || it.employment_type) as any, editingTarget?.rate || '', editingTarget?.customTaxes || [])}
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    저장
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="xs"
                                    className="h-8 rounded-md text-gray-400"
                                    onClick={() => setEditingTarget(null)}
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </Button>
                                </>
                             ) : (
                                <>
                                   <Button
                                      variant="outline"
                                      size="xs"
                                      className="h-8 rounded-md border-amber-200 text-amber-700 font-medium px-4 whitespace-nowrap"
                                      onClick={() => setEditingTarget({
                                         workerId: it.worker_id,
                                         rate: it.daily_rate != null ? String(it.daily_rate) : '',
                                         employmentType: it.employment_type || '',
                                         customTaxes: toCustomTaxRows(it.custom_tax_rates),
                                      })}
                                   >
                                      정보수정
                                   </Button>
                                   <Button
                                      variant="outline"
                                      size="xs"
                                      className="h-8 rounded-md border-gray-200 text-gray-600 font-medium px-4 whitespace-nowrap"
                                      onClick={async () => {
                                         const ok = await confirm({
                                            title: '기본 세율 적용',
                                            description: '해당 사용자에게 개별 커스텀 세율을 해제하고 고용형태 기본 세율을 적용하시겠습니까?',
                                            confirmText: '기본세율로 초기화',
                                            cancelText: '취소',
                                            variant: 'warning',
                                         })
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
                                               custom_tax_rates: null,
                                               replaceActive: true,
                                            }),
                                         })
                                         await load()
                                      }}
                                    >
                                       기본 복구
                                    </Button>
                                </>
                             )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {filtered.length === 0 && !loading && (
                    <tr>
                      <td className="px-4 py-20 text-center text-gray-400" colSpan={8}>
                         검색 조건과 일치하는 사용자가 없습니다.
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
