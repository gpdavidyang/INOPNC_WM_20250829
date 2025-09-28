'use client'

import React, { useEffect, useState } from 'react'

type Rule = {
  id?: string
  rule_name: string
  rule_type: 'hourly_rate' | 'daily_rate' | 'overtime_multiplier' | 'bonus_calculation'
  base_amount: number
  multiplier?: number
  is_active?: boolean
}

export default function RulesPage() {
  const [items, setItems] = useState<Rule[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState<Rule>({
    rule_name: '',
    rule_type: 'hourly_rate',
    base_amount: 0,
    multiplier: 1,
    is_active: true,
  })

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

  useEffect(() => {
    load()
  }, [])

  const onSave = async () => {
    try {
      const res = await fetch('/api/admin/payroll/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'upsert', data: form }),
      })
      const json = await res.json()
      if (!res.ok || json?.success === false) throw new Error(json?.error || '저장 실패')
      setForm({
        rule_name: '',
        rule_type: 'hourly_rate',
        base_amount: 0,
        multiplier: 1,
        is_active: true,
      })
      await load()
    } catch (e: any) {
      alert(e?.message || '저장 실패')
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <input
          className="h-10 rounded-md bg-white text-gray-900 border border-gray-300 px-3 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-blue-500/30"
          placeholder="룰 이름"
          value={form.rule_name}
          onChange={e => setForm(prev => ({ ...prev, rule_name: e.target.value }))}
        />
        <select
          className="h-10 rounded-md bg-white text-gray-900 border border-gray-300 px-3 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-blue-500/30"
          value={form.rule_type}
          onChange={e =>
            setForm(prev => ({ ...prev, rule_type: e.target.value as Rule['rule_type'] }))
          }
        >
          <option value="hourly_rate">시급</option>
          <option value="daily_rate">일급</option>
          <option value="overtime_multiplier">연장배수</option>
          <option value="bonus_calculation">보너스</option>
        </select>
        <input
          type="number"
          className="h-10 rounded-md bg-white text-gray-900 border border-gray-300 px-3 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-blue-500/30"
          placeholder="기준값"
          value={form.base_amount}
          onChange={e => setForm(prev => ({ ...prev, base_amount: Number(e.target.value) || 0 }))}
        />
        <input
          type="number"
          className="h-10 rounded-md bg-white text-gray-900 border border-gray-300 px-3 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-blue-500/30"
          placeholder="배수(선택)"
          value={form.multiplier}
          onChange={e => setForm(prev => ({ ...prev, multiplier: Number(e.target.value) || 1 }))}
        />
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={e => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
          />
          <span className="text-sm">활성</span>
        </div>
        <div>
          <button
            type="button"
            onClick={onSave}
            className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm"
          >
            저장
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-600">불러오는 중...</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : (
        <div className="overflow-x-auto border rounded-md">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-3 py-2">이름</th>
                <th className="px-3 py-2">유형</th>
                <th className="px-3 py-2 text-right">기준값</th>
                <th className="px-3 py-2 text-right">배수</th>
                <th className="px-3 py-2">활성</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r, idx) => (
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
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center text-gray-500" colSpan={5}>
                    데이터가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
