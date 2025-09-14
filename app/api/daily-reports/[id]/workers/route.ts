import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'


export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reportId = params.id

    // Fetch workers for the daily report
    const { data: workers, error } = await supabase
      .from('daily_report_workers')
      .select('*')
      .eq('daily_report_id', reportId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Workers query error:', error)
      return NextResponse.json({ error: 'Failed to fetch workers' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: workers || []
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin privileges
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'system_admin', 'site_manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const reportId = params.id
    const body = await request.json()
    const { workers } = body

    if (!Array.isArray(workers)) {
      return NextResponse.json({ error: 'Invalid workers data' }, { status: 400 })
    }

    // Validate worker data
    for (const worker of workers) {
      if (!worker.worker_name || typeof worker.work_hours !== 'number' || worker.work_hours <= 0) {
        return NextResponse.json({ error: 'Invalid worker data' }, { status: 400 })
      }
    }

    // Start transaction: delete existing workers and insert new ones
    const { error: deleteError } = await supabase
      .from('daily_report_workers')
      .delete()
      .eq('daily_report_id', reportId)

    if (deleteError) {
      console.error('Delete workers error:', deleteError)
      return NextResponse.json({ error: 'Failed to update workers' }, { status: 500 })
    }

    // Insert new workers if any
    if (workers.length > 0) {
      const workerInserts = workers.map(worker => ({
        daily_report_id: reportId,
        worker_name: worker.worker_name,
        work_hours: worker.work_hours
      }))

      const { error: insertError } = await supabase
        .from('daily_report_workers')
        .insert(workerInserts)

      if (insertError) {
        console.error('Insert workers error:', insertError)
        return NextResponse.json({ error: 'Failed to update workers' }, { status: 500 })
      }
    }

    // Update total_workers in daily_reports table
    const { error: updateError } = await supabase
      .from('daily_reports')
      .update({ 
        total_workers: workers.length,
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId)

    if (updateError) {
      console.error('Update total workers error:', updateError)
      // Don't fail the request for this, just log it
    }

    // Return updated workers
    const { data: updatedWorkers } = await supabase
      .from('daily_report_workers')
      .select('*')
      .eq('daily_report_id', reportId)
      .order('created_at', { ascending: true })

    return NextResponse.json({
      success: true,
      data: updatedWorkers || []
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin privileges
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'system_admin', 'site_manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const reportId = params.id
    const body = await request.json()
    const { worker_name, work_hours } = body

    // Validate input
    if (!worker_name || typeof work_hours !== 'number' || work_hours <= 0) {
      return NextResponse.json({ error: 'Invalid worker data' }, { status: 400 })
    }

    // Insert new worker
    const { data: newWorker, error: insertError } = await supabase
      .from('daily_report_workers')
      .insert({
        daily_report_id: reportId,
        worker_name: worker_name.trim(),
        work_hours: work_hours
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert worker error:', insertError)
      return NextResponse.json({ error: 'Failed to add worker' }, { status: 500 })
    }

    // Update total_workers count
    const { count } = await supabase
      .from('daily_report_workers')
      .select('id', { count: 'exact', head: true })
      .eq('daily_report_id', reportId)

    const { error: updateError } = await supabase
      .from('daily_reports')
      .update({ 
        total_workers: count || 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId)

    if (updateError) {
      console.error('Update total workers error:', updateError)
      // Don't fail the request for this, just log it
    }

    return NextResponse.json({
      success: true,
      data: newWorker
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin privileges
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'system_admin', 'site_manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const reportId = params.id
    const { searchParams } = new URL(request.url)
    const workerId = searchParams.get('workerId')

    if (!workerId) {
      return NextResponse.json({ error: 'Worker ID is required' }, { status: 400 })
    }

    // Delete the worker
    const { error: deleteError } = await supabase
      .from('daily_report_workers')
      .delete()
      .eq('id', workerId)
      .eq('daily_report_id', reportId) // Additional security check

    if (deleteError) {
      console.error('Delete worker error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete worker' }, { status: 500 })
    }

    // Update total_workers count
    const { count } = await supabase
      .from('daily_report_workers')
      .select('id', { count: 'exact', head: true })
      .eq('daily_report_id', reportId)

    const { error: updateError } = await supabase
      .from('daily_reports')
      .update({ 
        total_workers: count || 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId)

    if (updateError) {
      console.error('Update total workers error:', updateError)
      // Don't fail the request for this, just log it
    }

    return NextResponse.json({
      success: true,
      message: 'Worker deleted successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
