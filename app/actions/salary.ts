'use server'

import { createClient } from '@/lib/supabase/server'
import { salaryCalculationService } from '@/lib/services/salary-calculation.service'

interface SalaryInfo {
  id: string
  user_id: string
  base_salary: number
  hourly_rate: number
  effective_date: string
  end_date?: string
  created_at: string
  updated_at: string
}

interface MonthlySalaryCalculation {
  base_salary: number
  hourly_rate: number
  total_work_hours: number
  total_overtime_hours: number
  total_labor_hours: number
  regular_pay: number
  total_gross_pay: number
  tax_deduction: number
  national_pension: number
  health_insurance: number
  employment_insurance: number
  total_deductions: number
  net_pay: number
  work_days: number
}

export async function getSalaryInfo(params: { user_id: string; date?: string }) {
  try {
    const supabase = createClient()

    // Get current salary info
    let query = supabase
      .from('salary_info')
      .select('*')
      .eq('user_id', params.user_id)
      .is('end_date', null)

    if (params.date) {
      query = query.lte('effective_date', params.date)
    }

    const { data, error } = await query
      .order('effective_date', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error('❌ Error fetching salary info:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data as SalaryInfo }
  } catch (error: unknown) {
    console.error('❌ Exception in getSalaryInfo:', error)
    return { success: false, error: error.message }
  }
}

export async function calculateMonthlySalary(params: {
  user_id: string
  year: number
  month: number
  site_id?: string
}) {
  try {
    // 통합 급여 계산 서비스 사용
    const result = await salaryCalculationService.calculateMonthlySalary(
      params.user_id,
      params.year,
      params.month,
      params.site_id
    )

    // 기존 인터페이스에 맞게 변환 - result의 모든 필드 포함
    const calculation: unknown = {
      base_salary: 0, // 서비스에서 직접 계산
      hourly_rate: 0, // 서비스에서 직접 계산
      total_work_hours: result.total_work_hours,
      total_overtime_hours: result.total_overtime_hours,
      total_labor_hours: result.total_labor_hours,
      regular_pay: result.base_pay,
      base_pay: result.base_pay, // PDF 생성에 필요
      total_gross_pay: result.total_gross_pay,
      tax_deduction: result.tax_deduction,
      national_pension: result.national_pension,
      health_insurance: result.health_insurance,
      employment_insurance: result.employment_insurance,
      total_deductions: result.total_deductions,
      net_pay: result.net_pay,
      work_days: result.work_days,
      period_start: result.period_start, // 추가
      period_end: result.period_end, // 추가
    }

    // salary_info 조회하여 rate 정보 추가
    const salaryResult = await getSalaryInfo({
      user_id: params.user_id,
      date: `${params.year}-${params.month.toString().padStart(2, '0')}-01`,
    })

    if (salaryResult.success && salaryResult.data) {
      calculation.base_salary = salaryResult.data.base_salary
      calculation.hourly_rate = salaryResult.data.hourly_rate
    }

    return { success: true, data: calculation }
  } catch (error: unknown) {
    console.error('❌ Exception in calculateMonthlySalary:', error)
    return { success: false, error: error.message }
  }
}

export async function getCompanySalarySummary(params: {
  organization_id: string
  site_id?: string
  month?: string
}) {
  try {
    const supabase = createClient()

    // Mock data for partner company view
    const mockWorkers = [
      { name: '김철수', id: 'worker1' },
      { name: '이영희', id: 'worker2' },
      { name: '박민수', id: 'worker3' },
      { name: '정수진', id: 'worker4' },
      { name: '최동훈', id: 'worker5' },
    ]

    const details = mockWorkers.map(worker => ({
      worker_id: worker.id,
      worker_name: worker.name,
      site_id: params.site_id || 'site1',
      site_name: '강남 A현장',
      month: params.month || '2025-01',
      base_salary: 2800000 + Math.floor(Math.random() * 500000),
      allowances: 150000,
      deductions: 337000,
      net_salary: 2800000 + Math.floor(Math.random() * 1000000),
      total_days: 20 + Math.floor(Math.random() * 5),
      total_hours: 160 + Math.floor(Math.random() * 40),
      status: Math.random() > 0.7 ? 'pending' : 'paid',
    }))

    const totalAmount = details.reduce((sum: unknown, d: unknown) => sum + d.net_salary, 0)
    const pendingAmount = details
      .filter(d => d.status === 'pending')
      .reduce((sum: unknown, d: unknown) => sum + d.net_salary, 0)
    const paidAmount = details
      .filter(d => d.status === 'paid')
      .reduce((sum: unknown, d: unknown) => sum + d.net_salary, 0)

    return {
      success: true,
      data: {
        details,
        totalWorkers: mockWorkers.length,
        totalAmount,
        pendingAmount,
        paidAmount,
      },
    }
  } catch (error) {
    console.error('Error in getCompanySalarySummary:', error)
    return { success: false, error: 'Failed to fetch company salary summary' }
  }
}

export async function getPayslips(params: { worker_id: string; limit?: number }) {
  try {
    const supabase = createClient()

    // Mock payslip data
    const months = ['2024-08', '2024-09', '2024-10', '2024-11', '2024-12', '2025-01']

    const mockPayslips = months.slice(0, params.limit || 6).map(month => ({
      id: `payslip-${month}`,
      worker_id: params.worker_id,
      month,
      site_id: 'site1',
      site_name: '강남 A현장',
      gross_amount: 3370000,
      deductions: 337000,
      net_amount: 3033000,
      status: month === '2025-01' ? 'pending' : 'paid',
      issued_date: `${month}-25`,
      payment_date: month !== '2025-01' ? `${month}-25` : null,
    }))

    return { success: true, data: mockPayslips }
  } catch (error) {
    console.error('Error in getPayslips:', error)
    return { success: false, error: 'Failed to fetch payslips' }
  }
}

export async function downloadPayslip(payslipId: string) {
  try {
    // In a real implementation, this would generate or fetch a PDF
    // For now, return a mock URL
    return {
      success: true,
      data: {
        url: `/api/payslips/${payslipId}/download`,
        filename: `payslip-${payslipId}.pdf`,
      },
    }
  } catch (error) {
    console.error('Error in downloadPayslip:', error)
    return { success: false, error: 'Failed to download payslip' }
  }
}
