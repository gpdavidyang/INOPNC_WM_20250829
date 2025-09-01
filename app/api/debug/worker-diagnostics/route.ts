import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const reportId = searchParams.get('reportId')
  
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    reportId,
    gitCommit: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7),
    tests: {}
  }

  try {
    const supabase = await createClient()
    
    // Test 1: Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    diagnostics.tests.auth = {
      isAuthenticated: !!user,
      userId: user?.id,
      email: user?.email,
      error: authError?.message
    }

    // Test 2: Direct table query (bypasses API)
    const { data: allWorkers, error: allError, count } = await supabase
      .from('daily_report_workers')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(50)
    
    diagnostics.tests.directQuery = {
      success: !allError,
      totalCount: count,
      returnedCount: allWorkers?.length || 0,
      error: allError?.message,
      sampleWorkers: allWorkers?.slice(0, 3).map(w => ({
        id: w.id,
        reportId: w.daily_report_id,
        name: w.worker_name,
        hours: w.work_hours,
        created: w.created_at
      }))
    }

    // Test 3: Query for specific report (if provided)
    if (reportId) {
      const { data: reportWorkers, error: reportError } = await supabase
        .from('daily_report_workers')
        .select('*')
        .eq('daily_report_id', reportId)
        .order('created_at', { ascending: true })
      
      diagnostics.tests.reportQuery = {
        success: !reportError,
        reportId,
        workerCount: reportWorkers?.length || 0,
        error: reportError?.message,
        workers: reportWorkers?.map(w => ({
          id: w.id,
          name: w.worker_name,
          hours: w.work_hours
        }))
      }

      // Test 4: Check if report exists and user has access
      const { data: report, error: reportAccessError } = await supabase
        .from('daily_reports')
        .select('id, reported_by, site_id, total_workers')
        .eq('id', reportId)
        .single()
      
      diagnostics.tests.reportAccess = {
        exists: !!report,
        reportId: report?.id,
        reportedBy: report?.reported_by,
        siteId: report?.site_id,
        totalWorkersField: report?.total_workers,
        error: reportAccessError?.message
      }
    }

    // Test 5: API endpoint test
    if (reportId) {
      try {
        const apiUrl = new URL(`/api/admin/daily-reports/workers?reportId=${reportId}`, request.url)
        const apiResponse = await fetch(apiUrl.toString(), {
          headers: {
            'Cookie': request.headers.get('cookie') || '',
            'Authorization': request.headers.get('authorization') || ''
          }
        })
        
        const apiData = await apiResponse.json()
        
        diagnostics.tests.apiEndpoint = {
          status: apiResponse.status,
          ok: apiResponse.ok,
          dataCount: Array.isArray(apiData.data) ? apiData.data.length : 0,
          error: apiData.error,
          response: apiResponse.ok ? apiData : { error: apiData.error }
        }
      } catch (apiError) {
        diagnostics.tests.apiEndpoint = {
          error: apiError instanceof Error ? apiError.message : 'API test failed'
        }
      }
    }

    // Test 6: RLS policy test
    if (user) {
      // Try insert test (without actually inserting)
      const testData = {
        daily_report_id: reportId || '00000000-0000-0000-0000-000000000000',
        worker_name: 'RLS Test Worker',
        work_hours: 1
      }
      
      const { error: rlsError } = await supabase
        .from('daily_report_workers')
        .select('*')
        .eq('daily_report_id', testData.daily_report_id)
        .limit(1)
      
      diagnostics.tests.rlsPolicies = {
        canSelect: !rlsError,
        selectError: rlsError?.message
      }
    }

    // Summary
    diagnostics.summary = {
      authOk: !!user,
      tableAccessible: !allError,
      totalWorkersInDb: count || 0,
      reportHasWorkers: reportId ? (diagnostics.tests.reportQuery?.workerCount || 0) : 'N/A',
      apiWorking: diagnostics.tests.apiEndpoint?.ok || false,
      likelyIssue: determineIssue(diagnostics)
    }

    return NextResponse.json(diagnostics, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    })
  } catch (error) {
    diagnostics.criticalError = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(diagnostics, { status: 500 })
  }
}

function determineIssue(diagnostics: any): string {
  if (!diagnostics.tests.auth?.isAuthenticated) {
    return 'Not authenticated'
  }
  
  if (!diagnostics.tests.directQuery?.success) {
    return 'Cannot access workers table'
  }
  
  if (diagnostics.tests.directQuery?.totalCount === 0) {
    return 'No workers in database at all'
  }
  
  if (diagnostics.reportId && diagnostics.tests.reportQuery?.workerCount === 0) {
    return 'No workers for this specific report'
  }
  
  if (diagnostics.tests.apiEndpoint && !diagnostics.tests.apiEndpoint.ok) {
    return 'API endpoint failing'
  }
  
  if (diagnostics.tests.apiEndpoint?.dataCount !== diagnostics.tests.reportQuery?.workerCount) {
    return 'API returning different data than direct query'
  }
  
  return 'No obvious issues detected - check browser console'
}