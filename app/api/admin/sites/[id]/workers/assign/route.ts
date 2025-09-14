import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'


export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    // Check authentication and admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const siteId = params.id
    const { worker_ids, trade, position } = await request.json()

    if (!worker_ids || !Array.isArray(worker_ids) || worker_ids.length === 0) {
      return NextResponse.json({ error: 'Invalid worker IDs' }, { status: 400 })
    }

    // Get the actual roles of the workers from profiles
    console.log('Fetching profiles for worker IDs:', worker_ids)
    const { data: workerProfiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .in('id', worker_ids)
    
    console.log('Worker profiles query result:', { 
      data: workerProfiles, 
      error: profileError,
      count: workerProfiles?.length 
    })
    
    if (profileError) {
      console.error('Error fetching worker profiles:', profileError)
      console.error('Profile query details:', {
        worker_ids,
        error_message: profileError.message,
        error_code: profileError.code,
        error_details: profileError.details
      })
      return NextResponse.json({ 
        error: 'Failed to fetch worker profiles',
        details: profileError.message 
      }, { status: 500 })
    }

    // Create assignments for each worker with their actual role
    const assignments = worker_ids.map(workerId => {
      const workerProfile = workerProfiles?.find((p: unknown) => p.id === workerId)
      // Map the user's role to a valid site assignment role
      let assignmentRole = 'worker'
      if (workerProfile?.role === 'site_manager') {
        assignmentRole = 'site_manager'
      } else if (workerProfile?.role === 'supervisor') {
        assignmentRole = 'supervisor'
      }
      // All other roles (admin, worker, partner, etc.) default to 'worker' role in site_assignments
      
      return {
        site_id: siteId,
        user_id: workerId,
        assigned_date: new Date().toISOString().split('T')[0], // Date only format
        role: assignmentRole, // Use mapped role that's valid for site_assignments
        is_active: true
      }
    })

    // Insert assignments
    console.log('Inserting assignments:', assignments)
    const { data: insertedAssignments, error: insertError } = await supabase
      .from('site_assignments')
      .insert(assignments)
      .select()

    console.log('Insert result:', { 
      data: insertedAssignments, 
      error: insertError,
      count: insertedAssignments?.length 
    })

    if (insertError) {
      console.error('Error assigning workers:', insertError)
      console.error('Assignments data:', assignments)
      console.error('Insert error details:', {
        error_message: insertError.message,
        error_code: insertError.code,
        error_details: insertError.details,
        error_hint: insertError.hint
      })
      return NextResponse.json({ 
        error: 'Failed to assign workers',
        details: insertError.message,
        code: insertError.code
      }, { status: 500 })
    }

    // Log the assignment activity (optional - don't fail if this errors)
    try {
      await supabase
        .from('activity_logs')
        .insert({
          user_id: user.id,
          action: 'workers_assigned',
          entity_type: 'site',
          entity_id: siteId,
          details: {
            worker_count: worker_ids.length,
            worker_ids: worker_ids
          }
        })
    } catch (logError) {
      console.warn('Failed to log activity:', logError)
      // Continue even if logging fails
    }

    return NextResponse.json({
      success: true,
      data: insertedAssignments,
      message: `${worker_ids.length}명의 작업자가 현장에 배정되었습니다.`
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
