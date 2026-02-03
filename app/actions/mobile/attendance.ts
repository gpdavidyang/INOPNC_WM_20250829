'use server'
import { AppError } from '@/lib/error-handling'

// ==========================================
// ATTENDANCE ACTIONS (DEPRECATED / REMOVED)
// ==========================================
// This file previously handled mobile check-in/out and work_records.
// We have migrated to a Single Source of Truth strategy using 'Approved Daily Reports'.
// Direct manipulation of work_records is deprecated.

// These interfaces are kept to avoid breaking imports in unused components until full cleanup.
export async function getAttendanceRecords(params: any) {
  return { success: true, data: [] }
}

export async function getCompanyAttendanceSummary(params: any) {
  return { success: true, data: { records: [], totalDays: 0, totalWorkers: 0, totalHours: 0 } }
}

export async function checkIn(data: any) {
  throw new AppError('This feature is deprecated.', 'DEPRECATED')
}

export async function checkOut(data: any) {
  throw new AppError('This feature is deprecated.', 'DEPRECATED')
}

export async function getTodayAttendance(site_id?: string) {
  return { success: true, data: [] }
}

export async function getMyAttendance(filters: any) {
  return { success: true, data: [], summary: { total_days: 0 } }
}

export async function updateAttendanceRecord(id: string, data: any) {
  throw new AppError('This feature is deprecated.', 'DEPRECATED')
}

export async function addBulkAttendance(site_id: string, work_date: string, workers: any[]) {
  throw new AppError('This feature is deprecated.', 'DEPRECATED')
}

export async function getMonthlyAttendance(year: number, month: number) {
  return { success: true, data: [] }
}

export async function getAttendanceSummary(filters: any) {
  return { success: true, data: [] }
}
