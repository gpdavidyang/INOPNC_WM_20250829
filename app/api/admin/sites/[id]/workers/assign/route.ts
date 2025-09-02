import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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
    const { data: workerProfiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .in('id', worker_ids)
    
    if (profileError) {
      console.error('Error fetching worker profiles:', profileError)
      return NextResponse.json({ error: 'Failed to fetch worker profiles' }, { status: 500 })
    }

    // Create assignments for each worker with their actual role
    const assignments = worker_ids.map(workerId => {
      const workerProfile = workerProfiles?.find(p => p.id === workerId)
      return {
        site_id: siteId,
        user_id: workerId,
        assigned_date: new Date().toISOString().split('T')[0], // Date only format
        role: workerProfile?.role || 'worker', // Use actual role from profile
        is_active: true
      }
    })

    // Insert assignments
    const { data: insertedAssignments, error: insertError } = await supabase
      .from('site_assignments')
      .insert(assignments)
      .select()

    if (insertError) {
      console.error('Error assigning workers:', insertError)
      console.error('Assignments data:', assignments)
      return NextResponse.json({ 
        error: 'Failed to assign workers',
        details: insertError.message 
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