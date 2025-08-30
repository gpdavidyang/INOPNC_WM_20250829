import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
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
    const { worker_id } = await request.json()

    if (!worker_id) {
      return NextResponse.json({ error: 'Worker ID is required' }, { status: 400 })
    }

    // Create service client for admin operations (bypasses RLS)
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Soft delete the assignment by setting is_active to false
    const { data: updatedAssignment, error: updateError } = await serviceClient
      .from('site_workers')
      .update({ 
        is_active: false,
        unassigned_at: new Date().toISOString(),
        unassigned_by: user.id
      })
      .eq('site_id', siteId)
      .eq('user_id', worker_id)
      .eq('is_active', true)
      .select()
      .single()

    if (updateError) {
      console.error('Error unassigning worker:', updateError)
      return NextResponse.json({ error: 'Failed to unassign worker' }, { status: 500 })
    }

    if (!updatedAssignment) {
      return NextResponse.json({ error: 'Worker assignment not found' }, { status: 404 })
    }

    // Log the unassignment activity
    await serviceClient
      .from('activity_logs')
      .insert({
        user_id: user.id,
        action: 'worker_unassigned',
        entity_type: 'site',
        entity_id: siteId,
        details: {
          worker_id: worker_id,
          assignment_id: updatedAssignment.id
        }
      })

    return NextResponse.json({
      success: true,
      data: updatedAssignment,
      message: '작업자가 현장에서 제외되었습니다.'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}