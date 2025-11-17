'use client'

import React, { useEffect, useState } from 'react'
import { useToast } from '@/components/ui/use-toast'
import EmptyState from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

const EMPLOYMENT_TYPES = ['freelancer', 'daily_worker', 'regular_employee'] as const

type EmploymentType = (typeof EMPLOYMENT_TYPES)[number]
type RateItem = {
  employment_type: EmploymentType
  income_tax_rate: number
  local_tax_rate: number
  pension_rate: number
  health_insurance_rate: number
  employment_insurance_rate: number
  long_term_care_rate: number
  industrial_accident_rate: number
}

const toRateNumber = (value: unknown) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const formatRate = (value: number) => {
  if (!Number.isFinite(value)) return '0'
  const rounded = Math.round(value * 100) / 100
  return rounded % 1 === 0 ? String(rounded) : rounded.toFixed(2)
}

const getTotalRate = (item: RateItem) => {
  return (
    toRateNumber(item.income_tax_rate) +
    toRateNumber(item.local_tax_rate) +
    toRateNumber(item.pension_rate) +
    toRateNumber(item.health_insurance_rate) +
    toRateNumber(item.employment_insurance_rate) +
    toRateNumber(item.long_term_care_rate) +
    toRateNumber(item.industrial_accident_rate)
  )
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
          local_tax_rate: toRateNumber(item.local_tax_rate ?? item.local_tax ?? item.local_income_tax),
          pension_rate: toRateNumber(item.pension_rate ?? item.national_pension),
          health_insurance_rate: toRateNumber(
            item.health_insurance_rate ?? item.health_insurance
          ),
          employment_insurance_rate: toRateNumber(
            item.employment_insurance_rate ?? item.employment_insurance
          ),
          long_term_care_rate: toRateNumber(
            item.long_term_care_rate ?? item.long_term_care ?? item.long_term_care_insurance
          ),
          industrial_accident_rate: toRateNumber(
            item.industrial_accident_rate ?? item.industrial_accident ?? item.industrial_insurance
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
            local_tax_rate: toRateNumber(
              rate.local_tax_rate ?? rate.local_tax ?? rate.local_income_tax
            ),
            pension_rate: toRateNumber(rate.pension_rate ?? rate.national_pension),
            health_insurance_rate: toRateNumber(
              rate.health_insurance_rate ?? rate.health_insurance
            ),
            employment_insurance_rate: toRateNumber(
              rate.employment_insurance_rate ?? rate.employment_insurance
            ),
            long_term_care_rate: toRateNumber(
              rate.long_term_care_rate ?? rate.long_term_care ?? rate.long_term_care_insurance
            ),
            industrial_accident_rate: toRateNumber(
              rate.industrial_accident_rate ??
                rate.industrial_accident ??
                rate.industrial_insurance ??
                rate.industrial_accident_insurance
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
                  <th className="px-3 py-2">지방세(%)</th>
                  <th className="px-3 py-2">국민연금(%)</th>
                  <th className="px-3 py-2">건강보험(%)</th>
                  <th className="px-3 py-2">고용보험(%)</th>
                  <th className="px-3 py-2">장기요양(%)</th>
                  <th className="px-3 py-2">산재보험(%)</th>
                  <th className="px-3 py-2 text-right">기본세율 합(%)</th>
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
                          value={it.local_tax_rate}
                          onChange={e =>
                            onChange(idx, 'local_tax_rate', Number(e.target.value) || 0)
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
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          className="h-8 w-24 rounded-md bg-white text-gray-900 border border-gray-300 px-2 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-blue-500/30"
                          value={it.long_term_care_rate}
                          onChange={e =>
                            onChange(idx, 'long_term_care_rate', Number(e.target.value) || 0)
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          className="h-8 w-24 rounded-md bg-white text-gray-900 border border-gray-300 px-2 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-blue-500/30"
                          value={it.industrial_accident_rate}
                          onChange={e =>
                            onChange(idx, 'industrial_accident_rate', Number(e.target.value) || 0)
                          }
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-medium">
                        {formatRate(getTotalRate(it))}
                      </td>
                    </tr>
                  ))}
                {items.length === 0 && (
                  <tr>
                    <td className="px-3 py-6 text-center text-gray-500" colSpan={9}>
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
      <div className="pt-6">
        <Alert className="bg-blue-50/80 border-blue-100 text-gray-800">
          <AlertTitle className="text-sm font-semibold text-blue-900">대한민국 기본세율 참고</AlertTitle>
          <AlertDescription className="mt-2 text-sm space-y-1">
            <p>2024년 국세청/4대보험 고시 기준 대표 항목입니다. 현장 단가나 고용형태별 특수규정이 있다면 최신 고시값으로 조정해 주세요.</p>
            <ul className="list-disc pl-4 space-y-1 text-gray-700">
              <li>프리랜서·일용직: 소득세 3.0% + 지방소득세 0.3% (총 3.3%)</li>
              <li>상용직: 근로소득 간이세율표(갑근세) 기준, 급여·부양가족 수·보험료 공제 여부에 따라 변동</li>
              <li>상용직 국민연금 근로자 부담분 4.5%, 건강보험 3.545% + 장기요양 12.95% 가산, 고용보험 0.8~0.9%</li>
              <li>산재보험은 업종별 요율이 달라 별도 관리가 필요합니다.</li>
            </ul>
            <p className="mt-2 text-xs text-gray-600">
              (경기도 기준) 지방소득세는 산출된 소득세의 10%가 기본이며, 프리랜서·일용직 3%에 대해 0.3%를 추가 부담합니다.
            </p>
            <div className="mt-3 rounded-lg border border-blue-100 bg-white/70 p-3 text-xs leading-5 text-gray-700">
              <p className="font-semibold text-blue-900">간이세액표(2024, 부양가족 1명 기준 예시)</p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                <div className="rounded-md bg-blue-50/80 p-2">
                  <p className="text-[11px] text-gray-500">월급여 1,000,000원 이하</p>
                  <p className="text-sm font-semibold text-gray-900">세액 약 55,000원</p>
                </div>
                <div className="rounded-md bg-blue-50/80 p-2">
                  <p className="text-[11px] text-gray-500">월급여 2,000,000원</p>
                  <p className="text-sm font-semibold text-gray-900">세액 약 85,000원</p>
                </div>
                <div className="rounded-md bg-blue-50/80 p-2">
                  <p className="text-[11px] text-gray-500">월급여 3,000,000원</p>
                  <p className="text-sm font-semibold text-gray-900">세액 약 140,000원</p>
                </div>
                <div className="rounded-md bg-blue-50/80 p-2">
                  <p className="text-[11px] text-gray-500">월급여 4,000,000원</p>
                  <p className="text-sm font-semibold text-gray-900">세액 약 215,000원</p>
                </div>
                <div className="rounded-md bg-blue-50/80 p-2">
                  <p className="text-[11px] text-gray-500">월급여 5,000,000원</p>
                  <p className="text-sm font-semibold text-gray-900">세액 약 305,000원</p>
                </div>
                <div className="rounded-md bg-blue-50/80 p-2">
                  <p className="text-[11px] text-gray-500">월급여 6,000,000원</p>
                  <p className="text-sm font-semibold text-gray-900">세액 약 415,000원</p>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-gray-500">
                ※ 국세청 근로소득 간이세액표(부양가족/보험료에 따라 가감) 참고. 상세 표는 홈택스 자료를 확인하세요.
              </p>
            </div>
            <p className="text-xs text-gray-500">
              출처: 국세청 원천징수 세율표, 국민연금공단·건강보험공단·고용보험 2024 고시.
            </p>
            <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50/80 p-3 text-xs leading-5 text-amber-900">
              <p className="font-semibold">산재보험(건설업) 참고</p>
              <p className="mt-1">
                건설업 산재보험 요율은 공종·공사금액에 따라 1.5%~3% 이상으로 구간별 차등 적용됩니다. 현장별 표준안:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-4">
                <li>토목·건축 일반 공사: 1.7% 내외</li>
                <li>철골·교량·터널 등 고위험 공종: 2.3%~3.1%</li>
                <li>조경·설비·마감 공종: 1.5%~2.0%</li>
              </ul>
              <p className="mt-2 text-[11px] text-amber-800">
                ※ 실제 요율은 근로복지공단 고지서(업종코드/공사종류)에 따르며, 연도·공사별 산정 자료를 확인해 반영하세요.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      </div>
      </div>
    </div>
  )
}
