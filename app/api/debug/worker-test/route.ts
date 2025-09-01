import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  console.log('=== WORKER TEST ENDPOINT ===')
  
  const result: any = {
    timestamp: new Date().toISOString(),
    gitCommit: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7),
    environment: process.env.NODE_ENV,
    tests: {}
  }

  try {
    const supabase = await createClient()
    
    // Test 1: Check table exists
    const { count, error: countError } = await supabase
      .from('daily_report_workers')
      .select('*', { count: 'exact', head: true })
    
    result.tests.tableExists = !countError
    result.tests.totalWorkers = count || 0
    
    // Test 2: Check if we can query without auth (RLS test)
    const { data: publicData, error: publicError } = await supabase
      .from('daily_report_workers')
      .select('id')
      .limit(1)
    
    result.tests.publicAccess = !publicError
    result.tests.publicError = publicError?.message
    
    // Test 3: Check with auth
    const { data: { user } } = await supabase.auth.getUser()
    result.tests.hasAuth = !!user
    result.tests.userEmail = user?.email
    
    if (user) {
      // Test 4: Try to read workers with auth
      const { data: workers, error: readError } = await supabase
        .from('daily_report_workers')
        .select('*')
        .limit(5)
        .order('created_at', { ascending: false })
      
      result.tests.canReadWithAuth = !readError
      result.tests.readError = readError?.message
      result.tests.recentWorkers = workers?.map(w => ({
        id: w.id,
        name: w.worker_name,
        hours: w.work_hours,
        created: w.created_at
      }))
      
      // Test 5: Check if worker API route responds
      try {
        const apiUrl = new URL('/api/admin/daily-reports/workers', request.url)
        apiUrl.searchParams.set('test', 'true')
        
        const apiResponse = await fetch(apiUrl.toString(), {
          headers: request.headers
        })
        
        result.tests.workerApiStatus = apiResponse.status
        result.tests.workerApiOk = apiResponse.ok
        
        if (apiResponse.ok) {
          const apiData = await apiResponse.json()
          result.tests.workerApiResponse = apiData
        }
      } catch (apiError) {
        result.tests.workerApiError = apiError instanceof Error ? apiError.message : 'API test failed'
      }
    }
    
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    })
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(result, { status: 500 })
  }
}