'use server'

/**
 * 세율 관리 API
 */

// 모든 세율 조회
export async function getTaxRates(
  employment_type?: EmploymentType
): Promise<AdminActionResult<TaxRate[]>> {
  return withAdminAuth(async supabase => {
    try {
      let query = supabase
        .from('employment_tax_rates')
        .select('*')
        .eq('is_active', true)
        .order('employment_type', { ascending: true })
        .order('tax_name', { ascending: true })

      if (employment_type) {
        query = query.eq('employment_type', employment_type)
      }

      const { data: rates, error } = await query

      if (error) {
        console.error('Error fetching tax rates:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      return {
        success: true,
        data: rates || [],
      }
    } catch (error) {
      console.error('Tax rates fetch error:', error)
      return { success: false, error: AdminErrors.UNKNOWN_ERROR }
    }
  })
}

// 세율 업데이트
export async function updateTaxRate(
  id: string,
  rate: number,
  description?: string
): Promise<AdminActionResult<void>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      if (!id || rate === undefined || rate === null) {
        return { success: false, error: '필수 입력 항목이 누락되었습니다.' }
      }

      if (rate < 0 || rate > 100) {
        return { success: false, error: '세율은 0%와 100% 사이여야 합니다.' }
      }

      const { error } = await supabase
        .from('employment_tax_rates')
        .update({
          rate,
          description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) {
        console.error('Error updating tax rate:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      return {
        success: true,
        message: '세율이 업데이트되었습니다.',
      }
    } catch (error) {
      console.error('Tax rate update error:', error)
      return { success: false, error: AdminErrors.UNKNOWN_ERROR }
    }
  })
}

/**
 * 개인별 급여 설정 관리 API
 */

// 직원별 급여 설정 조회
export async function getWorkerSalarySettings(
  worker_id?: string,
  employment_type?: EmploymentType,
  active_only: boolean = true
): Promise<AdminActionResult<WorkerSalarySetting[]>> {
  return withAdminAuth(async supabase => {
    try {
      let query = supabase
        .from('worker_salary_settings')
        .select(
          `
          *,
          worker:profiles!worker_id (
            id,
            full_name,
            email,
            role
          )
        `
        )
        .order('effective_date', { ascending: false })

      if (worker_id) {
        query = query.eq('worker_id', worker_id)
      }

      if (employment_type) {
        query = query.eq('employment_type', employment_type)
      }

      if (active_only) {
        query = query.eq('is_active', true)
      }

      const { data: settings, error } = await query

      if (error) {
        console.error('Error fetching worker salary settings:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      return {
        success: true,
        data: settings || [],
      }
    } catch (error) {
      console.error('Worker salary settings fetch error:', error)
      return { success: false, error: AdminErrors.UNKNOWN_ERROR }
    }
  })
}

// 급여 설정 생성/업데이트
export async function setWorkerSalarySetting(
  worker_id: string,
  employment_type: EmploymentType,
  daily_rate: number,
  custom_tax_rates?: Record<string, number>,
  bank_account_info?: Record<string, unknown>,
  effective_date: string = new Date().toISOString().split('T')[0],
  notes?: string
): Promise<AdminActionResult<{ setting_id: string }>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      if (!worker_id || !employment_type || !daily_rate) {
        return { success: false, error: '필수 입력 항목이 누락되었습니다.' }
      }

      if (daily_rate <= 0) {
        return { success: false, error: '일급은 0보다 커야 합니다.' }
      }

      // Call database function to set worker salary setting
      const { data: result, error } = await supabase.rpc('set_worker_salary_setting', {
        p_worker_id: worker_id,
        p_employment_type: employment_type,
        p_daily_rate: daily_rate,
        p_custom_tax_rates: custom_tax_rates ? JSON.stringify(custom_tax_rates) : null,
        p_bank_account_info: bank_account_info ? JSON.stringify(bank_account_info) : null,
        p_effective_date: effective_date,
      })

      if (error) {
        console.error('Error setting worker salary setting:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      // Add notes if provided
      if (notes && result) {
        await supabase.from('worker_salary_settings').update({ notes }).eq('id', result)
      }

      return {
        success: true,
        data: { setting_id: result },
        message: '급여 설정이 저장되었습니다.',
      }
    } catch (error) {
      console.error('Worker salary setting error:', error)
      return { success: false, error: AdminErrors.UNKNOWN_ERROR }
    }
  })
}

