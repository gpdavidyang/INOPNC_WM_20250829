'use server'

import { createClient } from '@/lib/supabase/server'
import { AttendanceRecord, AttendanceStatus, AttendanceLocation } from '@/types'
import { revalidatePath } from 'next/cache'

// ==========================================
// ATTENDANCE ACTIONS
// ==========================================

export async function getAttendanceRecords(params: {
  user_id?: string
  site_id?: string
  date_from: string
  date_to: string
}) {
  console.log('🔍 getAttendanceRecords called with params:', JSON.stringify(params, null, 2))
  
  try {
    const supabase = createClient()
    
    // Step 1: Verify authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('❌ Authentication failed in getAttendanceRecords:', userError)
      return { success: false, error: 'User not authenticated' }
    }
    
    console.log('✅ User authenticated:', user.id)
    
    // Step 2: Build query with proper field selection
    // IMPORTANT: Changed from attendance_records to work_records for data consistency
    // This ensures both attendance calendar and salary view use the same data source
    let query = supabase
      .from('work_records')
      .select(`
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
      `)
      .gte('work_date', params.date_from)
      .lte('work_date', params.date_to)
      .order('work_date', { ascending: true })

    // Use OR condition to match both user_id and profile_id
    // This matches the logic used in salary-calculation.service.ts
    if (params.user_id) {
      query = query.or(`user_id.eq.${params.user_id},profile_id.eq.${params.user_id}`)
    }
    if (params.site_id) {
      query = query.eq('site_id', params.site_id)
    }

    console.log('📍 Executing work records query (unified data source)...')
    const { data, error } = await query

    // Step 3: Enhanced logging 
    console.log('📊 Database query result:', {
      success: !error,
      recordCount: data?.length || 0,
      error: error?.message,
      errorDetails: error?.details,
      errorHint: error?.hint,
      errorCode: error?.code,
      sampleRecord: data?.[0] ? {
        id: data[0].id,
        work_date: data[0].work_date,
        labor_hours: data[0].labor_hours,
        site_name: data[0].sites?.name
      } : null,
      params
    })

    if (error) {
      console.error('❌ Database error in getAttendanceRecords:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return { success: false, error: `Database error: ${error.message}` }
    }

    // Step 4: Transform data to match expected interface
    // Client expects `date` field but DB has `work_date`
    const transformedData = data?.map((record: any) => ({
      ...record,
      date: record.work_date, // Add date field for compatibility
      site_name: record.sites?.name || 'Unknown Site',
      // Ensure user_id is set for compatibility
      user_id: record.user_id || record.profile_id
    })) || []

    console.log('✅ Successfully fetched and transformed', transformedData.length, 'work records')
    console.log('🔧 Sample transformed record:', transformedData[0] ? {
      id: transformedData[0].id,
      date: transformedData[0].date,
      work_date: transformedData[0].work_date,
      labor_hours: transformedData[0].labor_hours,
      site_name: transformedData[0].site_name
    } : 'No records')

    return { success: true, data: transformedData }
  } catch (error) {
    console.error('💥 Unexpected error in getAttendanceRecords:', error)
    return { success: false, error: `Failed to fetch attendance records: ${error instanceof Error ? error.message : 'Unknown error'}` }
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
          totalHours: (Math.floor(Math.random() * 10) + 5) * 8
        })
      }
      current.setDate(current.getDate() + 1)
    }

    const totalDays = dates.length
    const totalWorkers = Math.max(...dates.map((d: any) => d.totalWorkers))
    const totalHours = dates.reduce((sum: any, d: any) => sum + d.totalHours, 0)

    return { 
      success: true, 
      data: {
        records: dates,
        totalDays,
        totalWorkers,
        totalHours
      }
    }
  } catch (error) {
    console.error('Error in getCompanyAttendanceSummary:', error)
    return { success: false, error: 'Failed to fetch company attendance summary' }
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
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

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
          member_name: user.email || 'Unknown',
          process_type: 'general',
          status: 'draft',
          created_by: user.id
        })
        .select()
        .single()

      if (reportError) {
        console.error('Error creating daily report:', reportError)
        return { success: false, error: 'Failed to create daily report' }
      }
      dailyReport = newReport
    }

    // Check if already checked in today
    const { data: existingAttendance } = await supabase
      .from('work_records')
      .select('id')
      .eq('site_id', data.site_id)
      .or(`user_id.eq.${user.id},profile_id.eq.${user.id}`)
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
        user_id: user.id,
        profile_id: user.id, // Set both for compatibility
        work_date: today,
        check_in_time: checkInTime,
        status: 'present' as AttendanceStatus
      })
      .select()
      .single()

    if (attendanceError) {
      console.error('Error creating work record:', attendanceError)
      return { success: false, error: attendanceError.message }
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
    console.error('Error in checkIn:', error)
    return { success: false, error: 'Failed to check in' }
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
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    const checkOutTime = new Date().toTimeString().split(' ')[0]

    // Get work record
    const { data: attendance, error: fetchError } = await supabase
      .from('work_records')
      .select('*')
      .eq('id', data.attendance_id)
      .or(`user_id.eq.${user.id},profile_id.eq.${user.id}`)
      .single()

    if (fetchError || !attendance) {
      return { success: false, error: 'Work record not found' }
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
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', data.attendance_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating work record:', updateError)
      return { success: false, error: updateError.message }
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
    console.error('Error in checkOut:', error)
    return { success: false, error: 'Failed to check out' }
  }
}

