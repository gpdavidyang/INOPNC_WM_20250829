import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    console.log('🔄 Starting data generation for site manager testing...')
    
    // Insert today's daily report
    const { error: dailyReportError } = await supabase
      .from('daily_reports')
      .upsert({
        user_id: '950db250-82e4-4c9d-bf4d-75df7244764c',
        site_id: '55386936-56b0-465e-bcc2-8313db735ca9',
        report_date: new Date().toISOString().split('T')[0],
        work_description: '지하 1층 슬라브 타설 작업 진행중. 기둥 C1-C5 구간 철근 배근 완료, 콘크리트 타설 준비 완료. 품질 검사 통과 후 오후 2시부터 타설 시작 예정.',
        progress_percentage: 75,
        weather_condition: 'sunny',
        temperature: 23,
        worker_count: 12,
        equipment_used: ['타워크레인', '콘크리트펌프카', '진동기', '레이저레벨기'],
        materials_used: ['콘크리트 120㎥', '철근 D19 50본', '거푸집 판넬 80매'],
        safety_issues: '특이사항 없음. 안전교육 실시 완료.',
        quality_notes: '철근 배근 상태 양호. 콘크리트 강도 확인 완료.',
        next_day_plan: '내일 슬라브 양생 상태 점검 후 다음 구간 작업 준비. 기둥 C6-C10 구간 철근 반입 예정.',
        status: 'submitted'
      }, {
        onConflict: 'user_id,site_id,report_date'
      })
    
    if (dailyReportError) {
      console.error('Daily report error:', dailyReportError)
    } else {
      console.log('✅ Daily report created/updated')
    }
    
    // Insert attendance records for today
    const attendanceRecords = [
      {
        user_id: '950db250-82e4-4c9d-bf4d-75df7244764c', // Manager himself
        site_id: '55386936-56b0-465e-bcc2-8313db735ca9',
        attendance_date: new Date().toISOString().split('T')[0],
        check_in_time: '07:30:00',
        check_out_time: '18:00:00',
        work_hours: 9.5,
        labor_hours: 1.0,
        overtime_hours: 0.5,
        work_type: 'management',
        weather_condition: 'sunny',
        notes: '현장 전체 관리 및 품질 점검'
      }
    ]
    
    const { error: attendanceError } = await supabase
      .from('attendance_records')
      .upsert(attendanceRecords, {
        onConflict: 'user_id,site_id,attendance_date'
      })
    
    if (attendanceError) {
      console.error('Attendance error:', attendanceError)
    } else {
      console.log('✅ Attendance records created/updated')
    }
    
    // Create notifications
    const notifications = [
      {
        user_id: '950db250-82e4-4c9d-bf4d-75df7244764c',
        title: '오늘의 작업 계획 확인',
        message: '지하 1층 슬라브 타설 작업이 예정되어 있습니다. 오후 2시 시작 예정입니다.',
        type: 'work_schedule',
        priority: 'medium',
        related_id: '55386936-56b0-465e-bcc2-8313db735ca9',
        is_read: false
      },
      {
        user_id: '950db250-82e4-4c9d-bf4d-75df7244764c',
        title: '안전 점검 완료',
        message: '현장 안전 점검이 완료되었습니다. 특이사항 없음.',
        type: 'safety',
        priority: 'low',
        related_id: '55386936-56b0-465e-bcc2-8313db735ca9',
        is_read: false
      }
    ]
    
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert(notifications)
    
    if (notificationError) {
      console.error('Notification error:', notificationError)
    } else {
      console.log('✅ Notifications created')
    }
    
    // Try to create site_documents table and sample documents
    try {
      const { error: docInsertError } = await supabase
        .from('site_documents')
        .insert([
          {
            site_id: '55386936-56b0-465e-bcc2-8313db735ca9',
            document_type: 'ptw',
            title: 'PTW-2025-0822 작업허가서',
            description: '지하 1층 슬라브 타설 작업 허가서',
            file_url: '/documents/ptw/PTW-2025-0822.pdf',
            file_name: 'PTW-2025-0822.pdf',
            document_number: 'PTW-2025-0822'
          },
          {
            site_id: '55386936-56b0-465e-bcc2-8313db735ca9',
            document_type: 'blueprint',
            title: '강남 A현장 구조도면',
            description: '지하 1층 구조 설계도면 (기둥 C1-C5 구간)',
            file_url: '/documents/blueprints/gangnam-a-b1-structure.pdf',
            file_name: 'gangnam-a-b1-structure.pdf',
            document_number: 'BP-GA-B1-001'
          }
        ])
      
      if (docInsertError) {
        console.log('Site documents error (expected if table not exists):', docInsertError.code)
      } else {
        console.log('✅ Site documents created')
      }
    } catch (error) {
      console.log('Site documents table not available yet (non-fatal)')
    }
    
    // Verify data was created
    const { data: reports } = await supabase
      .from('daily_reports')
      .select('*')
      .eq('user_id', '950db250-82e4-4c9d-bf4d-75df7244764c')
      .eq('site_id', '55386936-56b0-465e-bcc2-8313db735ca9')
      .eq('report_date', new Date().toISOString().split('T')[0])
    
    const { data: attendance } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('user_id', '950db250-82e4-4c9d-bf4d-75df7244764c')
      .eq('site_id', '55386936-56b0-465e-bcc2-8313db735ca9')
      .eq('attendance_date', new Date().toISOString().split('T')[0])
    
    const { data: notifs } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', '950db250-82e4-4c9d-bf4d-75df7244764c')
      .order('created_at', { ascending: false })
      .limit(5)
    
    console.log('✅ Data generation completed successfully')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Site manager test data generated successfully',
      data: {
        dailyReports: reports?.length || 0,
        attendanceRecords: attendance?.length || 0,
        notifications: notifs?.length || 0
      }
    })
    
  } catch (error) {
    console.error('❌ Data generation error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}