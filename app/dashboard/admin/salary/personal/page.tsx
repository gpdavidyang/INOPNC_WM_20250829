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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // editor state
  const [workerId, setWorkerId] = useState('')
  const [employmentType, setEmploymentType] = useState<
    'freelancer' | 'daily_worker' | 'regular_employee'
  >('daily_worker')
  const [dailyRate, setDailyRate] = useState<number>(160000)
  const [effectiveDate, setEffectiveDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [isActive, setIsActive] = useState<boolean>(true)
  const [customRates, setCustomRates] = useState<{ [k: string]: number }>({})
  const [replaceActive, setReplaceActive] = useState<boolean>(true)
  const [workers, setWorkers] = useState<Array<{ id: string; full_name: string; role: string }>>([])

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/payroll/rates/personal')
      const json = await res.json()
      if (!res.ok || json?.success === false) throw new Error(json?.error || '목록 조회 실패')
      setItems(json.data || [])
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
        .select('id, full_name, role')
        .in('role', ['worker', 'site_manager'])
        .neq('status', 'inactive')
        .order('full_name')
      setWorkers(Array.isArray(data) ? (data as any) : [])
    })()
  }, [supabase])

  const onSave = async () => {
    if (!workerId) return
    try {
      const payload = {
        worker_id: workerId,
        employment_type: employmentType,
        daily_rate: Number(dailyRate) || 0,
        effective_date: effectiveDate,
        is_active: Boolean(isActive),
        custom_tax_rates: Object.keys(customRates).length ? customRates : null,
        replaceActive,
      }
      const res = await fetch('/api/admin/payroll/rates/personal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok || json?.success === false) throw new Error(json?.error || '저장 실패')
      await load()
    } catch (e: any) {
      alert(e?.message || '저장 실패')
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-2">
          <label className="block text-sm">작업자</label>
          <select
            className="h-10 rounded-md bg-white text-gray-900 border border-gray-300 px-3 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-blue-500/30"
            value={workerId}
            onChange={e => setWorkerId(e.target.value)}
          >
            <option value="">선택</option>
            {workers.map(w => (
              <option key={w.id} value={w.id}>
                {w.full_name} ({w.role})
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="block text-sm">고용형태</label>
          <select
            className="h-10 rounded-md bg-white text-gray-900 border border-gray-300 px-3 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-blue-500/30"
            value={employmentType}
            onChange={e => setEmploymentType(e.target.value as any)}
          >
            <option value="freelancer">프리랜서</option>
            <option value="daily_worker">일용직</option>
            <option value="regular_employee">상용직</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="block text-sm">일당(원)</label>
          <input
            type="number"
            className="h-10 rounded-md bg-white text-gray-900 border border-gray-300 px-3 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-blue-500/30"
            value={dailyRate}
            onChange={e => setDailyRate(Number(e.target.value) || 0)}
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm">적용일</label>
          <input
            type="date"
            className="h-10 rounded-md bg-white text-gray-900 border border-gray-300 px-3 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-blue-500/30"
            value={effectiveDate}
            onChange={e => setEffectiveDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm">활성</label>
          <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
          <span className="ml-2 text-sm text-gray-600">현재 활성로 저장</span>
        </div>
        <div className="space-y-2">
          <label className="block text-sm">기존 활성 비활성화</label>
          <input
            type="checkbox"
            checked={replaceActive}
            onChange={e => setReplaceActive(e.target.checked)}
          />
          <span className="ml-2 text-sm text-gray-600">기존 활성 레코드 off</span>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        {[
          'income_tax',
          'local_tax',
          'national_pension',
          'health_insurance',
          'employment_insurance',
        ].map(key => (
          <div key={key} className="space-y-2">
            <label className="block text-sm">{key} (%)</label>
            <input
              type="number"
              step="0.01"
              className="h-10 rounded-md bg-white text-gray-900 border border-gray-300 px-3 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-blue-500/30"
              value={customRates[key] ?? ''}
              onChange={e =>
                setCustomRates(prev => ({ ...prev, [key]: Number(e.target.value) || 0 }))
              }
              placeholder="미입력 시 기본세율"
            />
          </div>
        ))}
      </div>

      <div>
        <button
          type="button"
          onClick={onSave}
          disabled={!workerId}
          className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm disabled:bg-gray-400"
        >
          저장
        </button>
      </div>

      <div className="mt-4">
        <h3 className="font-semibold mb-2">개인세율 목록</h3>
        {loading ? (
          <p className="text-sm text-gray-600">불러오는 중...</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <div className="overflow-x-auto border rounded-md">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-3 py-2">사용자</th>
                  <th className="px-3 py-2">형태</th>
                  <th className="px-3 py-2 text-right">일당</th>
                  <th className="px-3 py-2">적용일</th>
                  <th className="px-3 py-2">활성</th>
                  <th className="px-3 py-2">커스텀세율</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={`${it.worker_id}-${idx}`} className="border-t">
                    <td className="px-3 py-2">{it.profile?.full_name || it.worker_id}</td>
                    <td className="px-3 py-2">{it.employment_type}</td>
                    <td className="px-3 py-2 text-right">
                      ₩{Number(it.daily_rate || 0).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">{it.effective_date}</td>
                    <td className="px-3 py-2">{it.is_active ? 'Y' : 'N'}</td>
                    <td className="px-3 py-2">
                      {it.custom_tax_rates
                        ? Object.entries(it.custom_tax_rates)
                            .map(([k, v]) => `${k}:${v}%`)
                            .join(', ')
                        : '-'}
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
