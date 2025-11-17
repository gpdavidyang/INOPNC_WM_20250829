/**
 * 급여 계산 로직
 * 3.3% 선취 방식과 일반 계산 방식 지원
 */

export interface SalaryCalculationParams {
  baseAmount: number // 기본 급여 (일급 또는 시급)
  workHours: number // 근무 시간
  calculationType: 'normal' | 'tax_prepaid' // 일반 or 3.3% 선취
  taxRate?: number // 세율 (기본 3.3%)
  deductions?: number // 공제액
}

export interface SalaryCalculationResult {
  grossPay: number // 총 급여
  basePay: number // 기본급
  deductions: number // 공제액
  taxAmount: number // 세금
  netPay: number // 실수령액
  calculationType: string
  details: {
    hourlyRate?: number
    dailyRate?: number
    taxRate: number
    workHours: number
  }
}

/**
 * 급여 계산 함수
 */
export function calculateSalary(params: SalaryCalculationParams): SalaryCalculationResult {
  const { baseAmount, workHours, calculationType, taxRate = 3.3, deductions = 0 } = params

  // 기본급 계산
  const normalizedHours = Math.max(workHours, 0)
  const basePay = baseAmount * normalizedHours

  // 총 급여 (세전)
  const grossPay = basePay - deductions

  // 세금 계산
  let taxAmount = 0
  let netPay = grossPay

  if (calculationType === 'tax_prepaid') {
    // 3.3% 선취 방식
    // 실수령액 = 총급여 * (100 - 3.3) / 100
    taxAmount = grossPay * (taxRate / 100)
    netPay = grossPay - taxAmount
  } else {
    // 일반 계산 방식 (추후 다른 세금 계산 로직 추가 가능)
    // 현재는 단순히 총급여를 실수령액으로 설정
    netPay = grossPay
  }

  return {
    grossPay,
    basePay,
    deductions,
    taxAmount,
    netPay,
    calculationType,
    details: {
      hourlyRate: baseAmount,
      taxRate,
      workHours: normalizedHours,
    },
  }
}

/**
 * 월급 계산 함수 (일급 기준)
 */
export function calculateMonthlySalary(
  dailyRate: number,
  workDays: number[],
  calculationType: 'normal' | 'tax_prepaid' = 'tax_prepaid',
  taxRate: number = 3.3
): SalaryCalculationResult {
  const regularHours = workDays.reduce((sum, hours) => sum + Math.min(hours, 8), 0)
  const hourlyRate = dailyRate / 8

  return calculateSalary({
    baseAmount: hourlyRate,
    workHours: regularHours,
    calculationType,
    taxRate,
  })
}

/**
 * 공수 기반 급여 계산
 * 1.0 공수 = 8시간 = 1일
 */
export function calculateSalaryByLaborHours(
  dailyRate: number,
  laborHours: number, // 공수 (1.0 = 8시간)
  calculationType: 'normal' | 'tax_prepaid' = 'tax_prepaid',
  taxRate: number = 3.3
): SalaryCalculationResult {
  const regularHours = Math.max(laborHours * 8, 0) // 공수를 시간으로 변환
  const hourlyRate = dailyRate / 8

  return calculateSalary({
    baseAmount: hourlyRate,
    workHours: regularHours,
    calculationType,
    taxRate,
  })
}

/**
 * 급여 포맷팅 함수
 */
export function formatSalary(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * 급여 요약 생성
 */
export function generateSalarySummary(result: SalaryCalculationResult): string {
  const lines = [
    `총 급여: ${formatSalary(result.grossPay)}`,
    `기본급: ${formatSalary(result.basePay)}`,
  ]

  if (result.deductions > 0) {
    lines.push(`공제액: ${formatSalary(result.deductions)}`)
  }

  if (result.taxAmount > 0) {
    lines.push(`세금(${result.details.taxRate}%): ${formatSalary(result.taxAmount)}`)
  }

  lines.push(`실수령액: ${formatSalary(result.netPay)}`)

  return lines.join('\n')
}