// 개인별 급여 계산
export async function calculatePersonalSalary(
  params: PersonalSalaryCalculationParams
): Promise<AdminActionResult<EnhancedSalaryCalculationResult>> {
  return withAdminAuth(async supabase => {
    try {
      const { worker_id, work_date, labor_hours, additional_deductions = 0 } = params

      if (!worker_id || !work_date || labor_hours === undefined || labor_hours === null) {
        return { success: false, error: '필수 입력 항목이 누락되었습니다.' }
      }

      if (labor_hours <= 0) {
        return { success: false, error: '공수는 0보다 커야 합니다.' }
      }

      // Call database function to calculate individual salary
      const { data: result, error } = await supabase.rpc('calculate_individual_salary', {
        p_worker_id: worker_id,
        p_labor_hours: labor_hours,
        p_work_date: work_date,
      })

      if (error) {
        console.error('Error calculating personal salary:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      if (!result || result.length === 0) {
        return {
          success: false,
          error: '해당 직원의 급여 설정을 찾을 수 없습니다. 먼저 급여 설정을 등록해주세요.',
        }
      }

      const calculation = result[0]

      // Convert to enhanced result format
      const enhancedResult: EnhancedSalaryCalculationResult = {
        worker_id,
        employment_type: calculation.employment_type as EmploymentType,
        daily_rate: parseFloat(calculation.daily_rate),
        gross_pay: parseFloat(calculation.gross_pay),
        base_pay: parseFloat(calculation.base_pay),
        deductions: {
          income_tax: parseFloat(calculation.income_tax),
          resident_tax: parseFloat(calculation.resident_tax),
          national_pension: parseFloat(calculation.national_pension),
          health_insurance: parseFloat(calculation.health_insurance),
          employment_insurance: parseFloat(calculation.employment_insurance),
          other_deductions: additional_deductions,
        },
        total_tax: parseFloat(calculation.total_tax) + additional_deductions,
        net_pay: parseFloat(calculation.net_pay) - additional_deductions,
        tax_details: {
          ...calculation.tax_details,
          additional_deductions,
        },
      }

      return {
        success: true,
        data: enhancedResult,
      }
    } catch (error) {
      console.error('Personal salary calculation error:', error)
      return { success: false, error: AdminErrors.UNKNOWN_ERROR }
    }
  })
}

// 개인별 급여 기록 저장
export async function savePersonalSalaryRecord(
  calculation: EnhancedSalaryCalculationResult,
  work_date: string,
  site_id?: string,
  notes?: string
): Promise<AdminActionResult<{ record_id: string }>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      if (!calculation.worker_id || !work_date) {
        return { success: false, error: '필수 입력 항목이 누락되었습니다.' }
      }

      const labor_hours = calculation.tax_details?.labor_hours || 0
      const regular_hours = Math.min(labor_hours * 8, 8)
      const overtime_hours = Math.max(labor_hours * 8 - 8, 0)

      const { data: record, error } = await supabase
        .from('salary_records')
        .insert({
          worker_id: calculation.worker_id,
          site_id: site_id,
          work_date,
          employment_type: calculation.employment_type,
          regular_hours,
          overtime_hours,
          labor_hours,
          base_pay: calculation.base_pay,
          deductions: calculation.deductions.other_deductions || 0,
          income_tax: calculation.deductions.income_tax,
          resident_tax: calculation.deductions.resident_tax,
          national_pension: calculation.deductions.national_pension,
          health_insurance: calculation.deductions.health_insurance,
          employment_insurance: calculation.deductions.employment_insurance,
          tax_amount: calculation.total_tax,
          total_pay: calculation.net_pay,
          status: 'calculated',
          tax_details: calculation.tax_details,
          notes,
        })
        .select()
        .single()

      if (error) {
        console.error('Error saving salary record:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      return {
        success: true,
        data: { record_id: record.id },
        message: '급여 기록이 저장되었습니다.',
      }
    } catch (error) {
      console.error('Salary record save error:', error)
      return { success: false, error: AdminErrors.UNKNOWN_ERROR }
    }
  })
}

