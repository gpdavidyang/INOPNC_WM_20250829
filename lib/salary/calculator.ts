/**
 * 급여 계산 로직
 * 3.3% 선취 방식과 일반 계산 방식 지원
 */

export interface SalaryCalculationParams {
  baseAmount: number // 기본 급여 (일급 또는 시급)
  workHours: number // 근무 시간
  overtimeHours?: number // 연장 근무 시간
  overtimeMultiplier?: number // 연장 근무 배율 (기본 1.5)
  calculationType: 'normal' | 'tax_prepaid' // 일반 or 3.3% 선취
  taxRate?: number // 세율 (기본 3.3%)
  bonuses?: number // 보너스
  deductions?: number // 공제액
}

export interface SalaryCalculationResult {
  grossPay: number // 총 급여
  basePay: number // 기본급
  overtimePay: number // 연장 수당
  bonuses: number // 보너스
  deductions: number // 공제액
  taxAmount: number // 세금
  netPay: number // 실수령액
  calculationType: string
  details: {
    hourlyRate?: number
    dailyRate?: number
    overtimeRate?: number
    taxRate: number
    workHours: number
    overtimeHours: number
  }
}

/**
 * 급여 계산 함수
 */
export function calculateSalary(params: SalaryCalculationParams): SalaryCalculationResult {
  const {
    baseAmount,
    workHours,
    overtimeHours = 0,
    overtimeMultiplier = 1.5,
    calculationType,
    taxRate = 3.3,
    bonuses = 0,
    deductions = 0
  } = params

  // 기본급 계산
  const basePay = baseAmount * workHours
  
  // 연장 수당 계산
  const overtimeRate = baseAmount * overtimeMultiplier
  const overtimePay = overtimeRate * overtimeHours
  
  // 총 급여 (세전)
  const grossPay = basePay + overtimePay + bonuses - deductions
  
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
    overtimePay,
    bonuses,
    deductions,
    taxAmount,
    netPay,
    calculationType,
    details: {
      hourlyRate: baseAmount,
      overtimeRate,
      taxRate,
      workHours,
      overtimeHours
    }
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
  const totalDays = workDays.length
  const regularDays = workDays.filter(hours => hours <= 8).length
  const overtimeDays = workDays.filter(hours => hours > 8).length
  
  // 정규 근무 시간 계산
  const regularHours = workDays.reduce((sum, hours) => sum + Math.min(hours, 8), 0)
  
  // 연장 근무 시간 계산
  const overtimeHours = workDays.reduce((sum, hours) => sum + Math.max(hours - 8, 0), 0)
  
  // 시급 계산 (일급 / 8시간)
  const hourlyRate = dailyRate / 8
  
  return calculateSalary({
    baseAmount: hourlyRate,
    workHours: regularHours,
    overtimeHours,
    overtimeMultiplier: 1.5,
    calculationType,
    taxRate
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
  const totalHours = laborHours * 8 // 공수를 시간으로 변환
  const regularHours = Math.min(totalHours, 8)
  const overtimeHours = Math.max(totalHours - 8, 0)
  
  const hourlyRate = dailyRate / 8
  
  return calculateSalary({
    baseAmount: hourlyRate,
    workHours: regularHours,
    overtimeHours,
    overtimeMultiplier: 1.5,
    calculationType,
    taxRate
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
    maximumFractionDigits: 0
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
  
  if (result.overtimePay > 0) {
    lines.push(`연장수당: ${formatSalary(result.overtimePay)}`)
  }
  
  if (result.bonuses > 0) {
    lines.push(`보너스: ${formatSalary(result.bonuses)}`)
  }
  
  if (result.deductions > 0) {
    lines.push(`공제액: ${formatSalary(result.deductions)}`)
  }
  
  if (result.taxAmount > 0) {
    lines.push(`세금(${result.details.taxRate}%): ${formatSalary(result.taxAmount)}`)
  }
  
  lines.push(`실수령액: ${formatSalary(result.netPay)}`)
  
  return lines.join('\n')
}