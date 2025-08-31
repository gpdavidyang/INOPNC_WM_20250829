import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(request: NextRequest) {
  try {
    const { reportId, workerName, workHours } = await request.json()
    
    console.log('[TEST-WORKER-INSERT] Request data:', { reportId, workerName, workHours })
    
    // Create server client with proper cookie handling
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            // Don't set cookies in this endpoint
          },
        },
      }
    )

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError) {
      console.error('[TEST-WORKER-INSERT] Auth error:', authError)
      return NextResponse.json({ 
        error: 'Authentication error', 
        details: authError.message 
      }, { status: 401 })
    }
    
    if (!session) {
      console.log('[TEST-WORKER-INSERT] No session found')
      return NextResponse.json({ 
        error: 'No session found',
        suggestion: 'Please log in again'
      }, { status: 401 })
    }
    
    console.log('[TEST-WORKER-INSERT] Session valid for:', session.user?.email)
    
    // Validate input
    if (!reportId || !workerName || !workHours) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        required: ['reportId', 'workerName', 'workHours']
      }, { status: 400 })
    }
    
    // Test insert
    const { data, error } = await supabase
      .from('daily_report_workers')
      .insert({
        daily_report_id: reportId,
        worker_name: workerName.trim(),
        work_hours: workHours
      })
      .select()
      .single()
    
    if (error) {
      console.error('[TEST-WORKER-INSERT] Insert error:', error)
      
      // Provide detailed error information
      let errorDetails = {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      }
      
      if (error.code === '23503') {
        errorDetails.hint = 'Foreign key constraint violation - check if the daily_report_id exists'
      } else if (error.code === 'PGRST301') {
        errorDetails.hint = 'Row level security policy violation - check RLS policies'
      }
      
      return NextResponse.json({ 
        error: 'Insert failed',
        errorDetails
      }, { status: 400 })
    }
    
    console.log('[TEST-WORKER-INSERT] Insert successful:', data)
    
    // Fetch all workers for this report to verify
    const { data: allWorkers, error: fetchError } = await supabase
      .from('daily_report_workers')
      .select('*')
      .eq('daily_report_id', reportId)
    
    return NextResponse.json({ 
      success: true,
      insertedWorker: data,
      totalWorkers: allWorkers?.length || 0,
      allWorkers: allWorkers || [],
      session: {
        user: session.user?.email,
        expiresAt: session.expires_at
      }
    })
    
  } catch (error) {
    console.error('[TEST-WORKER-INSERT] Unexpected error:', error)
    return NextResponse.json(
      { 
        error: 'Unexpected server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reportId = searchParams.get('reportId')
    
    if (!reportId) {
      return NextResponse.json({ 
        error: 'Missing reportId parameter' 
      }, { status: 400 })
    }
    
    // Create server client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            // Don't set cookies in this endpoint
          },
        },
      }
    )

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ 
        error: 'Not authenticated' 
      }, { status: 401 })
    }
    
    // Fetch workers
    const { data: workers, error } = await supabase
      .from('daily_report_workers')
      .select('*')
      .eq('daily_report_id', reportId)
      .order('created_at', { ascending: true })
    
    if (error) {
      return NextResponse.json({ 
        error: 'Failed to fetch workers',
        details: error.message
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      workers: workers || [],
      count: workers?.length || 0,
      session: {
        user: session.user?.email,
        expiresAt: session.expires_at
      }
    })
    
  } catch (error) {
    console.error('[TEST-WORKER-INSERT] GET error:', error)
    return NextResponse.json(
      { error: 'Server error' }, 
      { status: 500 }
    )
  }
}