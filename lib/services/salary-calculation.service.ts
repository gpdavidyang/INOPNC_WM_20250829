/**
 * 통합 급여 계산 서비스
 * 모든 역할(Admin, Worker, Site Manager)에서 동일한 계산 로직 사용
 */
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { startOfMonth, endOfMonth } from 'date-fns'

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
  employment_type?: string
  custom_tax_rates?: Record<string, number> | null
}

export class SalaryCalculationService {
  private getSupabaseClient(useServiceRole: boolean = false) {
    try {
      if (useServiceRole) {
        // Lazy import to avoid circular deps in edge runtime
        const { createServiceRoleClient } = require('@/lib/supabase/service-role')
        return createServiceRoleClient()
      }
    } catch (e) {
      // Fallback to anon client if service role env is not present
    }
    return createClient()
  }

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
      const laborDays =
        workData.labor_hours > 0 ? workData.labor_hours : (workData.work_hours || 0) / 8
      const normalizedLaborDays = laborDays > 0 ? laborDays : 0

      // 급여 계산
      const base_pay = Math.round(normalizedLaborDays * salaryInfo.hourly_rate * 8)
      const total_gross_pay = base_pay

      // 공제액 계산
      const deductions = await this.calculateTaxDeductions(
        total_gross_pay,
        salaryInfo.employment_type || 'regular'
      )