export async function getTodayAttendance(site_id?: string) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    const today = new Date().toISOString().split('T')[0]

    let query = supabase
      .from('work_records')
      .select(`
        *,
        worker:profiles(*),
        site:sites(*)
      `)
      .eq('work_date', today)

    if (site_id) {
      query = query.eq('site_id', site_id)
    }

    const { data, error } = await query
      .order('check_in_time', { ascending: true })

    if (error) {
      console.error('Error fetching attendance:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in getTodayAttendance:', error)
    return { success: false, error: 'Failed to fetch attendance' }
  }
}

export async function getMyAttendance(filters: {
  start_date?: string
  end_date?: string
  site_id?: string
}) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    let query = supabase
      .from('work_records')
      .select(`
        *,
        site:sites(
          id,
          report_date,
          site_id,
          site:sites(*)
        )
      `)
      .or(`user_id.eq.${user.id},profile_id.eq.${user.id}`)
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
      total_hours: data?.reduce((sum: any, record: any) => sum + (record.work_hours || 0), 0) || 0,
      total_overtime: data?.reduce((sum: any, record: any) => sum + (record.overtime_hours || 0), 0) || 0,
      days_present: data?.filter((r: any) => r.status === 'present').length || 0,
      days_absent: data?.filter((r: any) => r.status === 'absent').length || 0,
      days_holiday: data?.filter((r: any) => r.status === 'holiday').length || 0
    }

    return { success: true, data, summary }
  } catch (error) {
    console.error('Error in getMyAttendance:', error)
    return { success: false, error: 'Failed to fetch attendance history' }
  }
}

export async function updateAttendanceRecord(
  id: string,
  data: Partial<AttendanceRecord>
) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    const { data: attendance, error } = await supabase
      .from('work_records')
      .update({
        ...data,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating attendance:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/attendance')
    return { success: true, data: attendance }
  } catch (error) {
    console.error('Error in updateAttendanceRecord:', error)
    return { success: false, error: 'Failed to update attendance' }
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
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Prepare work records
    const workRecords = workers.map((worker: any) => {
      const checkIn = new Date(`2000-01-01T${worker.check_in_time}`)
      const checkOut = worker.check_out_time ? new Date(`2000-01-01T${worker.check_out_time}`) : null
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
        labor_hours: 1.0 // Default to 1.0 for bulk attendance
      }
    })

    const { data, error } = await supabase
      .from('work_records')
      .insert(workRecords)
      .select()

    if (error) {
      console.error('Error adding bulk attendance:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/attendance')
    return { success: true, data }
  } catch (error) {
    console.error('Error in addBulkAttendance:', error)
    return { success: false, error: 'Failed to add bulk attendance' }
  }
}

export async function getMonthlyAttendance(year: number, month: number) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Calculate start and end dates for the month
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('work_records')
      .select(`
        *,
        site:sites(
          report_date,
          site_id
        )
      `)
      .or(`user_id.eq.${user.id},profile_id.eq.${user.id}`)
      .gte('work_date', startDate)
      .lte('work_date', endDate)
      .order('work_date', { ascending: true })

    if (error) {
      console.error('Error fetching monthly attendance:', error)
      return { success: false, error: error.message }
    }

    // Transform data to include date field for calendar
    const transformedData = data?.map((record: any) => ({
      ...record,
      date: record.work_date
    })) || []

    return { success: true, data: transformedData }
  } catch (error) {
    console.error('Error in getMonthlyAttendance:', error)
    return { success: false, error: 'Failed to fetch monthly attendance' }
  }
}

export async function getAttendanceSummary(filters: {
  site_id?: string
  start_date: string
  end_date: string
}) {
  try {
    const supabase = createClient()

    let query = supabase
      .from('work_records')
      .select(`
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
          report_date,
          site_id
        )
      `)
      .gte('work_date', filters.start_date)
      .lte('work_date', filters.end_date)

    if (filters.site_id) {
      query = query.eq('daily_report.site_id', filters.site_id)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching attendance summary:', error)
      return { success: false, error: error.message }
    }

    // Group by worker
    const workerSummary = data?.reduce((acc: any, record: any) => {
      const workerId = record.user_id || record.profile_id
      if (!workerId) return acc // Skip if no worker ID
      
      if (!acc[workerId]) {
        acc[workerId] = {
          worker: record.worker,
          total_days: 0,
          total_hours: 0,
          total_overtime: 0,
          days_present: 0,
          days_absent: 0
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
    }, {} as Record<string, any>)

    return { 
      success: true, 
      data: Object.values(workerSummary || {}) 
    }
  } catch (error) {
    console.error('Error in getAttendanceSummary:', error)
    return { success: false, error: 'Failed to fetch attendance summary' }
  }
}