'use server'

import { createClient } from '@/lib/supabase/server'

interface SalaryInfo {
  id: string
  user_id: string
  base_salary: number
  hourly_rate: number
  overtime_rate: number
  effective_date: string
  end_date?: string
  created_at: string
  updated_at: string
}

interface MonthlySalaryCalculation {
  base_salary: number
  hourly_rate: number
  overtime_rate: number
  total_work_hours: number
  total_overtime_hours: number
  total_labor_hours: number
  regular_pay: number
  overtime_pay: number
  bonus_pay: number
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
  } catch (error: any) {
    console.error('❌ Exception in getSalaryInfo:', error)
    return { success: false, error: error.message }
  }
}

export async function calculateMonthlySalary(params: { user_id: string; year: number; month: number }) {
  try {
    const supabase = createClient()

    // Get salary info for the month
    const salaryResult = await getSalaryInfo({ 
      user_id: params.user_id, 
      date: `${params.year}-${params.month.toString().padStart(2, '0')}-01` 
    })

    if (!salaryResult.success || !salaryResult.data) {
      return { success: false, error: 'Salary information not found' }
    }

    const salaryInfo = salaryResult.data

    // Get attendance records for the month
    const startDate = `${params.year}-${params.month.toString().padStart(2, '0')}-01`
    const endDate = new Date(params.year, params.month, 0).toISOString().split('T')[0] // Last day of month

    const { data: attendanceData, error: attendanceError } = await supabase
      .from('attendance_records')
      .select('work_hours, overtime_hours, labor_hours, work_date, status')
      .eq('user_id', params.user_id)
      .gte('work_date', startDate)
      .lte('work_date', endDate)

    if (attendanceError) {
      console.error('❌ Error fetching attendance:', attendanceError)
      return { success: false, error: attendanceError.message }
    }

    // Calculate totals
    const workDays = attendanceData?.filter(record => record.status === 'present' || (record.labor_hours && record.labor_hours > 0)).length || 0
    const totalWorkHours = attendanceData?.reduce((sum, record) => sum + (record.work_hours || 0), 0) || 0
    const totalOvertimeHours = attendanceData?.reduce((sum, record) => sum + (record.overtime_hours || 0), 0) || 0
    const totalLaborHours = attendanceData?.reduce((sum, record) => sum + (record.labor_hours || 0), 0) || 0

    // Calculate pay components
    const regularPay = totalWorkHours * salaryInfo.hourly_rate
    const overtimePay = totalOvertimeHours * salaryInfo.overtime_rate
    const bonusPay = 0 // TODO: Implement bonus calculation logic
    const totalGrossPay = regularPay + overtimePay + bonusPay

    // Calculate deductions (Korean standard rates)
    const taxRate = 0.08 // 8% income tax (simplified)
    const pensionRate = 0.045 // 4.5% national pension
    const healthInsuranceRate = 0.034 // 3.4% health insurance
    const employmentInsuranceRate = 0.009 // 0.9% employment insurance

    const taxDeduction = Math.floor(totalGrossPay * taxRate)
    const nationalPension = Math.floor(totalGrossPay * pensionRate)
    const healthInsurance = Math.floor(totalGrossPay * healthInsuranceRate)
    const employmentInsurance = Math.floor(totalGrossPay * employmentInsuranceRate)
    
    const totalDeductions = taxDeduction + nationalPension + healthInsurance + employmentInsurance
    const netPay = totalGrossPay - totalDeductions

    const calculation: MonthlySalaryCalculation = {
      base_salary: salaryInfo.base_salary,
      hourly_rate: salaryInfo.hourly_rate,
      overtime_rate: salaryInfo.overtime_rate,
      total_work_hours: totalWorkHours,
      total_overtime_hours: totalOvertimeHours,
      total_labor_hours: totalLaborHours,
      regular_pay: regularPay,
      overtime_pay: overtimePay,
      bonus_pay: bonusPay,
      total_gross_pay: totalGrossPay,
      tax_deduction: taxDeduction,
      national_pension: nationalPension,
      health_insurance: healthInsurance,
      employment_insurance: employmentInsurance,
      total_deductions: totalDeductions,
      net_pay: netPay,
      work_days: workDays
    }

    return { success: true, data: calculation }
  } catch (error: any) {
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
      { name: '최동훈', id: 'worker5' }
    ]
    
    const details = mockWorkers.map(worker => ({
      worker_id: worker.id,
      worker_name: worker.name,
      site_id: params.site_id || 'site1',
      site_name: '강남 A현장',
      month: params.month || '2025-01',
      base_salary: 2800000 + Math.floor(Math.random() * 500000),
      overtime_pay: Math.floor(Math.random() * 500000),
      allowances: 150000,
      deductions: 337000,
      net_salary: 2800000 + Math.floor(Math.random() * 1000000),
      total_days: 20 + Math.floor(Math.random() * 5),
      total_hours: 160 + Math.floor(Math.random() * 40),
      overtime_hours: Math.floor(Math.random() * 30),
      status: Math.random() > 0.7 ? 'pending' : 'paid'
    }))
    
    const totalAmount = details.reduce((sum: any, d: any) => sum + d.net_salary, 0)
    const pendingAmount = details
      .filter(d => d.status === 'pending')
      .reduce((sum: any, d: any) => sum + d.net_salary, 0)
    const paidAmount = details
      .filter(d => d.status === 'paid')
      .reduce((sum: any, d: any) => sum + d.net_salary, 0)

    return { 
      success: true, 
      data: {
        details,
        totalWorkers: mockWorkers.length,
        totalAmount,
        pendingAmount,
        paidAmount
      }
    }
  } catch (error) {
    console.error('Error in getCompanySalarySummary:', error)
    return { success: false, error: 'Failed to fetch company salary summary' }
  }
}

export async function getPayslips(params: {
  worker_id: string
  limit?: number
}) {
  try {
    const supabase = createClient()
    
    // Mock payslip data
    const months = [
      '2024-08', '2024-09', '2024-10', 
      '2024-11', '2024-12', '2025-01'
    ]
    
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
      payment_date: month !== '2025-01' ? `${month}-25` : null
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
        filename: `payslip-${payslipId}.pdf`
      }
    }
  } catch (error) {
    console.error('Error in downloadPayslip:', error)
    return { success: false, error: 'Failed to download payslip' }
  }
}