      return {
        base_pay,
        total_gross_pay,
        ...deductions,
        net_pay: total_gross_pay - deductions.total_deductions,
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
    siteId?: string,
    useServiceRole: boolean = false
  ): Promise<MonthlySalary> {
    try {
      const period_start = format(startOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd')
      const period_end = format(endOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd')

      // 출근 기록 조회 (work_records 테이블 사용)
      const supabase = this.getSupabaseClient(useServiceRole)
      let query = supabase
        .from('work_records')
        .select('*')
        .or(`user_id.eq.${userId},profile_id.eq.${userId}`)
        .gte('work_date', period_start)
        .lte('work_date', period_end)

      if (siteId) {
        query = query.eq('site_id', siteId)
      }

      const { data: attendanceData, error } = await query

      if (error) throw error

      // 급여 정보 조회
      const salaryInfo = await this.getSalaryInfo(userId, period_end, useServiceRole)
      if (!salaryInfo) {
        throw new Error('급여 정보를 찾을 수 없습니다')
      }

      // 집계
      let work_days = 0
      let total_labor_hours = 0
      let total_work_hours = 0
      let total_overtime_hours = 0
      let total_base_pay = 0

      for (const record of attendanceData || []) {
        const workHours = Number(record.work_hours || 0)
        let laborDays = Number(record.labor_hours || 0)
        if (!(laborDays > 0) && workHours > 0) laborDays = workHours / 8

        // 일자 상태가 출근/지각/진행 중인데 시간 값이 비어있는 경우 보정(8시간/1공수 가정)
        const statusRaw = String((record as any).status || '').toLowerCase()
        const presentKeywords = [
          'present',
          'late',
          'in-progress',
          'in_progress',
          'working',
          'work',
          'checked_in',
          'checked-in',
          'checkedout',
          'checked_out',
          'done',
        ]
        const hasTimes = Boolean((record as any).check_in_time || (record as any).check_out_time)
        const isPresent = presentKeywords.some(k => statusRaw.includes(k)) || hasTimes

        let dailyHours = workHours > 0 ? workHours : laborDays > 0 ? laborDays * 8 : 0
        if (dailyHours === 0 && isPresent) {
          dailyHours = 8
          if (!(laborDays > 0)) laborDays = 1
        }

        if (dailyHours > 0 || laborDays > 0) {
          work_days++
        }

        total_labor_hours += laborDays
        total_work_hours += dailyHours
        const etLower = String(salaryInfo.employment_type || '').toLowerCase()
        const noOvertime = etLower === 'daily_worker' || etLower === 'freelancer'
        const recordedOvertime =
          Number(record.overtime_hours || 0) > 0
            ? Number(record.overtime_hours)
            : Math.max(dailyHours - 8, 0)
        total_overtime_hours += noOvertime ? 0 : recordedOvertime
      }

      // 기본급 산출: 일당 × 총공수
      const dailyRate = Math.round((salaryInfo.hourly_rate || 0) * 8)
      total_base_pay = Math.round(dailyRate * total_labor_hours)

      const total_gross_pay = total_base_pay

      // 월 단위 공제액 계산
      const deductions = await this.calculateTaxDeductions(
        total_gross_pay,
        salaryInfo.employment_type || 'regular_employee',
        salaryInfo.custom_tax_rates || undefined
      )

      return {
        work_days,
        total_labor_hours,
        total_work_hours,
        total_overtime_hours,
        base_pay: total_base_pay,
        total_gross_pay,
        tax_deduction: deductions.tax_deduction,
        national_pension: deductions.national_pension,
        health_insurance: deductions.health_insurance,
        employment_insurance: deductions.employment_insurance,
        total_deductions: deductions.total_deductions,
        rate_source: (deductions as any).rate_source,
        rates: (deductions as any).rates,
        net_pay: total_gross_pay - deductions.total_deductions,
        period_start,
        period_end,
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
    employmentType: string,
    customRates?: Record<string, number>
  ): Promise<{
    tax_deduction: number
    national_pension: number
    health_insurance: number
    employment_insurance: number
    total_deductions: number
    rate_source?: 'custom' | 'employment_type_default'
    rates?: Record<string, number>
  }> {
    try {
      // 1) 개인별 커스텀 세율 우선 적용 (백분율 기준)
      if (customRates && Object.keys(customRates).length > 0) {
        const incomeTax = Math.floor(grossPay * ((customRates['income_tax'] || 0) / 100))
        const localTax = Math.floor(incomeTax * ((customRates['local_tax'] || 0) / 100))
        const nationalPension = Math.floor(
          grossPay * ((customRates['national_pension'] || 0) / 100)
        )
        const healthInsurance = Math.floor(
          grossPay * ((customRates['health_insurance'] || 0) / 100)
        )
        const employmentInsurance = Math.floor(
          grossPay * ((customRates['employment_insurance'] || 0) / 100)
        )

        const total_deductions =
          incomeTax + localTax + nationalPension + healthInsurance + employmentInsurance
        return {
          tax_deduction: incomeTax + localTax,
          national_pension: nationalPension,
          health_insurance: healthInsurance,
          employment_insurance: employmentInsurance,
          total_deductions,
          rate_source: 'custom',
          rates: {
            income_tax: customRates['income_tax'] || 0,
            local_tax: customRates['local_tax'] || 0,
            national_pension: customRates['national_pension'] || 0,
            health_insurance: customRates['health_insurance'] || 0,
            employment_insurance: customRates['employment_insurance'] || 0,
          },
        }
      }

      // 2) 고용형태 기본 정책
      const et = String(employmentType || '').toLowerCase()
      // 프리랜서/일용직: 간이세 3.3%(소득세 3% + 주민세 0.3%), 4대보험 미적용
      if (et === 'freelancer' || et === 'daily_worker' || et === '일용직') {
        const incomeTax = Math.floor(grossPay * 0.03)
        const localTax = Math.floor(grossPay * 0.003)
        const total_deductions = incomeTax + localTax
        return {
          tax_deduction: incomeTax + localTax,
          national_pension: 0,
          health_insurance: 0,
          employment_insurance: 0,
          total_deductions,
        }
      }

      // 3) 상용직(4대보험) - DB 세율 사용
      const supabase = this.getSupabaseClient(true)
      const { data: taxRates, error } = await supabase
        .from('employment_tax_rates')
        .select('*')
        .eq('employment_type', employmentType)
        .single()

      if (error || !taxRates) {
        // 기본 세율 적용(보수적으로 4대보험 + 소득세 8%)
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
          total_deductions:
            tax_deduction + national_pension + health_insurance + employment_insurance,
          rate_source: 'employment_type_default',
          rates: {
            income_tax: 8,
            national_pension: 4.5,
            health_insurance: 3.43,
            employment_insurance: 0.9,
          },
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
        total_deductions:
          tax_deduction + national_pension + health_insurance + employment_insurance,
        rate_source: 'employment_type_default',
        rates: {
          income_tax: taxRates.income_tax_rate,
          national_pension: taxRates.pension_rate,
          health_insurance: taxRates.health_insurance_rate,
          employment_insurance: taxRates.employment_insurance_rate,
        },
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
        total_deductions:
          tax_deduction + national_pension + health_insurance + employment_insurance,
      }
    }
  }

  /**
   * 급여 정보 조회
   */
  private async getSalaryInfo(
    userId: string,
    date: string,
    useServiceRole: boolean = false
  ): Promise<SalaryInfo | null> {
    try {
      const supabase = this.getSupabaseClient(useServiceRole)

      // 1) 우선 개인별 급여 설정(worker_salary_settings) 조회
      const { data: wSetting } = await supabase
        .from('worker_salary_settings')
        .select('employment_type, daily_rate, custom_tax_rates')
        .eq('worker_id', userId)
        .eq('is_active', true)
        .lte('effective_date', date)
        .order('effective_date', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (wSetting) {
        const hourly = Math.round(wSetting.daily_rate / 8)
        return {
          base_salary: wSetting.daily_rate * 20, // 정보가 없을 때의 월급 추정(사용 안함)
          hourly_rate: hourly,
          employment_type: wSetting.employment_type,
          custom_tax_rates: (wSetting as any).custom_tax_rates || null,
        }
      }

      // 2) 레거시 salary_info 테이블 폴백
      const { data, error } = await supabase
        .from('salary_info')
        .select('*')
        .eq('user_id', userId)
        .lte('effective_date', date)
        .is('end_date', null)
        .order('effective_date', { ascending: false })
        .limit(1)
        .single()

      if (!error && data) {
        // employment_type 조회 (role로 보정)
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single()
        const role = (profile?.role || '').toLowerCase()
        const inferredType =
          role === 'worker' || role === 'site_manager' ? 'daily_worker' : 'regular_employee'
        return {
          base_salary: data.base_salary,
          hourly_rate: data.hourly_rate,
          employment_type: inferredType,
          custom_tax_rates: null,
        }
      }

      // 3) 완전 기본값(개발 편의)
      return {
        base_salary: 2000000,
        hourly_rate: 15000,
        employment_type: 'regular_employee',
        custom_tax_rates: null,
      }
    } catch (error) {
      console.error('급여 정보 조회 오류:', error)
      return null
    }
  }
}

// 싱글톤 인스턴스
export const salaryCalculationService = new SalaryCalculationService()
