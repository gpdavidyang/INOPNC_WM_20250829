import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    console.log('🔍 Checking database schema...')
    
    // Check sites table structure
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('*')
      .limit(3)
    
    // Check daily_reports table structure
    const { data: reports, error: reportsError } = await supabase
      .from('daily_reports')
      .select('*')
      .limit(1)
    
    // Check attendance_records table structure
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance_records')
      .select('*')
      .limit(1)
    
    // Check site_assignments table structure
    const { data: assignments, error: assignmentsError } = await supabase
      .from('site_assignments')
      .select('*')
      .limit(1)
    
    console.log('📊 Database Schema Check Results:')
    console.log('Sites sample:', sites ? Object.keys(sites[0] || {}) : 'Error')
    console.log('Reports sample:', reports ? Object.keys(reports[0] || {}) : 'Error')
    console.log('Attendance sample:', attendance ? Object.keys(attendance[0] || {}) : 'Error')
    console.log('Assignments sample:', assignments ? Object.keys(assignments[0] || {}) : 'Error')
    
    return NextResponse.json({
      success: true,
      message: 'Database schema check completed',
      schemas: {
        sites: sites ? Object.keys(sites[0] || {}) : null,
        daily_reports: reports ? Object.keys(reports[0] || {}) : null,
        attendance_records: attendance ? Object.keys(attendance[0] || {}) : null,
        site_assignments: assignments ? Object.keys(assignments[0] || {}) : null
      },
      sampleData: {
        sites: sites?.slice(0, 2),
        daily_reports: reports?.slice(0, 1),
        attendance_records: attendance?.slice(0, 1),
        site_assignments: assignments?.slice(0, 1)
      },
      errors: {
        sites: sitesError?.message,
        daily_reports: reportsError?.message,
        attendance_records: attendanceError?.message,
        site_assignments: assignmentsError?.message
      }
    })
    
  } catch (error) {
    console.error('❌ Schema check error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}