'use server'

import { revalidatePath } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { requireServerActionAuth, assertOrgAccess, type SimpleAuth } from '@/lib/auth/ultra-simple'
import { AppError, ErrorType, logError } from '@/lib/error-handling'
import type { AttendanceStatus } from '@/types'
import type { AttendanceRecord } from '@/types/attendance'
import type { Database } from '@/types/database'

// ==========================================
// ATTENDANCE ACTIONS
// ==========================================

type SupabaseServerClient = SupabaseClient<Database>

async function getSiteOrganization(
  supabase: SupabaseServerClient,
  siteId: string
): Promise<string | undefined> {
  const { data, error } = await supabase
    .from('sites')
    .select('organization_id')
    .eq('id', siteId)
    .single()

  if (error || !data) {
    throw new AppError('현장 정보를 찾을 수 없습니다.', ErrorType.NOT_FOUND, 404)
  }

  return data.organization_id ?? undefined
}

async function ensureSiteAccess(supabase: SupabaseServerClient, auth: SimpleAuth, siteId?: string) {
  if (!siteId || !auth.isRestricted) {
    return
  }

  const organizationId = await getSiteOrganization(supabase, siteId)
  await assertOrgAccess(auth, organizationId)
}

async function fetchWorkRecordWithAccess(
  supabase: SupabaseServerClient,
  auth: SimpleAuth,
  recordId: string
) {
  const { data, error } = await supabase
    .from('work_records')
    .select(
      `
        *,
        site:sites(organization_id)
      `
    )
    .eq('id', recordId)
    .single()

  if (error || !data) {
    throw new AppError('근태 기록을 찾을 수 없습니다.', ErrorType.NOT_FOUND, 404)
  }

  if (auth.isRestricted) {
    await assertOrgAccess(auth, data.site?.organization_id ?? undefined)
  }

  return data
}

