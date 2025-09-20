import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'

// DELETE: Remove user assignment (unassign)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    if (!['admin', 'system_admin'].includes(authResult.role ?? '')) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    const supabase = createClient()
    const assignmentId = params.id

    // Check if assignment exists
    const { data: assignment, error: fetchError } = await supabase
      .from('unified_user_assignments')
      .select('id, user_id, site_id, is_active')
      .eq('id', assignmentId)
      .single()

    if (fetchError || !assignment) {
      return NextResponse.json(
        { success: false, error: 'Assignment not found' },
        { status: 404 }
      )
    }

    if (!assignment.is_active) {
      return NextResponse.json(
        { success: false, error: 'Assignment is already inactive' },
        { status: 400 }
      )
    }

    // Update assignment to inactive (soft delete)
    const { error: updateError } = await supabase
      .from('unified_user_assignments')
      .update({
        is_active: false,
        unassigned_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', assignmentId)

    if (updateError) {
      console.error('Failed to unassign user:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to unassign user' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User assignment removed successfully'
    })

  } catch (error) {
    console.error('Assignment deletion error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to remove assignment' },
      { status: 500 }
    )
  }
}

// PUT: Update user assignment
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    if (!['admin', 'system_admin'].includes(authResult.role ?? '')) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    const supabase = createClient()
    const assignmentId = params.id

    const body = await request.json()
    const { assignment_type, role, notes, is_active } = body

    // Check if assignment exists
    const { data: assignment, error: fetchError } = await supabase
      .from('unified_user_assignments')
      .select('id')
      .eq('id', assignmentId)
      .single()

    if (fetchError || !assignment) {
      return NextResponse.json(
        { success: false, error: 'Assignment not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: unknown = {
      updated_at: new Date().toISOString()
    }

    if (assignment_type !== undefined) updateData.assignment_type = assignment_type
    if (role !== undefined) updateData.role = role
    if (notes !== undefined) updateData.notes = notes
    if (is_active !== undefined) {
      updateData.is_active = is_active
      if (!is_active) {
        updateData.unassigned_date = new Date().toISOString()
      } else {
        updateData.unassigned_date = null
      }
    }

    // Update assignment
    const { data: updatedAssignment, error: updateError } = await supabase
      .from('unified_user_assignments')
      .update(updateData)
      .eq('id', assignmentId)
      .select(`
        id,
        user_id,
        site_id,
        assignment_type,
        role,
        assigned_date,
        unassigned_date,
        is_active,
        notes,
        user:profiles!unified_user_assignments_user_id_fkey(
          full_name,
          email
        ),
        site:sites!unified_user_assignments_site_id_fkey(
          name,
          address
        )
      `)
      .single()

    if (updateError) {
      console.error('Failed to update assignment:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update assignment' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedAssignment,
      message: 'Assignment updated successfully'
    })

  } catch (error) {
    console.error('Assignment update error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update assignment' },
      { status: 500 }
    )
  }
}
