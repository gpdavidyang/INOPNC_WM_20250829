import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const info: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    vercelUrl: process.env.VERCEL_URL,
    vercelRegion: process.env.VERCEL_REGION,
    gitCommit: process.env.VERCEL_GIT_COMMIT_SHA,
    gitBranch: process.env.VERCEL_GIT_COMMIT_REF,
    buildId: process.env.VERCEL_BUILD_ID,
  }

  try {
    const supabase = await createClient()
    
    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    info.auth = {
      isAuthenticated: !!user,
      userId: user?.id,
      email: user?.email,
      error: authError?.message
    }

    // Check database connection
    const { data: dbCheck, error: dbError } = await supabase
      .from('daily_report_workers')
      .select('count')
      .limit(1)
    
    info.database = {
      connected: !dbError,
      error: dbError?.message,
      hasRLSAccess: !!dbCheck
    }

    // Check if worker route exists
    info.routes = {
      workerRouteExists: !!global.fetch,
      apiPath: '/api/admin/daily-reports/workers'
    }

    // Test RLS for current user
    if (user) {
      const { data: workers, error: workersError } = await supabase
        .from('daily_report_workers')
        .select('*')
        .limit(5)
      
      info.rlsTest = {
        canReadWorkers: !workersError,
        workerCount: workers?.length || 0,
        error: workersError?.message
      }
    }

    return NextResponse.json(info, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    info.error = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(info, { status: 500 })
  }
}