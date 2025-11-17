/**
 * Enhanced Salary Calculator with Employment Type Support
 * 고용형태별 급여 계산기
 */

import {
  EmploymentType,
  TaxRate,
  EnhancedSalaryCalculationResult,
  PersonalSalaryCalculationParams,
} from '@/types'

// 기본 세율 설정 (실제로는 데이터베이스에서 가져옴)
export const DEFAULT_TAX_RATES: Record<EmploymentType, Record<string, number>> = {
  regular_employee: {
    소득세: 3.3,
    주민세: 0.33,
    국민연금: 4.5,
    건강보험: 3.545,
    고용보험: 0.9,
  },
  freelancer: {
    소득세: 3.3,
    주민세: 0.33,
  },
  daily_worker: {
    소득세: 6.0,
    주민세: 0.6,
  },
}

// 고용형태별 한국어 라벨
export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  regular_employee: '4대보험 직원',
  freelancer: '프리랜서',
  daily_worker: '일용직',
}

// 세금 항목별 한국어 라벨
export const TAX_LABELS: Record<string, string> = {
  소득세: '소득세',
  주민세: '주민세',
  국민연금: '국민연금',
  건강보험: '건강보험',
  고용보험: '고용보험',
}

/**
 * 급여 계산 파라미터
 */
export interface EnhancedSalaryCalculationParams {
  employment_type: EmploymentType
  daily_rate: number
  labor_hours: number // 공수 (1.0 = 8시간)
  additional_deductions?: number
  custom_tax_rates?: Record<string, number> // 커스텀 세율
  work_date?: string
}

/**
 * 개인별 급여 계산 함수
 * @param params 급여 계산 파라미터
 * @param tax_rates 세율 설정 (옵션)
 */
export function calculateEnhancedSalary(
  params: EnhancedSalaryCalculationParams,
  tax_rates?: TaxRate[]
): EnhancedSalaryCalculationResult {
  const {
    employment_type,
    daily_rate,
    labor_hours,
    additional_deductions = 0,
    custom_tax_rates = {},
    work_date = new Date().toISOString().split('T')[0],
  } = params

  // 1. 기본 급여 계산 (공수 기준)
  const normalizedLabor = Math.max(labor_hours, 0)
  const total_hours = normalizedLabor * 8 // 공수를 시간으로 변환
  const regular_hours = total_hours
  const overtime_hours = 0

  const base_pay = normalizedLabor * daily_rate
  const gross_pay = base_pay

  // 2. 세율 결정 (커스텀 > 데이터베이스 > 기본값)
  const applicable_rates = { ...DEFAULT_TAX_RATES[employment_type] }

  // 데이터베이스 세율이 있으면 적용
  if (tax_rates) {
    tax_rates
      .filter(rate => rate.employment_type === employment_type && rate.is_active)
      .forEach(rate => {
        applicable_rates[rate.tax_name] = rate.rate
      })
  }

  // 커스텀 세율이 있으면 우선 적용
  Object.entries(custom_tax_rates).forEach(([tax_name, rate]) => {
    applicable_rates[tax_name] = rate
  })

  // 3. 세금 계산
  const taxes = {
    income_tax: 0,
    resident_tax: 0,
    national_pension: 0,
    health_insurance: 0,
    employment_insurance: 0,
    other_deductions: additional_deductions,
  }

  Object.entries(applicable_rates).forEach(([tax_name, rate]) => {
    const tax_amount = gross_pay * (rate / 100)

    switch (tax_name) {
      case '소득세':
        taxes.income_tax = tax_amount
        break
      case '주민세':
        taxes.resident_tax = tax_amount
        break
      case '국민연금':
        taxes.national_pension = tax_amount
        break
      case '건강보험':
        taxes.health_insurance = tax_amount
        break
      case '고용보험':
        taxes.employment_insurance = tax_amount
        break
    }
  })

  // 4. 총 세금 및 실수령액 계산
  const total_tax = Object.values(taxes).reduce((sum, tax) => sum + tax, 0)
  const net_pay = gross_pay - total_tax

  // 5. 세부 정보 구성
  const tax_details = {
    employment_type,
    daily_rate,
    labor_hours,
    total_hours,
    regular_hours,
    gross_pay,
    base_pay,
    applied_rates: applicable_rates,
    work_date,
  }

  return {
    worker_id: '', // API에서 설정됨
    employment_type,
    daily_rate,
    gross_pay,
    base_pay,
    deductions: taxes,
    total_tax,
    net_pay,
    tax_details,
  }
}

