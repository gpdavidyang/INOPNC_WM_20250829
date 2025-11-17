/**
 * workers 관련 테이블 타입 정의
 */

import { UUID, Timestamps, AttendanceStatus, Json } from '../index'

// worker_assignments 테이블
export interface WorkerAssignmentsTable extends Timestamps {
  id: UUID
  profile_id: UUID
  daily_report_id: UUID
  labor_hours: number
  overtime_hours?: number | null
  work_type?: string | null
  notes?: string | null
  is_confirmed: boolean
  assigned_by: UUID
}

// attendance_records 테이블
export interface AttendanceRecordsTable extends Timestamps {
  id: UUID
  user_id: UUID
  work_date: string
  check_in_time?: string | null
  check_out_time?: string | null
  labor_hours: number
  overtime_hours?: number | null
  site_id: UUID
  daily_report_id?: UUID | null
  status: AttendanceStatus
  notes?: string | null
  location_lat?: number | null
  location_lng?: number | null
  metadata?: Json | null
}

// salary_info 테이블
export interface SalaryInfoTable extends Timestamps {
  id: UUID
  user_id: UUID
  base_salary?: number | null
  daily_wage: number
  hourly_rate: number
  tax_rate: number
  insurance_rate: number
  start_date: string
  end_date?: string | null
  is_active: boolean
  metadata?: Json | null
}

// salary_payments 테이블
export interface SalaryPaymentsTable extends Timestamps {
  id: UUID
  user_id: UUID
  payment_date: string
  period_start: string
  period_end: string
  total_days: number
  total_hours: number
  regular_hours: number
  overtime_hours: number
  base_pay: number
  deductions: number
  net_pay: number
  payment_method?: string | null
  payment_reference?: string | null
  notes?: string | null
  metadata?: Json | null
}

// work_records 테이블
export interface WorkRecordsTable extends Timestamps {
  id: UUID
  user_id: UUID
  site_id: UUID
  work_date: string
  check_in_time?: string | null
  check_out_time?: string | null
  labor_hours: number
  overtime_hours?: number | null
  work_type?: string | null
  daily_report_id?: UUID | null
  is_confirmed: boolean
  confirmed_by?: UUID | null
  confirmed_at?: string | null
  notes?: string | null
  metadata?: Json | null
}
