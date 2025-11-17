'use client'

import React, { useEffect, useState } from 'react'
import { useToast } from '@/components/ui/use-toast'
import EmptyState from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'

const EMPLOYMENT_TYPES = ['freelancer', 'daily_worker', 'regular_employee'] as const

type EmploymentType = (typeof EMPLOYMENT_TYPES)[number]
type RateItem = {
  employment_type: EmploymentType
  income_tax_rate: number
  pension_rate: number
  health_insurance_rate: number
  employment_insurance_rate: number
}

const toRateNumber = (value: unknown) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const normalizeResponse = (payload: any): RateItem[] => {
  if (Array.isArray(payload)) {
    return payload
      .filter(item => !!item && typeof item === 'object')
      .map(item => {
        const employmentType = item.employment_type as EmploymentType | undefined
        if (!employmentType || !EMPLOYMENT_TYPES.includes(employmentType)) return null
        return {
          employment_type: employmentType,
          income_tax_rate: toRateNumber(item.income_tax_rate ?? item.income_tax),
          pension_rate: toRateNumber(item.pension_rate ?? item.national_pension),
          health_insurance_rate: toRateNumber(
            item.health_insurance_rate ?? item.health_insurance
          ),
          employment_insurance_rate: toRateNumber(
            item.employment_insurance_rate ?? item.employment_insurance
          ),
        }
      })
      .filter((item): item is RateItem => item !== null)
  }

  const ratesObject = payload?.rates && typeof payload.rates === 'object' ? payload.rates : payload
  if (ratesObject && typeof ratesObject === 'object') {
    return EMPLOYMENT_TYPES.map(employment_type => {
      const rate = ratesObject[employment_type] ?? {}
      return {
        employment_type,
        income_tax_rate: toRateNumber(rate.income_tax_rate ?? rate.income_tax),
        pension_rate: toRateNumber(rate.pension_rate ?? rate.national_pension),
        health_insurance_rate: toRateNumber(
          rate.health_insurance_rate ?? rate.health_insurance
        ),
        employment_insurance_rate: toRateNumber(
          rate.employment_insurance_rate ?? rate.employment_insurance
        ),
      }
    })
  }

  return []
}

export default function DefaultRatesPage() {
  const { toast } = useToast()
  const [items, setItems] = useState<RateItem[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch('/api/admin/payroll/rates/defaults')
        const json = await res.json()
        if (!res.ok || json?.success === false) throw new Error(json?.error || '조회 실패')
        setItems(normalizeResponse(json.data))
      } catch (e: any) {
        setError(e?.message || '조회 실패')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const onChange = (idx: number, field: string, value: number) => {
    setItems(prev => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)))
  }

  const onSave = async () => {
    try {
      const res = await fetch('/api/admin/payroll/rates/defaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      const json = await res.json()
      if (!res.ok || json?.success === false) throw new Error(json?.error || '저장 실패')
      toast({ title: '저장 완료', description: '기본 세율이 저장되었습니다.' })
    } catch (e: any) {
      toast({ title: '저장 실패', description: e?.message || '저장 실패', variant: 'destructive' })
    }
  }

  return (
    <div className="px-0 pb-8">
      <PageHeader
        title="기본 세율 관리"
        description="고용형태별 기본세율 설정"
        breadcrumbs={[{ label: '대시보드', href: '/dashboard/admin' }, { label: '급여 관리', href: '/dashboard/admin/salary' }, { label: '기본 세율' }]}
      />
      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-3">
      <p className="text-sm text-gray-600">
        고용형태별 기본세율. 개인세율이 설정되면 기본세율보다 우선합니다.
      </p>
      {loading ? (
        <EmptyState description="불러오는 중..." />
      ) : error ? (
        <EmptyState title="오류" description={error} />
      ) : (
        <>
          <div className="overflow-x-auto border rounded-md">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-3 py-2">고용형태</th>
                  <th className="px-3 py-2">소득세(%)</th>
                  <th className="px-3 py-2">국민연금(%)</th>
                  <th className="px-3 py-2">건강보험(%)</th>
                  <th className="px-3 py-2">고용보험(%)</th>
                </tr>
              </thead>
              <tbody>
                {[...items]
                  .sort((a, b) => {
                    return (
                      EMPLOYMENT_TYPES.indexOf(a.employment_type) -
                      EMPLOYMENT_TYPES.indexOf(b.employment_type)
                    )
                  })
                  .map((it, idx) => (
                    <tr key={`${it.employment_type}-${idx}`} className="border-t">
                      <td className="px-3 py-2">
                        {it.employment_type === 'freelancer'
                          ? '프리랜서'
                          : it.employment_type === 'daily_worker'
                            ? '일용직'
                            : '상용직'}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          className="h-8 w-24 rounded-md bg-white text-gray-900 border border-gray-300 px-2 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-blue-500/30"
                          value={it.income_tax_rate}
                          onChange={e =>
                            onChange(idx, 'income_tax_rate', Number(e.target.value) || 0)
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          className="h-8 w-24 rounded-md bg-white text-gray-900 border border-gray-300 px-2 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-blue-500/30"
                          value={it.pension_rate}
                          onChange={e => onChange(idx, 'pension_rate', Number(e.target.value) || 0)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          className="h-8 w-24 rounded-md bg-white text-gray-900 border border-gray-300 px-2 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-blue-500/30"
                          value={it.health_insurance_rate}
                          onChange={e =>
                            onChange(idx, 'health_insurance_rate', Number(e.target.value) || 0)
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          className="h-8 w-24 rounded-md bg-white text-gray-900 border border-gray-300 px-2 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-blue-500/30"
                          value={it.employment_insurance_rate}
                          onChange={e =>
                            onChange(idx, 'employment_insurance_rate', Number(e.target.value) || 0)
                          }
                        />
                      </td>
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
          <div className="pt-3">
            <button
              type="button"
              onClick={onSave}
              className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm"
            >
              저장
            </button>
          </div>
        </>
      )}
      </div>
    </div>
  )
}
