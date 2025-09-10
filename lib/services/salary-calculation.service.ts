/**
 * 통합 급여 계산 서비스
 * 모든 역할(Admin, Worker, Site Manager)에서 동일한 계산 로직 사용
 */

import { createClient } from '@/lib/supabase/server'
import { format, startOfMonth, endOfMonth } from 'date-fns'

export interface WorkData {
  user_id: string
  work_date: string
  labor_hours: number
  overtime_hours?: number
  work_hours?: number
  site_id?: string
  role?: string
}

export interface SalaryResult {
  base_pay: number
  overtime_pay: number
  bonus_pay: number
  total_gross_pay: number
  tax_deduction: number
  national_pension: number
  health_insurance: number
  employment_insurance: number
  total_deductions: number
  net_pay: number
}

export interface MonthlySalary extends SalaryResult {
  work_days: number
  total_labor_hours: number
  total_work_hours: number
  total_overtime_hours: number
  period_start: string
  period_end: string
}

export interface SalaryInfo {
  base_salary: number
  hourly_rate: number
  overtime_rate: number
  employment_type?: string
}

export class SalaryCalculationService {
  private supabase = createClient()

  /**
   * 일일 급여 계산 (labor_hours 기준 통일)
   */
  async calculateDailySalary(workData: WorkData): Promise<SalaryResult> {
    try {
      // 급여 정보 조회
      const salaryInfo = await this.getSalaryInfo(workData.user_id, workData.work_date)
      if (!salaryInfo) {
        throw new Error('급여 정보를 찾을 수 없습니다')
      }

      // labor_hours를 기준으로 계산 (1공수 = 8시간)
      const baseHours = Math.min(workData.labor_hours * 8, 8) // 최대 8시간
      const overtimeHours = Math.max((workData.labor_hours * 8) - 8, 0)

      // 급여 계산
      const base_pay = baseHours * salaryInfo.hourly_rate
      const overtime_pay = overtimeHours * salaryInfo.overtime_rate
      const bonus_pay = await this.calculateBonus(workData)
      const total_gross_pay = base_pay + overtime_pay + bonus_pay

      // 공제액 계산
      const deductions = await this.calculateTaxDeductions(
        total_gross_pay,
        salaryInfo.employment_type || 'regular'
      )

      return {
        base_pay,
        overtime_pay,
        bonus_pay,
        total_gross_pay,
        ...deductions,
        net_pay: total_gross_pay - deductions.total_deductions
      }
    } catch (error) {
      console.error('일일 급여 계산 오류:', error)
      throw error
    }
  }

