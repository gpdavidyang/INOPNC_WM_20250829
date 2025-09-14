
// Simple test endpoint to directly test worker operations
export async function GET(request: NextRequest) {
  console.log('=== TEST ENDPOINT GET ===')
  
  try {
    const supabase = await createClient()
    
    // Get user
    const { data: { user } } = await supabase.auth.getUser()
    console.log('User:', user?.email)
    
    // Get all workers
    const { data: workers, error } = await supabase
      .from('daily_report_workers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    
    console.log('Workers found:', workers?.length)
    console.log('Error:', error)
    
    return NextResponse.json({
      success: !error,
      user: user?.email,
      workerCount: workers?.length || 0,
      workers: workers || [],
      error: error?.message
    })
  } catch (error) {
    console.error('Test endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

export async function POST(request: NextRequest) {
  console.log('=== TEST ENDPOINT POST ===')
  
  try {
    const supabase = await createClient()
    
    // Get user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No user' }, { status: 401 })
    }
    
    console.log('User:', user.email)
    
    // Get a report to test with
    const { data: reports } = await supabase
      .from('daily_reports')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (!reports || reports.length === 0) {
      return NextResponse.json({ error: 'No reports found' })
    }
    
    const reportId = reports[0].id
    console.log('Using report:', reportId)
    
    // Try to insert a test worker
    const testWorker = {
      daily_report_id: reportId,
      worker_name: `Test Worker ${Date.now()}`,
      work_hours: 1.5
    }
    
    console.log('Inserting:', testWorker)
    
    const { data, error } = await supabase
      .from('daily_report_workers')
      .insert(testWorker)
      .select()
      .single()
    
    console.log('Insert result:', { data, error })
    
    // Verify it exists
    const { data: verify } = await supabase
      .from('daily_report_workers')
      .select('*')
      .eq('daily_report_id', reportId)
      .order('created_at', { ascending: false })
    
    return NextResponse.json({
      success: !error,
      inserted: data,
      error: error?.message,
      errorDetails: error,
      verification: {
        totalWorkers: verify?.length || 0,
        workers: verify
      }
    })
  } catch (error) {
    console.error('Test POST error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}