import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// POST: Bulk create user assignments
export async function POST(request: NextRequest) {
  const supabase = createClient()

  try {
    // Check admin authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'system_admin'].includes(profile.role)) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { assignments } = body

    if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Assignments array is required' },
        { status: 400 }
      )
    }

    // Validate each assignment
    for (const assignment of assignments) {
      if (!assignment.user_id || !assignment.site_id) {
        return NextResponse.json(
          { success: false, error: 'Each assignment must have user_id and site_id' },
          { status: 400 }
        )
      }
    }

    // Check for existing active assignments to prevent duplicates
    const existingAssignments = await Promise.all(
      assignments.map(async (assignment) => {
        const { data } = await supabase
          .from('unified_user_assignments')
          .select('id')
          .eq('user_id', assignment.user_id)
          .eq('site_id', assignment.site_id)
          .eq('is_active', true)
          .single()
        
        return { 
          user_id: assignment.user_id, 
          site_id: assignment.site_id, 
          exists: !!data 
        }
      })
    )

    const duplicates = existingAssignments.filter(item => item.exists)
    if (duplicates.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `${duplicates.length} user(s) are already assigned to the selected site` 
        },
        { status: 409 }
      )
    }

    // Prepare assignments data
    const assignmentsData = assignments.map(assignment => ({
      user_id: assignment.user_id,
      site_id: assignment.site_id,
      assignment_type: assignment.assignment_type || 'permanent',
      role: assignment.role || 'worker',
      notes: assignment.notes || null,
      is_active: true,
      assigned_by: user.id,
      assigned_date: new Date().toISOString()
    }))

    // Insert all assignments
    const { data: newAssignments, error } = await supabase
      .from('unified_user_assignments')
      .insert(assignmentsData)
      .select(`
        id,
        user_id,
        site_id,
        assignment_type,
        role,
        assigned_date,
        user:profiles!unified_user_assignments_user_id_fkey(
          full_name,
          email
        ),
        site:sites!unified_user_assignments_site_id_fkey(
          name,
          address
        )
      `)

    if (error) {
      console.error('Failed to create bulk assignments:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create user assignments' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: newAssignments,
      message: `${assignments.length} user assignments created successfully`
    })

  } catch (error) {
    console.error('Bulk assignment creation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create bulk assignments' },
      { status: 500 }
    )
  }
}