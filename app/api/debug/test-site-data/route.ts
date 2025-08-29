import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    console.log('🔍 Testing site manager data availability...')
    
    const managerId = '950db250-82e4-4c9d-bf4d-75df7244764c' // manager@inopnc.com from logs
    const testSiteId = '55386936-56b0-465e-bcc2-8313db735ca9' // 강남 A현장 from logs
    
    // Check site data (using the same approach as working site-info action)
    const { data: siteAssignments, error: siteError } = await supabase
      .from('site_assignments')
      .select(`
        *,
        sites (
          id,
          name,
          address,
          description,
          work_process,
          work_section,
          component_name,
          manager_name,
          construction_manager_phone,
          safety_manager_name,
          safety_manager_phone,
          accommodation_name,
          accommodation_address,
          status,
          start_date,
          end_date
        )
      `)
      .eq('user_id', managerId)
      .eq('is_active', true)
      .order('assigned_date', { ascending: false })
    
    const siteData = siteAssignments?.[0]?.sites || null
    
    // Check site assignments
    const { data: assignments, error: assignError } = await supabase
      .from('site_assignments')
      .select('*')
      .eq('user_id', managerId)
      .eq('site_id', testSiteId)
      .eq('is_active', true)
    
    // Check daily reports (uses created_by and report_date)
    const { data: reports, error: reportsError } = await supabase
      .from('daily_reports')
      .select('*')
      .eq('created_by', managerId)
      .eq('site_id', testSiteId)
      .order('created_at', { ascending: false })
      .limit(5)
    
    // Check attendance records (uses user_id and work_date)
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('user_id', managerId)
      .eq('site_id', testSiteId)
      .order('work_date', { ascending: false })
      .limit(5)
    
    // Check site documents (might not exist)
    const { data: documents, error: documentsError } = await supabase
      .from('site_documents')
      .select('*')
      .eq('site_id', testSiteId)
    
    console.log('📊 Site Manager Data Test Results:')
    console.log(`  - Site data: ${siteData ? '✅ Found' : '❌ Missing'}`)
    console.log(`  - Active assignments: ${assignments?.length || 0}`)
    console.log(`  - Daily reports: ${reports?.length || 0}`)
    console.log(`  - Attendance records: ${attendance?.length || 0}`)
    console.log(`  - Site documents: ${documents?.length || 0} (table exists: ${!documentsError || documentsError.code !== '42P01'})`)
    
    return NextResponse.json({
      success: true,
      message: 'Site manager data test completed',
      data: {
        site: siteData ? {
          id: siteData.id,
          name: siteData.name,
          address: siteData.address,
          work_process: siteData.work_process,
          work_section: siteData.work_section,
          component_name: siteData.component_name,
          manager_name: siteData.manager_name,
          construction_manager_phone: siteData.construction_manager_phone,
          safety_manager_name: siteData.safety_manager_name,
          safety_manager_phone: siteData.safety_manager_phone,
          accommodation_name: siteData.accommodation_name,
          accommodation_address: siteData.accommodation_address
        } : null,
        assignments: assignments?.length || 0,
        reports: reports?.length || 0,
        attendance: attendance?.length || 0,
        documents: documents?.length || 0,
        documentsTableExists: !documentsError || documentsError.code !== '42P01'
      },
      errors: {
        site: siteError?.message,
        assignments: assignError?.message,
        reports: reportsError?.message,
        attendance: attendanceError?.message,
        documents: documentsError?.message
      }
    })
    
  } catch (error) {
    console.error('❌ Site data test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    console.log('🔄 Populating site manager test data...')
    
    const managerId = '950db250-82e4-4c9d-bf4d-75df7244764c'
    const testSiteId = '55386936-56b0-465e-bcc2-8313db735ca9'
    const today = new Date().toISOString().split('T')[0]
    
    // Create daily report for today
    const { error: reportError } = await supabase
      .from('daily_reports')
      .insert({
        created_by: managerId,
        site_id: testSiteId,
        work_date: today,
        member_name: '기둥',
        process_type: '타설',
        total_workers: 12,
        npc1000_incoming: 120,
        npc1000_used: 80,
        npc1000_remaining: 40,
        issues: '지하 1층 슬라브 타설 작업 진행중. 기둥 C1-C5 구간 철근 배근 완료, 콘크리트 타설 준비 완료.',
        status: 'submitted'
      })
      .select()
      .single()
    
    // Create attendance record
    const { error: attendanceError } = await supabase
      .from('attendance_records')
      .insert({
        user_id: managerId,
        site_id: testSiteId,
        work_date: today,
        check_in_time: '07:30:00',
        check_out_time: '18:00:00',
        work_hours: 9.5,
        labor_hours: 1.0,
        overtime_hours: 0.5,
        status: 'present',
        notes: '현장 전체 관리 및 품질 점검'
      })
      .select()
      .single()
    
    console.log('✅ Test data population completed')
    
    return NextResponse.json({
      success: true,
      message: 'Site manager test data populated successfully',
      created: {
        dailyReport: !reportError,
        attendance: !attendanceError
      },
      errors: {
        dailyReport: reportError?.message,
        attendance: attendanceError?.message
      }
    })
    
  } catch (error) {
    console.error('❌ Data population error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}