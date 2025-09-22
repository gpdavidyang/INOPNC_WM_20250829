/**
 * Korean Labor Hours Calculation System (공수 시스템)
 * 
 * This module handles the Korean construction industry's labor hours system where:
 * - 1.0 공수 = 8 hours of work
 * - 0.5 공수 = 4 hours of work
 * - Labor hours >1.0 indicate overtime
 */

import type { AttendanceRecord } from '@/types'

// Korean national holidays for 2025
const KOREAN_HOLIDAYS_2025 = [
  '2025-01-01', // New Year
  '2025-02-09', // Lunar New Year
  '2025-02-10', // Lunar New Year
  '2025-02-11', // Lunar New Year
  '2025-03-01', // Independence Movement Day
  '2025-05-05', // Children's Day
  '2025-05-13', // Buddha's Birthday
  '2025-06-06', // Memorial Day
  '2025-08-15', // Liberation Day
  '2025-09-16', // Chuseok
  '2025-09-17', // Chuseok
  '2025-09-18', // Chuseok
  '2025-10-03', // National Foundation Day
  '2025-10-09', // Hangeul Day
  '2025-12-25'  // Christmas
]

export interface LaborHoursCalculation {
  laborHours: number
  actualHours: number
  overtimeHours: number
  type: 'regular' | 'partial' | 'overtime' | 'absent'
}

export interface MonthlyTotals {
  month: string
  totalLaborHours: number
  totalActualHours: number
  totalOvertimeHours: number
  workDays: number
  absentDays: number
  holidayDays: number
  averageLaborHours: number
  records: AttendanceRecord[]
}

export interface PayrollTotals {
  regularHours: number
  overtimeHours: number
  regularPay: number
  overtimePay: number
  totalPay: number
  totalHours: number
  totalLaborHours: number
  workDays: number
  absentDays: number
}

export interface PayrollData {
  userId: string
  month: string
  hourlyRate: number
  overtimeRate: number
  attendanceRecords: AttendanceRecord[]
}

/**
 * Convert labor hours (공수) to actual hours and calculate overtime
 */
export function calculateLaborHours(laborHours: number): LaborHoursCalculation {
  // Handle invalid or negative values
  if (isNaN(laborHours) || laborHours < 0) {
    return {
      laborHours: 0.0,
      actualHours: 0,
      overtimeHours: 0,
      type: 'absent'
    }
  }

  const actualHours = laborHours * 8
  const regularHours = Math.min(actualHours, 8)
  const overtimeHours = Math.max(0, actualHours - 8)

  let type: LaborHoursCalculation['type']
  if (laborHours === 0) {
    type = 'absent'
  } else if (laborHours < 1.0) {
    type = 'partial'
  } else if (laborHours > 1.0) {
    type = 'overtime'
  } else {
    type = 'regular'
  }

  return {
    laborHours,
    actualHours,
    overtimeHours,
    type
  }
}

/**
 * Calculate overtime hours from actual hours worked
 */
export function calculateOvertimeHours(actualHours: number): number {
  return Math.max(0, actualHours - 8)
}

/**
 * Format labor hours with Korean unit and appropriate rounding
 */
export function formatLaborHours(laborHours: number): string {
  // Round to nearest 0.1 for display
  const rounded = Math.round(laborHours * 10) / 10
  return `${rounded.toFixed(1)}공수`
}

/**
 * Calculate monthly totals for labor hours and attendance
 */