/**
 * 고용형태별 세율 유효성 검증
 */
export function validateTaxRates(
  employment_type: EmploymentType,
  custom_rates?: Record<string, number>
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  const required_taxes = Object.keys(DEFAULT_TAX_RATES[employment_type])

  if (custom_rates) {
    Object.entries(custom_rates).forEach(([tax_name, rate]) => {
      if (!required_taxes.includes(tax_name)) {
        errors.push(`${employment_type}에는 ${tax_name} 세금이 적용되지 않습니다.`)
      }

      if (rate < 0 || rate > 100) {
        errors.push(`${tax_name} 세율은 0%와 100% 사이여야 합니다.`)
      }
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * 월별 급여 집계 계산
 */
export function calculateMonthlySalaryAggregate(daily_records: EnhancedSalaryCalculationResult[]): {
  total_gross_pay: number
  total_tax: number
  total_net_pay: number
  total_labor_hours: number
  work_days: number
  employment_type_breakdown: Record<
    EmploymentType,
    {
      count: number
      total_gross: number
      total_tax: number
      total_net: number
    }
  >
} {
  const breakdown: Record<string, unknown> = {
    regular_employee: { count: 0, total_gross: 0, total_tax: 0, total_net: 0 },
    freelancer: { count: 0, total_gross: 0, total_tax: 0, total_net: 0 },
    daily_worker: { count: 0, total_gross: 0, total_tax: 0, total_net: 0 },
  }

  const totals = daily_records.reduce(
    (acc, record) => {
      acc.total_gross_pay += record.gross_pay
      acc.total_tax += record.total_tax
      acc.total_net_pay += record.net_pay
      acc.total_labor_hours += record.tax_details?.labor_hours || 0
      acc.work_days += 1

      // 고용형태별 집계
      const type = record.employment_type
      breakdown[type].count += 1
      breakdown[type].total_gross += record.gross_pay
      breakdown[type].total_tax += record.total_tax
      breakdown[type].total_net += record.net_pay

      return acc
    },
    {
      total_gross_pay: 0,
      total_tax: 0,
      total_net_pay: 0,
      total_labor_hours: 0,
      work_days: 0,
    }
  )

  return {
    ...totals,
    employment_type_breakdown: breakdown,
  }
}

/**
 * 급여 계산 상세 포맷팅
 */
export function formatSalaryDetails(result: EnhancedSalaryCalculationResult): string {
  const details = result.tax_details
  const type_label = EMPLOYMENT_TYPE_LABELS[result.employment_type]

  let output = `=== ${type_label} 급여 계산 ===\n`
  output += `일급: ${result.daily_rate.toLocaleString()}원\n`
  output += `공수: ${details.labor_hours.toFixed(2)}공수 (${details.total_hours}시간)\n`
  output += `기본급: ${result.base_pay.toLocaleString()}원\n`
  output += `총급여: ${result.gross_pay.toLocaleString()}원\n\n`

  output += `--- 공제내역 ---\n`
  Object.entries(result.deductions).forEach(([key, value]) => {
    if (value > 0) {
      const label = TAX_LABELS[key] || key
      output += `${label}: ${value.toLocaleString()}원\n`
    }
  })

  output += `총공제: ${result.total_tax.toLocaleString()}원\n`
  output += `실수령액: ${result.net_pay.toLocaleString()}원\n`

  return output
}

/**
 * 고용형태별 기본 설정 가져오기
 */
export function getDefaultEmploymentSettings(employment_type: EmploymentType) {
  return {
    employment_type,
    label: EMPLOYMENT_TYPE_LABELS[employment_type],
    tax_rates: DEFAULT_TAX_RATES[employment_type],
    required_taxes: Object.keys(DEFAULT_TAX_RATES[employment_type]),
  }
}
