import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Auth error in workers GET:', authError)
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const reportId = searchParams.get('reportId')
    
    if (!reportId) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 })
    }

    console.log(`Fetching workers for report: ${reportId}, user: ${user.id}`)

    const { data, error } = await supabase
      .from('daily_report_workers')
      .select('*')
      .eq('daily_report_id', reportId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Database error fetching workers:', {
        error,
        reportId,
        userId: user.id
      })
      return NextResponse.json({ 
        error: error.message,
        details: 'RLS policy may be blocking access'
      }, { status: 500 })
    }

    console.log(`Found ${data?.length || 0} workers for report ${reportId}`)
    return NextResponse.json({ data: data || [] })
  } catch (error) {
    console.error('Worker fetch error:', error)
    return NextResponse.json({ 
      error: '작업자 정보를 불러오는데 실패했습니다' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Auth error in workers POST:', authError)
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const body = await request.json()
    const { daily_report_id, worker_name, work_hours } = body

    console.log('POST worker request:', { daily_report_id, worker_name, work_hours, userId: user.id })

    if (!daily_report_id || !worker_name || !work_hours) {
      return NextResponse.json({ 
        error: '필수 정보가 누락되었습니다',
        received: { daily_report_id, worker_name, work_hours }
      }, { status: 400 })
    }

    // First verify the user has access to this report
    const { data: report, error: reportError } = await supabase
      .from('daily_reports')
      .select('id, reported_by')
      .eq('id', daily_report_id)
      .single()

    if (reportError || !report) {
      console.error('Report access error:', reportError)
      return NextResponse.json({ 
        error: '보고서에 접근할 수 없습니다',
        details: reportError?.message
      }, { status: 403 })
    }

    console.log('Report access verified:', { reportId: report.id, reportedBy: report.reported_by })

    const { data, error } = await supabase
      .from('daily_report_workers')
      .insert({
        daily_report_id,
        worker_name: worker_name.trim(),
        work_hours: Number(work_hours)
      })
      .select()
      .single()

    if (error) {
      console.error('Database error inserting worker:', {
        error,
        daily_report_id,
        worker_name,
        work_hours
      })
      return NextResponse.json({ 
        error: error.message,
        details: 'Check RLS policies and foreign key constraints'
      }, { status: 500 })
    }

    console.log('Worker inserted successfully:', data)

    // Update total workers count in daily_reports
    const { data: workers } = await supabase
      .from('daily_report_workers')
      .select('*')
      .eq('daily_report_id', daily_report_id)

    if (workers) {
      await supabase
        .from('daily_reports')
        .update({ total_workers: workers.length })
        .eq('id', daily_report_id)
      
      console.log(`Updated total workers count to ${workers.length} for report ${daily_report_id}`)
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Worker insert error:', error)
    return NextResponse.json({ 
      error: '작업자 추가에 실패했습니다' 
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const body = await request.json()
    const { id, worker_name, work_hours } = body

    if (!id || !worker_name || !work_hours) {
      return NextResponse.json({ 
        error: '필수 정보가 누락되었습니다' 
      }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('daily_report_workers')
      .update({
        worker_name: worker_name.trim(),
        work_hours: Number(work_hours)
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating worker:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Worker update error:', error)
    return NextResponse.json({ 
      error: '작업자 수정에 실패했습니다' 
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const workerId = searchParams.get('id')
    const reportId = searchParams.get('reportId')
    
    if (!workerId) {
      return NextResponse.json({ error: 'Worker ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('daily_report_workers')
      .delete()
      .eq('id', workerId)

    if (error) {
      console.error('Error deleting worker:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update total workers count if reportId provided
    if (reportId) {
      const { data: workers } = await supabase
        .from('daily_report_workers')
        .select('*')
        .eq('daily_report_id', reportId)

      await supabase
        .from('daily_reports')
        .update({ total_workers: workers?.length || 0 })
        .eq('id', reportId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Worker delete error:', error)
    return NextResponse.json({ 
      error: '작업자 삭제에 실패했습니다' 
    }, { status: 500 })
  }
}