export function calculateMonthlyTotals(
  records: AttendanceRecord[] | null | undefined,
  month: string
): MonthlyTotals {
  if (!records || !Array.isArray(records)) {
    return {
      month,
      totalLaborHours: 0,
      totalActualHours: 0,
      totalOvertimeHours: 0,
      workDays: 0,
      absentDays: 0,
      holidayDays: 0,
      averageLaborHours: 0,
      records: []
    }
  }

  // Filter records for the specified month
  const monthlyRecords = records.filter(record => {
    try {
      const recordDate = new Date(record.date)
      const recordMonth = recordDate.toISOString().substring(0, 7) // YYYY-MM
      return recordMonth === month
    } catch {
      return false // Skip invalid dates
    }
  })

  let totalLaborHours = 0
  let totalActualHours = 0
  let totalOvertimeHours = 0
  let workDays = 0
  let absentDays = 0
  let holidayDays = 0

  monthlyRecords.forEach(record => {
    const calculation = calculateLaborHours(record.labor_hours)
    
    totalLaborHours += calculation.laborHours
    totalActualHours += calculation.actualHours
    totalOvertimeHours += calculation.overtimeHours

    if (calculation.laborHours > 0) {
      workDays++
    } else {
      absentDays++
    }

    // Check if this is a holiday
    if (isHoliday(record.date) || record.work_type === 'holiday') {
      holidayDays++
    }
  })

  const averageLaborHours = workDays > 0 ? Math.round((totalLaborHours / workDays) * 100) / 100 : 0

  return {
    month,
    totalLaborHours,
    totalActualHours,
    totalOvertimeHours,
    workDays,
    absentDays,
    holidayDays,
    averageLaborHours,
    records: monthlyRecords
  }
}

/**
 * Get labor hours by date range
 */
export function getLaborHoursByDateRange(
  records: AttendanceRecord[],
  startDate: string,
  endDate: string
): AttendanceRecord[] {
  const start = new Date(startDate)
  const end = new Date(endDate)

  if (start > end) {
    return []
  }

  return records.filter(record => {
    try {
      const recordDate = new Date(record.date)
      return recordDate >= start && recordDate <= end
    } catch {
      return false
    }
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

/**
 * Get color coding for attendance based on labor hours
 */
export function getAttendanceColor(laborHours: number): 'green' | 'yellow' | 'orange' | 'gray' {
  if (laborHours >= 1.0) {
    return 'green'  // Full day or overtime
  } else if (laborHours >= 0.5) {
    return 'yellow' // Half to almost full day
  } else if (laborHours > 0) {
    return 'orange' // Less than half day
  } else {
    return 'gray'   // No work/holiday
  }
}

/**
 * Check if a date is a Korean national holiday
 */
export function isHoliday(dateString: string): boolean {
  try {
    // Normalize date string to YYYY-MM-DD format
    const date = new Date(dateString)
    const normalizedDate = date.toISOString().substring(0, 10)
    
    return KOREAN_HOLIDAYS_2025.includes(normalizedDate)
  } catch {
    return false
  }
}

/**
 * Calculate payroll totals including overtime rates
 */
export function calculatePayrollTotals(payrollData: PayrollData): PayrollTotals {
  const { hourlyRate, overtimeRate, attendanceRecords } = payrollData
  
  if (!attendanceRecords || attendanceRecords.length === 0) {
    return {
      regularHours: 0,
      overtimeHours: 0,
      regularPay: 0,
      overtimePay: 0,
      totalPay: 0,
      totalHours: 0,
      totalLaborHours: 0,
      workDays: 0,
      absentDays: 0
    }
  }

  let regularHours = 0
  let overtimeHours = 0
  let totalLaborHours = 0
  let workDays = 0
  let absentDays = 0

  attendanceRecords.forEach(record => {
    const calculation = calculateLaborHours(record.labor_hours)
    
    // Calculate regular and overtime hours
    const recordRegularHours = Math.min(calculation.actualHours, 8)
    const recordOvertimeHours = calculation.overtimeHours
    
    regularHours += recordRegularHours
    overtimeHours += recordOvertimeHours
    totalLaborHours += calculation.laborHours

    if (calculation.laborHours > 0) {
      workDays++
    } else {
      absentDays++
    }
  })

  const regularPay = regularHours * hourlyRate
  const overtimePay = overtimeHours * overtimeRate
  const totalPay = regularPay + overtimePay
  const totalHours = regularHours + overtimeHours

  return {
    regularHours,
    overtimeHours,
    regularPay,
    overtimePay,
    totalPay,
    totalHours,
    totalLaborHours,
    workDays,
    absentDays
  }
}