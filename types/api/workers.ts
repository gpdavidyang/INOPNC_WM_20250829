/**
 * 작업자 관련 API 타입 정의
 */

// 작업자 정보
export interface Worker {
  id: string
  user_id: string
  full_name: string
  email: string
  phone?: string | null
  role: 'worker' | 'site_manager'
  daily_wage: number
  hourly_rate?: number | null
  site_id?: string | null
  site_name?: string | null
  organization_id?: string | null
  is_active: boolean
  joined_at: string
  last_work_date?: string | null
}

// 출근 기록
export interface AttendanceRecord {
  id: string
  user_id: string
  work_date: string
  check_in_time?: string | null
  check_out_time?: string | null
  labor_hours: number
  overtime_hours: number
  site_id: string
  site_name?: string
  daily_report_id?: string | null
  status: 'present' | 'absent' | 'late' | 'early_leave' | 'holiday'
  notes?: string | null
  created_at: string
  updated_at: string
}

// 작업자 배정
export interface WorkerAssignment {
  id: string
  worker_id: string
  worker_name: string
  site_id: string
  site_name: string
  daily_report_id: string
  work_date: string
  labor_hours: number
  work_type?: string | null
  is_confirmed: boolean
  assigned_by: string
  assigned_at: string
}

// 급여 정보
export interface SalaryInfo {
  id: string
  user_id: string
  base_salary?: number | null
  daily_wage: number
  hourly_rate: number
  tax_rate: number
  insurance_rate: number
  start_date: string
  end_date?: string | null
  is_active: boolean
}

// 급여 계산 결과
export interface SalaryCalculation {
  user_id: string
  user_name: string
  period_start: string
  period_end: string
  total_days: number
  total_hours: number
  regular_hours: number
  overtime_hours: number
  base_pay: number
  total_gross: number
  tax_deduction: number
  insurance_deduction: number
  other_deductions: number
  total_deductions: number
  net_pay: number
}

// 작업자 통계
export interface WorkerStatistics {
  user_id: string
  total_work_days: number
  total_work_hours: number
  average_daily_hours: number
  total_overtime_hours: number
  attendance_rate: number
  current_month_days: number
  current_month_hours: number
  last_month_days: number
  last_month_hours: number
}

// 작업자 목록 요청
export interface WorkerListRequest {
  site_id?: string
  role?: 'worker' | 'site_manager'
  is_active?: boolean
  search?: string
  date_from?: string
  date_to?: string
  page?: number
  limit?: number
  sort_by?: 'name' | 'joined_at' | 'last_work_date'
  sort_order?: 'asc' | 'desc'
}

// 출근 기록 요청
export interface AttendanceListRequest {
  user_id?: string
  site_id?: string
  date_from?: string
  date_to?: string
  status?: AttendanceRecord['status']
  page?: number
  limit?: number
}

// 작업자 배정 요청
export interface AssignWorkerRequest {
  worker_ids: string[]
  site_id: string
  daily_report_id: string
  work_date: string
  labor_hours?: number
  work_type?: string
}
