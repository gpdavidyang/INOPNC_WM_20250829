import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    method: 'GET',
    path: request.nextUrl.pathname,
    searchParams: Object.fromEntries(request.nextUrl.searchParams),
  }

  try {
    // Step 1: Create Supabase client
    const supabase = await createClient()
    debugInfo.supabaseClient = 'created'

    // Step 2: Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    debugInfo.auth = {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      userRole: user?.role,
      error: authError?.message
    }

    if (!user) {
      return NextResponse.json({
        ...debugInfo,
        error: 'No authenticated user'
      }, { status: 401 })
    }

    // Step 3: Check user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    debugInfo.profile = {
      hasProfile: !!profile,
      profileRole: profile?.role,
      error: profileError?.message
    }

    // Step 4: Test daily_reports access
    const { data: reports, error: reportsError } = await supabase
      .from('daily_reports')
      .select('id, reported_by, site_id, report_date')
      .order('created_at', { ascending: false })
      .limit(5)

    debugInfo.reports = {
      count: reports?.length || 0,
      canAccess: !reportsError,
      error: reportsError?.message,
      samples: reports?.map(r => ({
        id: r.id,
        reported_by: r.reported_by,
        isOwner: r.reported_by === user.id
      }))
    }

    // Step 5: Test daily_report_workers access (READ)
    const { data: workers, error: workersError } = await supabase
      .from('daily_report_workers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    debugInfo.workers = {
      count: workers?.length || 0,
      canRead: !workersError,
      error: workersError?.message,
      samples: workers?.slice(0, 3)
    }

    // Step 6: Test INSERT capability
    if (reports && reports.length > 0) {
      const testReportId = reports[0].id
      const testWorkerName = `TEST_${Date.now()}`
      
      const { data: insertTest, error: insertError } = await supabase
        .from('daily_report_workers')
        .insert({
          daily_report_id: testReportId,
          worker_name: testWorkerName,
          work_hours: 0.5
        })
        .select()

      debugInfo.insertTest = {
        reportId: testReportId,
        workerName: testWorkerName,
        success: !insertError,
        data: insertTest,
        error: insertError?.message,
        errorDetails: insertError
      }

      // Clean up test data if successful
      if (insertTest && insertTest[0]) {
        await supabase
          .from('daily_report_workers')
          .delete()
          .eq('id', insertTest[0].id)
        
        debugInfo.insertTest.cleanedUp = true
      }
    }

    // Step 7: Check RLS policies directly
    const { data: policies, error: policiesError } = await supabase.rpc('get_policies_for_table', {
      schema_name: 'public',
      table_name: 'daily_report_workers'
    }).select('*').limit(10) // Add limit to prevent error

    debugInfo.policies = {
      canCheckPolicies: !policiesError,
      error: policiesError?.message,
      data: policies
    }

    return NextResponse.json(debugInfo)
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({
      ...debugInfo,
      unexpectedError: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    method: 'POST',
  }

  try {
    const body = await request.json()
    debugInfo.requestBody = body

    const supabase = await createClient()
    
    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    debugInfo.auth = {
      hasUser: !!user,
      userId: user?.id,
      error: authError?.message
    }

    if (!user) {
      return NextResponse.json({
        ...debugInfo,
        error: 'No authenticated user'
      }, { status: 401 })
    }

    const { daily_report_id, worker_name, work_hours } = body

    // Verify report access
    const { data: report, error: reportError } = await supabase
      .from('daily_reports')
      .select('*')
      .eq('id', daily_report_id)
      .single()

    debugInfo.reportCheck = {
      found: !!report,
      reportedBy: report?.reported_by,
      isOwner: report?.reported_by === user.id,
      error: reportError?.message
    }

    // Try to insert
    const { data: insertResult, error: insertError } = await supabase
      .from('daily_report_workers')
      .insert({
        daily_report_id,
        worker_name: worker_name.trim(),
        work_hours: Number(work_hours)
      })
      .select()

    debugInfo.insert = {
      success: !insertError,
      data: insertResult,
      error: insertError?.message,
      errorCode: insertError?.code,
      errorDetails: insertError
    }

    // Check if data actually exists after insert
    if (!insertError) {
      const { data: verifyData, error: verifyError } = await supabase
        .from('daily_report_workers')
        .select('*')
        .eq('daily_report_id', daily_report_id)
        .order('created_at', { ascending: false })

      debugInfo.verification = {
        totalWorkers: verifyData?.length || 0,
        latestWorker: verifyData?.[0],
        error: verifyError?.message
      }
    }

    return NextResponse.json(debugInfo, { 
      status: insertError ? 400 : 200 
    })
  } catch (error) {
    console.error('Debug POST error:', error)
    return NextResponse.json({
      ...debugInfo,
      unexpectedError: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}