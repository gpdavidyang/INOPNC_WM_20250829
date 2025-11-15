'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useToast } from '@/components/ui/use-toast'
import EmptyState from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'

type Rule = {
  id?: string
  rule_name: string
  rule_type: 'hourly_rate' | 'daily_rate' | 'overtime_multiplier' | 'bonus_calculation'
  base_amount: number
  multiplier?: number
  is_active?: boolean
}

const createDefaultRule = (): Rule => ({
  rule_name: '',
  rule_type: 'hourly_rate',
  base_amount: 0,
  multiplier: 1,
  is_active: true,
})

type SortKey = 'rule_name' | 'rule_type' | 'base_amount' | 'multiplier' | 'is_active'

export default function RulesPage() {
  const { toast } = useToast()
  const [items, setItems] = useState<Rule[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [sort, setSort] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({
    key: 'rule_name',
    direction: 'asc',
  })

  const [form, setForm] = useState<Rule>(() => createDefaultRule())
  const [hasMounted, setHasMounted] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/payroll/rules')
      const json = await res.json()
      if (!res.ok || json?.success === false) throw new Error(json?.error || '조회 실패')
      setItems(json.data?.rules || [])
    } catch (e: any) {
      setError(e?.message || '조회 실패')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => setForm(createDefaultRule())

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    setHasMounted(true)
  }, [])

  const sortedItems = useMemo(() => {
    const arr = [...items]
    const ruleTypeOrder: Record<Rule['rule_type'], number> = {
      hourly_rate: 1,
      daily_rate: 2,
      overtime_multiplier: 3,
      bonus_calculation: 4,
    }
    arr.sort((a, b) => {
      const { key, direction } = sort
      const factor = direction === 'asc' ? 1 : -1
      let valA: string | number = ''
      let valB: string | number = ''
      if (key === 'rule_name') {
        valA = a.rule_name || ''
        valB = b.rule_name || ''
      } else if (key === 'rule_type') {
        valA = ruleTypeOrder[a.rule_type] || 0
        valB = ruleTypeOrder[b.rule_type] || 0
      } else if (key === 'base_amount') {
        valA = a.base_amount || 0
        valB = b.base_amount || 0
      } else if (key === 'multiplier') {
        valA = a.multiplier ?? 0
        valB = b.multiplier ?? 0
      } else if (key === 'is_active') {
        valA = a.is_active ? 1 : 0
        valB = b.is_active ? 1 : 0
      }
      if (valA < valB) return -1 * factor
      if (valA > valB) return 1 * factor
      return 0
    })
    return arr
  }, [items, sort])

  const handleSort = (key: SortKey) => {
    setSort(prev => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
      }
      return { key, direction: 'asc' }
    })
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/payroll/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'upsert', data: form }),
      })
      const json = await res.json()
      if (!res.ok || json?.success === false) throw new Error(json?.error || '저장 실패')
      await load()
      toast({
        title: '저장 완료',
        description: form.id ? '급여 규칙이 수정되었습니다.' : '급여 규칙이 추가되었습니다.',
      })
      resetForm()
    } catch (e: any) {
      toast({ title: '저장 실패', description: e?.message || '저장 실패', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const onEdit = (rule: Rule) => {
    setForm({
      id: rule.id,
      rule_name: rule.rule_name,
      rule_type: rule.rule_type,
      base_amount: rule.base_amount,
      multiplier: rule.multiplier ?? 1,
      is_active: rule.is_active ?? true,
    })
  }

  const onDelete = async (id?: string) => {
    if (!id) return
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm('해당 급여 규칙을 삭제할까요?')
      if (!confirmed) return
    }
    try {
      const res = await fetch('/api/admin/payroll/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      })
      const json = await res.json()
      if (!res.ok || json?.success === false) throw new Error(json?.error || '삭제 실패')
      if (form.id === id) {
        resetForm()
      }
      await load()
      toast({ title: '삭제 완료', description: '급여 규칙이 삭제되었습니다.' })
    } catch (e: any) {
      toast({ title: '삭제 실패', description: e?.message || '삭제 실패', variant: 'destructive' })
    }
  }

  return (
    <div className="px-0 pb-8">
      <PageHeader
        title="급여 규칙 관리"
        description="시급/일급/연장배수/보너스 규칙"
        breadcrumbs={[{ label: '대시보드', href: '/dashboard/admin' }, { label: '급여 관리', href: '/dashboard/admin/salary' }, { label: '규칙설정' }]}
      />
      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-4">
      <section className="rounded-lg border bg-white p-4 shadow-sm space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {form.id ? '규칙 수정' : '새 규칙 추가'}
            </h2>
            <p className="text-sm text-gray-600">
              시급·일급·연장배수·보너스 규칙을 이 화면에서 바로 관리하세요.
            </p>
          </div>
          {form.id && (
            <Button type="button" variant="secondary" size="compact" onClick={resetForm}>
              새 규칙 작성
            </Button>
          )}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            className="h-11 rounded-md bg-white text-gray-900 border border-gray-300 px-3 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-blue-500/30"
            placeholder="규칙 이름"
            value={form.rule_name}
            onChange={e => setForm(prev => ({ ...prev, rule_name: e.target.value }))}
          />
          <CustomSelect
            value={form.rule_type}
            onValueChange={value =>
              setForm(prev => ({ ...prev, rule_type: value as Rule['rule_type'] }))
            }
          >
            <CustomSelectTrigger className="h-11 rounded-md bg-white text-gray-900 border border-gray-300 px-3 text-sm shadow-sm focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-blue-500/30">
              <CustomSelectValue placeholder="규칙 유형" />
            </CustomSelectTrigger>
            <CustomSelectContent>
              <CustomSelectItem value="hourly_rate">시급</CustomSelectItem>
              <CustomSelectItem value="daily_rate">일급</CustomSelectItem>
              <CustomSelectItem value="overtime_multiplier">연장배수</CustomSelectItem>
              <CustomSelectItem value="bonus_calculation">보너스</CustomSelectItem>
            </CustomSelectContent>
          </CustomSelect>
          <input
            type="number"
            className="h-11 rounded-md bg-white text-gray-900 border border-gray-300 px-3 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-blue-500/30"
            placeholder="기준값"
            value={form.base_amount}
            onChange={e => setForm(prev => ({ ...prev, base_amount: Number(e.target.value) || 0 }))}
          />
          <input
            type="number"
            className="h-11 rounded-md bg-white text-gray-900 border border-gray-300 px-3 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-blue-500/30"
            placeholder="배수(선택)"
            value={form.multiplier}
            onChange={e => setForm(prev => ({ ...prev, multiplier: Number(e.target.value) || 1 }))}
          />
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={e => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
            />
            활성 규칙
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="compact"
            onClick={handleSubmit}
            disabled={saving || !form.rule_name.trim()}
          >
            {saving ? '저장 중...' : form.id ? '수정 저장' : '규칙 추가'}
          </Button>
          <Button type="button" variant="secondary" size="compact" onClick={resetForm}>
            취소
          </Button>
        </div>
      </section>

      {loading ? (
        <EmptyState description="불러오는 중..." />
      ) : error ? (
        <EmptyState title="오류" description={error} />
      ) : (
        <div className="overflow-x-auto border rounded-md">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => handleSort('rule_name')}
                    className="flex items-center gap-1 text-left text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none"
                  >
                    이름
                    {hasMounted && sort.key === 'rule_name' && (
                      <span>{sort.direction === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </button>
                </th>
                <th className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => handleSort('rule_type')}
                    className="flex items-center gap-1 text-left text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none"
                  >
                    유형
                    {hasMounted && sort.key === 'rule_type' && (
                      <span>{sort.direction === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </button>
                </th>
                <th className="px-3 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => handleSort('base_amount')}
                    className="flex items-center gap-1 w-full justify-end text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none"
                  >
                    기준값
                    {hasMounted && sort.key === 'base_amount' && (
                      <span>{sort.direction === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </button>
                </th>
                <th className="px-3 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => handleSort('multiplier')}
                    className="flex items-center gap-1 w-full justify-end text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none"
                  >
                    배수
                    {hasMounted && sort.key === 'multiplier' && (
                      <span>{sort.direction === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </button>
                </th>
                <th className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => handleSort('is_active')}
                    className="flex items-center gap-1 text-left text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none"
                  >
                    활성
                    {hasMounted && sort.key === 'is_active' && (
                      <span>{sort.direction === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </button>
                </th>
                <th className="px-3 py-2 text-right">관리</th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((r, idx) => (
                <tr key={`${r.id || idx}`} className="border-t">
                  <td className="px-3 py-2">{r.rule_name}</td>
                  <td className="px-3 py-2">
                    {r.rule_type === 'hourly_rate'
                      ? '시급'
                      : r.rule_type === 'daily_rate'
                        ? '일급'
                        : r.rule_type === 'overtime_multiplier'
                          ? '연장배수'
                          : '보너스'}
                  </td>
                  <td className="px-3 py-2 text-right">{r.base_amount}</td>
                  <td className="px-3 py-2 text-right">{r.multiplier ?? '-'}</td>
                  <td className="px-3 py-2">{r.is_active ? 'Y' : 'N'}</td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="compact"
                        className="text-xs font-medium"
                        onClick={() => onEdit(r)}
                      >
                        수정
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="compact"
                        className="text-xs font-medium"
                        onClick={() => onDelete(r.id)}
                      >
                        삭제
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center text-gray-500" colSpan={6}>
                    데이터가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </div>
  )
}