export async function getAttendanceRecords(params: {
  user_id?: string
  site_id?: string
  date_from: string
  date_to: string
}) {
  try {
    const supabase = createClient()
    const auth = await requireServerActionAuth(supabase)

    const effectiveParams = { ...params }

    if (auth.isRestricted) {
      if (params.user_id && params.user_id !== auth.userId) {
        throw new AppError('본인 근태 기록만 조회할 수 있습니다.', ErrorType.AUTHORIZATION, 403)
      }

      effectiveParams.user_id = auth.userId

      if (!params.site_id) {
        throw new AppError('현장 정보가 필요합니다.', ErrorType.VALIDATION, 400)
      }

      await ensureSiteAccess(supabase, auth, params.site_id)
    } else if (params.site_id) {
      await ensureSiteAccess(supabase, auth, params.site_id)
    }

    // Step 2: Build query with proper field selection
    // IMPORTANT: Changed from attendance_records to work_records for data consistency
    // This ensures both attendance calendar and salary view use the same data source
    let query = supabase
      .from('work_records')
      .select(
        `
        id,
        user_id,
        profile_id,
        site_id,
        work_date,
        check_in_time,
        check_out_time,
        work_hours,
        overtime_hours,
        labor_hours,
        status,
        notes,
        created_at,
        updated_at,
        sites(id, name)
      `
      )
      .gte('work_date', params.date_from)
      .lte('work_date', params.date_to)
      .order('work_date', { ascending: true })

    // Use OR condition to match both user_id and profile_id
    // This matches the logic used in salary-calculation.service.ts
    if (effectiveParams.user_id) {
      query = query.or(
        `user_id.eq.${effectiveParams.user_id},profile_id.eq.${effectiveParams.user_id}`
      )
    }
    if (effectiveParams.site_id) {
      query = query.eq('site_id', effectiveParams.site_id)
    }

    const { data, error } = await query

    // Step 3: Enhanced logging

    if (error) {
      throw new AppError(`Database error: ${error.message}`, ErrorType.SERVER_ERROR)
    }

    // Step 4: Transform data to match expected interface
    // Client expects `date` field but DB has `work_date`
    const transformedData =
      data?.map((record: unknown) => ({
        ...record,
        date: record.work_date, // Add date field for compatibility
        site_name: record.sites?.name || 'Unknown Site',
        // Ensure user_id is set for compatibility
        user_id: record.user_id || record.profile_id,
      })) || []

    return { success: true, data: transformedData }
  } catch (error) {
    logError(error, 'getAttendanceRecords')
    return {
      success: false,
      error:
        error instanceof AppError
          ? error.message
          : `Failed to fetch attendance records: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

export async function getCompanyAttendanceSummary(params: {
  organization_id: string
  site_id?: string
  date_from: string
  date_to: string
}) {
  try {
    const supabase = createClient()
    const auth = await requireServerActionAuth(supabase)

    if (auth.isRestricted) {
      await assertOrgAccess(auth, params.organization_id)
      await ensureSiteAccess(supabase, auth, params.site_id)
    }

    // For now, return mock data
    // In a real implementation, this would aggregate attendance data
    const dates = []
    const current = new Date(params.date_from)
    const end = new Date(params.date_to)

    while (current <= end) {
      const dayOfWeek = current.getDay()
      // Skip weekends for mock data
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        dates.push({
          date: current.toISOString().split('T')[0],
          site_id: params.site_id,
          totalWorkers: Math.floor(Math.random() * 10) + 5,
          totalHours: (Math.floor(Math.random() * 10) + 5) * 8,
        })
      }
      current.setDate(current.getDate() + 1)
    }

    const totalDays = dates.length
    const totalWorkers = Math.max(...dates.map((d: unknown) => d.totalWorkers))
    const totalHours = dates.reduce((sum: unknown, d: unknown) => sum + d.totalHours, 0)

    return {
      success: true,
      data: {
        records: dates,
        totalDays,
        totalWorkers,
        totalHours,
      },
    }
  } catch (error) {
    logError(error, 'getCompanyAttendanceSummary')
    return {
      success: false,
      error:
        error instanceof AppError ? error.message : 'Failed to fetch company attendance summary',
    }
  }
}

export async function checkIn(data: {
  site_id: string
  latitude?: number
  longitude?: number
  accuracy?: number
  address?: string
  device_info?: string
}) {
  try {
    const supabase = createClient()
    const auth = await requireServerActionAuth(supabase)
    await ensureSiteAccess(supabase, auth, data.site_id)

    // Get today's date
    const today = new Date().toISOString().split('T')[0]
    const checkInTime = new Date().toTimeString().split(' ')[0]

    // Get or create today's daily report for the site
    let { data: dailyReport } = await supabase
      .from('daily_reports')
      .select('id')
      .eq('site_id', data.site_id)
      .eq('work_date', today)
      .single()

    if (!dailyReport) {
      // Create daily report if it doesn't exist
      const { data: newReport, error: reportError } = await supabase
        .from('daily_reports')
        .insert({
          site_id: data.site_id,
          work_date: today,
          member_name: auth.email || 'Unknown',
          process_type: 'general',
          status: 'draft',
          created_by: auth.userId,
        })
        .select()
        .single()

      if (reportError) {
        throw new AppError('일일보고서 생성에 실패했습니다.', ErrorType.SERVER_ERROR)
      }
      dailyReport = newReport
    }

    // Check if already checked in today
    const { data: existingAttendance } = await supabase
      .from('work_records')
      .select('id')
      .eq('site_id', data.site_id)
      .or(`user_id.eq.${auth.userId},profile_id.eq.${auth.userId}`)
      .eq('work_date', today)
      .single()

    if (existingAttendance) {
      return { success: false, error: 'Already checked in today' }
    }

    // Create work record
    const { data: attendance, error: attendanceError } = await supabase
      .from('work_records')
      .insert({
        site_id: data.site_id,
        user_id: auth.userId,
        profile_id: auth.userId, // Set both for compatibility
        work_date: today,
        check_in_time: checkInTime,
        status: 'present' as AttendanceStatus,
      })
      .select()
      .single()

    if (attendanceError) {
      throw new AppError(attendanceError.message, ErrorType.SERVER_ERROR)
    }

    // TODO: Create location record if GPS data provided
    // The attendance_locations table needs to be created first
    // if (data.latitude && data.longitude) {
    //   const { error: locationError } = await supabase
    //     .from('attendance_locations')
    //     .insert({
    //       attendance_record_id: attendance.id,
    //       check_type: 'in',
    //       latitude: data.latitude,
    //       longitude: data.longitude,
    //       accuracy: data.accuracy,
    //       address: data.address,
    //       device_info: data.device_info,
    //       ip_address: null // Would need to get from request headers
    //     })

    //   if (locationError) {
    //     console.error('Error creating location record:', locationError)
    //     // Don't fail the whole operation if location fails
    //   }
    // }

    revalidatePath('/dashboard/attendance')
    return { success: true, data: attendance }
  } catch (error) {
    logError(error, 'checkIn')
    return {
      success: false,
      error: error instanceof AppError ? error.message : 'Failed to check in',
    }
  }
}

export async function checkOut(data: {
  attendance_id: string
  latitude?: number
  longitude?: number
  accuracy?: number
  address?: string
  device_info?: string
}) {
  try {
    const supabase = createClient()
    const auth = await requireServerActionAuth(supabase)

    const checkOutTime = new Date().toTimeString().split(' ')[0]

    const attendance = await fetchWorkRecordWithAccess(supabase, auth, data.attendance_id)

    if (
      auth.isRestricted &&
      attendance.user_id !== auth.userId &&
      attendance.profile_id !== auth.userId
    ) {
      throw new AppError('본인 근태 기록만 수정할 수 있습니다.', ErrorType.AUTHORIZATION, 403)
    }

    if (attendance.check_out_time) {
      return { success: false, error: 'Already checked out' }
    }

    // Calculate work hours
    const checkIn = new Date(`2000-01-01T${attendance.check_in_time}`)
    const checkOut = new Date(`2000-01-01T${checkOutTime}`)
    const hoursWorked = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)

    // Calculate overtime (assuming 8 hours is regular)
    const regularHours = Math.min(hoursWorked, 8)
    const overtimeHours = Math.max(0, hoursWorked - 8)

    // Update work record
    const { data: updatedAttendance, error: updateError } = await supabase
      .from('work_records')
      .update({
        check_out_time: checkOutTime,
        work_hours: hoursWorked,
        overtime_hours: overtimeHours,
        updated_by: auth.userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.attendance_id)
      .select()
      .single()

    if (updateError) {
      throw new AppError(updateError.message, ErrorType.SERVER_ERROR)
    }

    // TODO: Create location record if GPS data provided
    // The attendance_locations table needs to be created first
    // if (data.latitude && data.longitude) {
    //   const { error: locationError } = await supabase
    //     .from('attendance_locations')
    //     .insert({
    //       attendance_record_id: data.attendance_id,
    //       check_type: 'out',
    //       latitude: data.latitude,
    //       longitude: data.longitude,
    //       accuracy: data.accuracy,
    //       address: data.address,
    //       device_info: data.device_info,
    //       ip_address: null
    //     })

    //   if (locationError) {
    //     console.error('Error creating location record:', locationError)
    //   }
    // }

    revalidatePath('/dashboard/attendance')
    return { success: true, data: updatedAttendance }
  } catch (error) {
    logError(error, 'checkOut')
    return {
      success: false,
      error: error instanceof AppError ? error.message : 'Failed to check out',
    }
  }
}

export async function getTodayAttendance(site_id?: string) {
  try {
    const supabase = createClient()
    const auth = await requireServerActionAuth(supabase)

    if (auth.isRestricted) {
      if (!site_id) {
        throw new AppError('현장 정보가 필요합니다.', ErrorType.VALIDATION, 400)
      }
      await ensureSiteAccess(supabase, auth, site_id)
    } else if (site_id) {
      await ensureSiteAccess(supabase, auth, site_id)
    }

    const today = new Date().toISOString().split('T')[0]

    let query = supabase
      .from('work_records')
      .select(
        `
        *,
        worker:profiles(*),
        site:sites(*)
      `
      )
      .eq('work_date', today)

    if (site_id) {
      query = query.eq('site_id', site_id)
    } else if (auth.isRestricted && auth.restrictedOrgId) {
      query = query.eq('site.organization_id', auth.restrictedOrgId)
    }

    const { data, error } = await query.order('check_in_time', { ascending: true })

    if (error) {
      throw new AppError(error.message, ErrorType.SERVER_ERROR)
    }

    return { success: true, data }
  } catch (error) {
    logError(error, 'getTodayAttendance')
    return {
      success: false,
      error: error instanceof AppError ? error.message : 'Failed to fetch attendance',
    }
  }
}

export async function getMyAttendance(filters: {
  start_date?: string
  end_date?: string
  site_id?: string
}) {
  try {
    const supabase = createClient()
    const auth = await requireServerActionAuth(supabase)

    if (filters.site_id) {
      await ensureSiteAccess(supabase, auth, filters.site_id)
    }

    let query = supabase
      .from('work_records')
      .select(
        `
        *,
        site:sites(
          id,
          report_date,
          site_id,
          site:sites(*)
        )
      `
      )
      .or(`user_id.eq.${auth.userId},profile_id.eq.${auth.userId}`)
      .order('work_date', { ascending: false })

    if (filters.start_date) {
      query = query.gte('work_date', filters.start_date)
    }
    if (filters.end_date) {
      query = query.lte('work_date', filters.end_date)
    }
    if (filters.site_id) {
      query = query.eq('daily_report.site_id', filters.site_id)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching my attendance:', error)
      return { success: false, error: error.message }
    }

    // Calculate summary
    const summary = {
      total_days: data?.length || 0,
      total_hours:
        data?.reduce((sum: unknown, record: unknown) => sum + (record.work_hours || 0), 0) || 0,
      total_overtime:
        data?.reduce((sum: unknown, record: unknown) => sum + (record.overtime_hours || 0), 0) || 0,
      days_present: data?.filter((r: unknown) => r.status === 'present').length || 0,
      days_absent: data?.filter((r: unknown) => r.status === 'absent').length || 0,
      days_holiday: data?.filter((r: unknown) => r.status === 'holiday').length || 0,
    }

    return { success: true, data, summary }
  } catch (error) {
    logError(error, 'getMyAttendance')
    return {
      success: false,
      error: error instanceof AppError ? error.message : 'Failed to fetch attendance history',
    }
  }
}

export async function updateAttendanceRecord(id: string, data: Partial<AttendanceRecord>) {
  try {
    const supabase = createClient()
    const auth = await requireServerActionAuth(supabase)

    if (!auth.role || !['admin', 'system_admin', 'site_manager'].includes(auth.role)) {
      throw new AppError('근태 기록을 수정할 권한이 없습니다.', ErrorType.AUTHORIZATION, 403)
    }

    await fetchWorkRecordWithAccess(supabase, auth, id)

    const { data: attendance, error } = await supabase
      .from('work_records')
      .update({
        ...data,
        updated_by: auth.userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new AppError(error.message, ErrorType.SERVER_ERROR)
    }

    revalidatePath('/dashboard/attendance')
    return { success: true, data: attendance }
  } catch (error) {
    logError(error, 'updateAttendanceRecord')
    return {
      success: false,
      error: error instanceof AppError ? error.message : 'Failed to update attendance',
    }
  }
}

export async function addBulkAttendance(
  site_id: string,
  work_date: string,
  workers: Array<{
    user_id: string
    check_in_time: string
    check_out_time?: string
    notes?: string
  }>
) {
  try {
    const supabase = createClient()
    const auth = await requireServerActionAuth(supabase)

    if (!auth.role || !['admin', 'system_admin', 'site_manager'].includes(auth.role)) {
      throw new AppError('근태 기록을 추가할 권한이 없습니다.', ErrorType.AUTHORIZATION, 403)
    }

    await ensureSiteAccess(supabase, auth, site_id)

    // Prepare work records
    const workRecords = workers.map((worker: unknown) => {
      const checkIn = new Date(`2000-01-01T${worker.check_in_time}`)
      const checkOut = worker.check_out_time
        ? new Date(`2000-01-01T${worker.check_out_time}`)
        : null
      const hoursWorked = checkOut ? (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60) : 0

      return {
        site_id,
        user_id: worker.user_id,
        profile_id: worker.user_id, // Set both for compatibility
        work_date,
        check_in_time: worker.check_in_time,
        check_out_time: worker.check_out_time,
        work_hours: hoursWorked,
        overtime_hours: Math.max(0, hoursWorked - 8),
        notes: worker.notes,
        status: 'present' as AttendanceStatus,
        labor_hours: 1.0, // Default to 1.0 for bulk attendance
      }
    })

    const { data, error } = await supabase.from('work_records').insert(workRecords).select()

    if (error) {
      throw new AppError(error.message, ErrorType.SERVER_ERROR)
    }

    revalidatePath('/dashboard/attendance')
    return { success: true, data }
  } catch (error) {
    logError(error, 'addBulkAttendance')
    return {
      success: false,
      error: error instanceof AppError ? error.message : 'Failed to add bulk attendance',
    }
  }
}

export async function getMonthlyAttendance(year: number, month: number) {
  try {
    const supabase = createClient()
    const auth = await requireServerActionAuth(supabase)

    // Calculate start and end dates for the month
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]

    let query = supabase
      .from('work_records')
      .select(
        `
        *,
        site:sites(
          id,
          site_id,
          organization_id,
          report_date
        )
      `
      )
      .or(`user_id.eq.${auth.userId},profile_id.eq.${auth.userId}`)
      .gte('work_date', startDate)
      .lte('work_date', endDate)
      .order('work_date', { ascending: true })

    if (auth.isRestricted && auth.restrictedOrgId) {
      query = query.eq('site.organization_id', auth.restrictedOrgId)
    }

    const { data, error } = await query

    if (error) {
      throw new AppError(error.message, ErrorType.SERVER_ERROR)
    }

    // Transform data to include date field for calendar
    const transformedData =
      data?.map((record: unknown) => ({
        ...record,
        date: record.work_date,
      })) || []

    return { success: true, data: transformedData }
  } catch (error) {
    logError(error, 'getMonthlyAttendance')
    return {
      success: false,
      error: error instanceof AppError ? error.message : 'Failed to fetch monthly attendance',
    }
  }
}

export async function getAttendanceSummary(filters: {
  site_id?: string
  start_date: string
  end_date: string
}) {
  try {
    const supabase = createClient()
    const auth = await requireServerActionAuth(supabase)

    if (filters.site_id) {
      await ensureSiteAccess(supabase, auth, filters.site_id)
    }

    let query = supabase
      .from('work_records')
      .select(
        `
        id,
        user_id,
        profile_id,
        work_hours,
        overtime_hours,
        status,
        worker:profiles(
          id,
          full_name,
          email
        ),
        site:sites(
          id,
          site_id,
          organization_id,
          report_date
        )
      `
      )
      .gte('work_date', filters.start_date)
      .lte('work_date', filters.end_date)

    if (filters.site_id) {
      query = query.eq('daily_report.site_id', filters.site_id)
    } else if (auth.isRestricted && auth.restrictedOrgId) {
      query = query.eq('site.organization_id', auth.restrictedOrgId)
    }

    const { data, error } = await query

    if (error) {
      throw new AppError(error.message, ErrorType.SERVER_ERROR)
    }

    // Group by worker
    const workerSummary = data?.reduce(
      (acc: unknown, record: unknown) => {
        const workerId = record.user_id || record.profile_id
        if (!workerId) return acc // Skip if no worker ID

        if (!acc[workerId]) {
          acc[workerId] = {
            worker: record.worker,
            total_days: 0,
            total_hours: 0,
            total_overtime: 0,
            days_present: 0,
            days_absent: 0,
          }
        }

        acc[workerId].total_days++
        acc[workerId].total_hours += record.work_hours || 0
        acc[workerId].total_overtime += record.overtime_hours || 0

        if (record.status === 'present') {
          acc[workerId].days_present++
        } else if (record.status === 'absent') {
          acc[workerId].days_absent++
        }

        return acc
      },
      {} as Record<string, any>
    )

    return {
      success: true,
      data: Object.values(workerSummary || {}),
    }
  } catch (error) {
    logError(error, 'getAttendanceSummary')
    return {
      success: false,
      error: error instanceof AppError ? error.message : 'Failed to fetch attendance summary',
    }
  }
}
