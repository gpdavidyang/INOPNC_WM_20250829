'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { CheckCircle2, Info, RefreshCw, Save } from 'lucide-react'
import { useEffect, useState } from 'react'

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
    <div className="space-y-6">
      <Card className="rounded-3xl border-gray-200 shadow-sm shadow-gray-200/50">
        <CardContent className="pt-6 space-y-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-black text-foreground flex items-center gap-2">
              <div className="w-1.5 h-6 bg-blue-600 rounded-sm" />
              고용형태별 기본 세율 설정
            </h2>
            <p className="text-sm text-muted-foreground">개인별 세율이 명시되지 않은 모든 작업자에게 적용되는 표준 세율입니다.</p>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-3">
               <RefreshCw className="w-8 h-8 animate-spin opacity-20" />
               <p className="text-sm font-medium">기본 설정 불러오는 중...</p>
            </div>
          ) : error ? (
            <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl text-rose-700 text-center">
               <p className="font-bold mb-1">설정을 불러올 수 없습니다</p>
               <p className="text-sm opacity-80">{error}</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-[#8da0cd] text-white">
                        <th className="px-4 py-3 text-left font-bold w-32">고용형태</th>
                        <th className="px-3 py-3 text-center font-bold">소득세</th>
                        <th className="px-3 py-3 text-center font-bold">지방세</th>
                        <th className="px-3 py-3 text-center font-bold">국민연금</th>
                        <th className="px-3 py-3 text-center font-bold">건강보험</th>
                        <th className="px-3 py-3 text-center font-bold">고용보험</th>
                        <th className="px-3 py-3 text-center font-bold">장기요양</th>
                        <th className="px-3 py-3 text-center font-bold">산재보험</th>
                        <th className="px-4 py-3 text-right font-bold bg-[#7a8dbd]">합계 요율</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {[...items]
                        .sort((a, b) => EMPLOYMENT_TYPES.indexOf(a.employment_type) - EMPLOYMENT_TYPES.indexOf(b.employment_type))
                        .map((it, idx) => (
                          <tr key={`${it.employment_type}-${idx}`} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3 font-bold text-gray-900 border-r border-gray-50">
                              {it.employment_type === 'freelancer' ? '프리랜서' : it.employment_type === 'daily_worker' ? '일용직' : '상용직'}
                            </td>
                            <td className="px-2 py-3">
                              <div className="flex items-center justify-center gap-1.5 translate-x-1">
                                <Input
                                  type="number"
                                  step="0.01"
                                  className="h-9 w-16 text-center rounded-lg bg-gray-50 border-none font-bold text-blue-700"
                                  value={it.income_tax_rate}
                                  onChange={e => onChange(idx, 'income_tax_rate', Number(e.target.value) || 0)}
                                />
                                <span className="text-[10px] font-black text-muted-foreground">%</span>
                              </div>
                            </td>
                            <td className="px-2 py-3">
                              <div className="flex items-center justify-center gap-1.5 translate-x-1">
                                <Input
                                  type="number"
                                  step="0.01"
                                  className="h-9 w-16 text-center rounded-lg bg-gray-50 border-none font-bold text-blue-700"
                                  value={it.local_tax_rate}
                                  onChange={e => onChange(idx, 'local_tax_rate', Number(e.target.value) || 0)}
                                />
                                <span className="text-[10px] font-black text-muted-foreground">%</span>
                              </div>
                            </td>
                            <td className="px-2 py-3">
                              <div className="flex items-center justify-center gap-1.5 translate-x-1">
                                <Input
                                  type="number"
                                  step="0.01"
                                  className="h-9 w-16 text-center rounded-lg bg-gray-50 border-none font-bold text-indigo-700"
                                  value={it.pension_rate}
                                  onChange={e => onChange(idx, 'pension_rate', Number(e.target.value) || 0)}
                                />
                                <span className="text-[10px] font-black text-muted-foreground">%</span>
                              </div>
                            </td>
                            <td className="px-2 py-3">
                              <div className="flex items-center justify-center gap-1.5 translate-x-1">
                                <Input
                                  type="number"
                                  step="0.01"
                                  className="h-9 w-16 text-center rounded-lg bg-gray-50 border-none font-bold text-indigo-700"
                                  value={it.health_insurance_rate}
                                  onChange={e => onChange(idx, 'health_insurance_rate', Number(e.target.value) || 0)}
                                />
                                <span className="text-[10px] font-black text-muted-foreground">%</span>
                              </div>
                            </td>
                            <td className="px-2 py-3">
                              <div className="flex items-center justify-center gap-1.5 translate-x-1">
                                <Input
                                  type="number"
                                  step="0.01"
                                  className="h-9 w-16 text-center rounded-lg bg-gray-50 border-none font-bold text-indigo-700"
                                  value={it.employment_insurance_rate}
                                  onChange={e => onChange(idx, 'employment_insurance_rate', Number(e.target.value) || 0)}
                                />
                                <span className="text-[10px] font-black text-muted-foreground">%</span>
                              </div>
                            </td>
                            <td className="px-2 py-3">
                              <div className="flex items-center justify-center gap-1.5 translate-x-1">
                                <Input
                                  type="number"
                                  step="0.01"
                                  className="h-9 w-16 text-center rounded-lg bg-gray-50 border-none font-bold text-indigo-700"
                                  value={it.long_term_care_rate}
                                  onChange={e => onChange(idx, 'long_term_care_rate', Number(e.target.value) || 0)}
                                />
                                <span className="text-[10px] font-black text-muted-foreground">%</span>
                              </div>
                            </td>
                            <td className="px-2 py-3">
                              <div className="flex items-center justify-center gap-1.5 translate-x-1">
                                <Input
                                  type="number"
                                  step="0.01"
                                  className="h-9 w-16 text-center rounded-lg bg-gray-50 border-none font-bold text-rose-700"
                                  value={it.industrial_accident_rate}
                                  onChange={e => onChange(idx, 'industrial_accident_rate', Number(e.target.value) || 0)}
                                />
                                <span className="text-[10px] font-black text-muted-foreground">%</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right bg-slate-50 font-black text-slate-900 border-l border-gray-100 italic">
                               {formatRate(getTotalRate(it))}%
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  size="lg" 
                  className="rounded-2xl h-12 px-10 gap-2 bg-[#1A254F] hover:bg-[#2A355F] text-white font-bold"
                  onClick={onSave}
                >
                  <Save className="w-5 h-5" />
                  기본 세율 설정 저장하기
                </Button>
              </div>
            </div>
          )}

          <div className="pt-6 border-t border-gray-100">
            <Alert className="rounded-2xl bg-indigo-50/50 border-indigo-100/50 shadow-none p-5">
              <div className="flex items-start gap-4">
                <div className="bg-white p-2.5 rounded-xl shadow-sm border border-indigo-100">
                   <Info className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <AlertTitle className="text-lg font-black text-[#1A254F]">대한민국 기본세율 정책 가이드</AlertTitle>
                    <AlertDescription className="text-sm text-slate-600 font-medium leading-relaxed mt-1">
                      2024년 국세청 고시 기준 대표 항목입니다. 현장 및 고용형태별 특수규정에 따라 자유롭게 조정 가능합니다.
                    </AlertDescription>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                       <h5 className="text-[11px] font-black uppercase text-indigo-700 tracking-wider">세율 기준 (프리랜서·일용직)</h5>
                       <ul className="text-xs space-y-1.5 font-bold text-slate-700">
                          <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-indigo-400" /> 프리랜서: 소득세 3.0% + 지방세 0.3% (총 3.3%)</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-indigo-400" /> 일용직: 일정 일당 초과 시 원천징수 대상</li>
                       </ul>
                    </div>
                    <div className="space-y-3">
                       <h5 className="text-[11px] font-black uppercase text-indigo-700 tracking-wider">4대보험 기준 (상용직)</h5>
                       <ul className="text-xs space-y-1.5 font-bold text-slate-700">
                          <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-indigo-400" /> 국민연금: 근로자 부담분 4.5%</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-indigo-400" /> 건강보험: 3.545% (요양보험 별도 가산)</li>
                       </ul>
                    </div>
                  </div>

                  <div className="rounded-xl border border-indigo-100 bg-white/70 p-4">
                    <p className="text-[10px] font-black text-indigo-900 uppercase tracking-tighter opacity-40 mb-3">간이세액표 참고 (2024, 부양가족 1명)</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: '월 100만', val: '약 5.5만' },
                        { label: '월 200만', val: '약 8.5만' },
                        { label: '월 300만', val: '약 14만' },
                        { label: '월 400만', val: '약 21만' },
                      ].map(card => (
                        <div key={card.label} className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100/50">
                           <div className="text-[10px] font-black text-slate-500 mb-1">{card.label}</div>
                           <div className="text-sm font-black text-slate-900">{card.val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