  /**
   * 월간 급여 계산
   */
  async calculateMonthlySalary(
    userId: string,
    year: number,
    month: number,
    siteId?: string
  ): Promise<MonthlySalary> {
    try {
      const period_start = format(startOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd')
      const period_end = format(endOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd')

      // 출근 기록 조회
      let query = this.supabase
        .from('attendance_records')
        .select('*')
        .eq('user_id', userId)
        .gte('work_date', period_start)
        .lte('work_date', period_end)

      if (siteId) {
        query = query.eq('site_id', siteId)
      }

      const { data: attendanceData, error } = await query

      if (error) throw error

      // 급여 정보 조회
      const salaryInfo = await this.getSalaryInfo(userId, period_end)
      if (!salaryInfo) {
        throw new Error('급여 정보를 찾을 수 없습니다')
      }

      // 집계
      let work_days = 0
      let total_labor_hours = 0
      let total_work_hours = 0
      let total_overtime_hours = 0
      let total_base_pay = 0
      let total_overtime_pay = 0
      let total_bonus_pay = 0

      for (const record of attendanceData || []) {
        if (record.labor_hours > 0) {
          work_days++
          total_labor_hours += record.labor_hours || 0
          total_work_hours += record.work_hours || 0
          total_overtime_hours += record.overtime_hours || 0

          // 일일 계산
          const baseHours = Math.min(record.labor_hours * 8, 8)
          const overtimeHours = Math.max((record.labor_hours * 8) - 8, 0)
          
          total_base_pay += baseHours * salaryInfo.hourly_rate
          total_overtime_pay += overtimeHours * salaryInfo.overtime_rate
          total_bonus_pay += await this.calculateBonus({
            user_id: userId,
            work_date: record.work_date,
            labor_hours: record.labor_hours,
            site_id: record.site_id
          })
        }
      }

      const total_gross_pay = total_base_pay + total_overtime_pay + total_bonus_pay

      // 월 단위 공제액 계산
      const deductions = await this.calculateTaxDeductions(
        total_gross_pay,
        salaryInfo.employment_type || 'regular'
      )

      return {
        work_days,
        total_labor_hours,
        total_work_hours,
        total_overtime_hours,
        base_pay: total_base_pay,
        overtime_pay: total_overtime_pay,
        bonus_pay: total_bonus_pay,
        total_gross_pay,
        ...deductions,
        net_pay: total_gross_pay - deductions.total_deductions,
        period_start,
        period_end
      }
    } catch (error) {
      console.error('월간 급여 계산 오류:', error)
      throw error
    }
  }

  /**
   * 세금 및 공제액 계산 (고용형태별 차등 적용)
   */
  async calculateTaxDeductions(
    grossPay: number,
    employmentType: string
  ): Promise<{
    tax_deduction: number
    national_pension: number
    health_insurance: number
    employment_insurance: number
    total_deductions: number
  }> {
    try {
      // 고용형태별 세율 조회
      const { data: taxRates, error } = await this.supabase
        .from('employment_tax_rates')
        .select('*')
        .eq('employment_type', employmentType)
        .single()

      if (error || !taxRates) {
        // 기본 세율 적용
        console.log('기본 세율 적용')
        const tax_deduction = Math.floor(grossPay * 0.08)
        const national_pension = Math.floor(grossPay * 0.045)
        const health_insurance = Math.floor(grossPay * 0.0343)
        const employment_insurance = Math.floor(grossPay * 0.009)

        return {
          tax_deduction,
          national_pension,
          health_insurance,
          employment_insurance,
          total_deductions: tax_deduction + national_pension + health_insurance + employment_insurance
        }
      }

      // DB에서 가져온 세율 적용
      const tax_deduction = Math.floor(grossPay * (taxRates.income_tax_rate / 100))
      const national_pension = Math.floor(grossPay * (taxRates.pension_rate / 100))
      const health_insurance = Math.floor(grossPay * (taxRates.health_insurance_rate / 100))
      const employment_insurance = Math.floor(grossPay * (taxRates.employment_insurance_rate / 100))

      return {
        tax_deduction,
        national_pension,
        health_insurance,
        employment_insurance,
        total_deductions: tax_deduction + national_pension + health_insurance + employment_insurance
      }
    } catch (error) {
      console.error('세금 계산 오류:', error)
      // 오류 시 기본값 반환
      const tax_deduction = Math.floor(grossPay * 0.08)
      const national_pension = Math.floor(grossPay * 0.045)
      const health_insurance = Math.floor(grossPay * 0.0343)
      const employment_insurance = Math.floor(grossPay * 0.009)

      return {
        tax_deduction,
        national_pension,
        health_insurance,
        employment_insurance,
        total_deductions: tax_deduction + national_pension + health_insurance + employment_insurance
      }
    }
  }

  /**
   * 보너스 계산 (추후 구현 예정)
   */
  private async calculateBonus(workData: Partial<WorkData>): Promise<number> {
    // TODO: 보너스 계산 로직 구현
    // 현장별, 역할별, 성과별 보너스 계산
    return 0
  }

  /**
   * 급여 정보 조회
   */
  private async getSalaryInfo(userId: string, date: string): Promise<SalaryInfo | null> {
    try {
      const { data, error } = await this.supabase
        .from('salary_info')
        .select('*')
        .eq('user_id', userId)
        .lte('effective_date', date)
        .is('end_date', null)
        .order('effective_date', { ascending: false })
        .limit(1)
        .single()

      if (error || !data) {
        // 기본값 반환
        return {
          base_salary: 2000000,
          hourly_rate: 15000,
          overtime_rate: 22500,
          employment_type: 'regular'
        }
      }

      // employment_type 조회
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('employment_type')
        .eq('id', userId)
        .single()

      return {
        base_salary: data.base_salary,
        hourly_rate: data.hourly_rate,
        overtime_rate: data.overtime_rate,
        employment_type: profile?.employment_type || 'regular'
      }
    } catch (error) {
      console.error('급여 정보 조회 오류:', error)
      return null
    }
  }

}

// 싱글톤 인스턴스
export const salaryCalculationService = new SalaryCalculationService()