// 월별 개인별 급여 요약
export async function getPersonalMonthlySalarySummary(
  worker_id: string,
  year: number,
  month: number
): Promise<
  AdminActionResult<{
    total_records: number
    total_labor_hours: number
    total_gross_pay: number
    total_tax: number
    total_net_pay: number
    employment_type: EmploymentType
    records: unknown[]
  }>
> {
  return withAdminAuth(async supabase => {
    try {
      if (!worker_id || !year || !month) {
        return { success: false, error: '필수 입력 항목이 누락되었습니다.' }
      }

      const start_date = new Date(year, month - 1, 1).toISOString().split('T')[0]
      const end_date = new Date(year, month, 0).toISOString().split('T')[0]

      const { data: records, error } = await supabase
        .from('salary_records')
        .select(
          `
          *,
          site:sites (
            id,
            name
          )
        `
        )
        .eq('worker_id', worker_id)
        .gte('work_date', start_date)
        .lte('work_date', end_date)
        .order('work_date', { ascending: true })

      if (error) {
        console.error('Error fetching personal monthly salary:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      if (!records || records.length === 0) {
        return {
          success: true,
          data: {
            total_records: 0,
            total_labor_hours: 0,
            total_gross_pay: 0,
            total_tax: 0,
            total_net_pay: 0,
            employment_type: 'daily_worker' as EmploymentType,
            records: [],
          },
        }
      }

      const summary = records.reduce(
        (acc: unknown, record: unknown) => {
          acc.total_records += 1
          acc.total_labor_hours += record.labor_hours || 0
          acc.total_gross_pay += record.base_pay
          acc.total_tax += record.tax_amount || 0
          acc.total_net_pay += record.total_pay
          return acc
        },
        {
          total_records: 0,
          total_labor_hours: 0,
          total_gross_pay: 0,
          total_tax: 0,
          total_net_pay: 0,
        }
      )

      return {
        success: true,
        data: {
          ...summary,
          employment_type: records[0]?.employment_type || 'daily_worker',
          records,
        },
      }
    } catch (error) {
      console.error('Personal monthly salary summary error:', error)
      return { success: false, error: AdminErrors.UNKNOWN_ERROR }
    }
  })
}

// 모든 직원 목록 (급여 설정용)
export async function getWorkersForSalarySettings(): Promise<
  AdminActionResult<
    Array<{
      id: string
      full_name: string
      email: string
      role: string
      has_salary_setting: boolean
      employment_type?: EmploymentType
      daily_rate?: number
    }>
  >
> {
  return withAdminAuth(async supabase => {
    try {
      const { data: workers, error } = await supabase
        .from('profiles')
        .select(
          `
          id,
          full_name,
          email,
          role,
          salary_settings:worker_salary_settings!worker_id (
            id,
            employment_type,
            daily_rate,
            is_active
          )
        `
        )
        .in('role', ['worker', 'site_manager', 'customer_manager'])
        .neq('status', 'inactive')
        .order('full_name')

      if (error) {
        console.error('Error fetching workers for salary settings:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      const formatted_workers =
        workers?.map((worker: unknown) => {
          const active_setting = worker.salary_settings?.find((s: unknown) => s.is_active)
          return {
            id: worker.id,
            full_name: worker.full_name,
            email: worker.email,
            role: worker.role,
            has_salary_setting: !!active_setting,
            employment_type: active_setting?.employment_type,
            daily_rate: active_setting?.daily_rate,
          }
        }) || []

      return {
        success: true,
        data: formatted_workers,
      }
    } catch (error) {
      console.error('Workers for salary settings fetch error:', error)
      return { success: false, error: AdminErrors.UNKNOWN_ERROR }
    }
  })
}
