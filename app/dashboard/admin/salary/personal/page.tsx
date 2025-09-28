'use client'

import React, { useEffect, useMemo, useState } from 'react'
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

export default function PersonalRatesPage() {
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
  const [bulkPercent, setBulkPercent] = useState<string>('')

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
  }, [supabase])

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
        custom_tax_rates: ar?.custom_tax_rates ?? null,
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
    currentRate: number | null,
    custom_tax_rates: Record<string, number> | null
  ) => {
    const newRate = prompt('새 일당(원) 입력', String(currentRate || 0))
    if (!newRate) return
    let et: PersonalRate['employment_type'] | null = employment_type
    if (!et) {
      const input = prompt(
        '고용형태 입력 (freelancer/daily_worker/regular_employee)',
        'daily_worker'
      )
      if (!input) return
      if (input !== 'freelancer' && input !== 'daily_worker' && input !== 'regular_employee')
        return alert('형태가 올바르지 않습니다')
      et = input
    }
    const payload = {
      worker_id: workerId,
      employment_type: et,
      daily_rate: Number(newRate) || 0,
      effective_date: new Date().toISOString().split('T')[0],
      is_active: true,
      custom_tax_rates: custom_tax_rates || null,
      replaceActive: true,
    }
    const res = await fetch('/api/admin/payroll/rates/personal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (!res.ok || json?.success === false) alert(json?.error || '저장 실패')
    else await load()
  }

  const bulkChangeRate = async () => {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    const input = prompt('선택 인원의 새 일당(원) 입력')
    if (!input) return
    const newRate = Number(input)
    if (!Number.isFinite(newRate)) return alert('숫자를 입력해주세요')
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

  const bulkApplyDefaultRates = async () => {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    if (!confirm('선택 인원에 기본 세율을 적용하시겠습니까? (개인 커스텀 세율 해제)')) return
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="이름/ID 검색"
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
          <option value="freelancer">프리랜서</option>
          <option value="daily_worker">일용직</option>
          <option value="regular_employee">상용직</option>
        </select>
        <button
          type="button"
          onClick={load}
          className="px-3 py-2 bg-white text-gray-900 rounded-md text-sm border shadow-sm hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
          disabled={loading}
        >
          새로고침
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={bulkChangeRate}
          disabled={selected.size === 0}
          className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm disabled:bg-gray-400"
        >
          선택 일당 변경
        </button>
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.1"
            value={bulkPercent}
            onChange={e => setBulkPercent(e.target.value)}
            placeholder="증감 %"
            className="h-10 w-24 rounded-md bg-white text-gray-900 border border-gray-300 px-3 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-blue-500/30"
          />
          <button
            type="button"
            onClick={async () => {
              const n = Number(bulkPercent)
              if (!Number.isFinite(n) || n === 0) return alert('변경할 퍼센트를 입력하세요')
              const ids = Array.from(selected)
              const targets = displayRows.filter(
                r => ids.includes(r.worker_id) && r.daily_rate != null
              )
              // Preview summary
              const preview = targets
                .slice(0, 5)
                .map(
                  r =>
                    `${r.profile?.full_name || r.worker_id}: ₩${(r.daily_rate || 0).toLocaleString()} → ₩${Math.round((r.daily_rate || 0) * (1 + n / 100)).toLocaleString()}`
                )
                .join('\n')
              const more = targets.length > 5 ? `외 ${targets.length - 5}명` : ''
              const skipped = displayRows.filter(
                r => ids.includes(r.worker_id) && r.daily_rate == null
              ).length
              if (
                !confirm(
                  `아래와 같이 ${targets.length}명의 일당을 ${n}% ${n > 0 ? '인상' : '감액'}합니다.\n\n${preview}${more ? '\n' + more : ''}${skipped ? `\n\n일당 미설정 ${skipped}명은 제외됩니다.` : ''}\n\n진행하시겠습니까?`
                )
              )
                return
              for (const r of targets) {
                const nextRate = Math.round((r.daily_rate || 0) * (1 + n / 100))
                await fetch('/api/admin/payroll/rates/personal', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    worker_id: r.worker_id,
                    employment_type: r.employment_type || 'daily_worker',
                    daily_rate: nextRate,
                    effective_date: new Date().toISOString().split('T')[0],
                    is_active: true,
                    custom_tax_rates: (r as any).custom_tax_rates || null,
                    replaceActive: true,
                  }),
                })
              }
              setBulkPercent('')
              await load()
            }}
            disabled={selected.size === 0}
            className="px-3 py-2 bg-amber-600 text-white rounded-md text-sm disabled:bg-gray-400"
          >
            선택 % 증감
          </button>
        </div>
        <button
          type="button"
          onClick={bulkApplyDefaultRates}
          disabled={selected.size === 0}
          className="px-3 py-2 bg-indigo-600 text-white rounded-md text-sm disabled:bg-gray-400"
        >
          선택 기본세율 적용
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
                  checked={selected.size > 0 && selected.size === filtered.length}
                  onChange={selectAll}
                />
              </th>
              <th className="px-3 py-2">사용자</th>
              <th className="px-3 py-2">형태</th>
              <th className="px-3 py-2 text-right">일당</th>
              <th className="px-3 py-2">적용일</th>
              <th className="px-3 py-2">커스텀세율</th>
              <th className="px-3 py-2">작업</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(it => (
              <tr key={it.worker_id} className="border-t">
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selected.has(it.worker_id)}
                    onChange={() => toggle(it.worker_id)}
                  />
                </td>
                <td className="px-3 py-2">{it.name}</td>
                <td className="px-3 py-2">{it.employment_type || '미설정'}</td>
                <td className="px-3 py-2 text-right">
                  {it.daily_rate != null ? `₩${Number(it.daily_rate || 0).toLocaleString()}` : '-'}
                </td>
                <td className="px-3 py-2">{it.effective_date || '-'}</td>
                <td className="px-3 py-2">
                  {it.custom_tax_rates
                    ? Object.entries(it.custom_tax_rates)
                        .map(([k, v]) => `${k}:${v}%`)
                        .join(', ')
                    : '-'}
                </td>
                <td className="px-3 py-2 flex items-center gap-2">
                  <button
                    className="px-2 py-1 text-xs rounded-md bg-blue-600 text-white"
                    onClick={() =>
                      changeRate(
                        it.worker_id,
                        it.employment_type,
                        it.daily_rate as any,
                        (it as any).custom_tax_rates || null
                      )
                    }
                  >
                    일당 변경
                  </button>
                  <button
                    className="px-2 py-1 text-xs rounded-md bg-white border"
                    onClick={async () => {
                      if (!confirm('이 사용자에 기본 세율을 적용하시겠습니까?')) return
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
                    기본세율 적용
                  </button>
                </td>
              </tr>
            ))}
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
  )
}
