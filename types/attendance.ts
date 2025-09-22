// Attendance-specific type definitions


export interface AttendanceCalendarProps {
  profile: {
    id: string
    organization_id: string
    site_id?: string | null
    role: string
  }
  isPartnerView?: boolean
}

export interface AttendanceRecord {
  id: string
  date: string
  site_id: string
  site_name: string
  check_in_time?: string | null
  check_out_time?: string | null
  work_hours?: number | null
  overtime_hours?: number | null
  labor_hours?: number | null  // 공수 (1.0 = 8 hours)
  status: AttendanceStatus
  totalWorkers?: number // For partner view
}

export interface AttendanceSummary {
  totalDays: number
  totalHours: number
  totalWorkers: number
  averageHoursPerDay?: number
  records?: AttendanceRecord[]
}

export interface SiteAttendanceFilter {
  organization_id?: string
  site_id?: string
  date_from: string
  date_to: string
}

export interface WorkerAttendanceFilter {
  user_id: string
  site_id?: string
  date_from: string
  date_to: string
}

export interface AttendanceCheckData {
  id?: string
  user_id: string
  site_id: string
  work_date: string
  check_in_time?: string | null
  check_out_time?: string | null
  work_hours?: number | null
  overtime_hours?: number | null
  labor_hours?: number | null  // 공수 (1.0 = 8 hours)
  status: AttendanceStatus
  notes?: string | null
}

export interface SalaryData {
  month: string
  regularHours: number
  overtimeHours: number
  totalHours: number
  dailyRate: number
  overtimeRate: number
  estimatedSalary: number
  workDays: number
}

export interface SalaryCalculationParams {
  regularHours: number
  overtimeHours: number
  dailyRate: number
  overtimeRate?: number
}