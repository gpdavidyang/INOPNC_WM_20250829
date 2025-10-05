import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    if (authResult.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Prefer service client to bypass RLS for admin ops; fallback to session client
    const supabase = (() => {
      try {
        return createServiceClient()
      } catch {
        return createClient()
      }
    })()

    const siteId = params.id
    const { worker_id } = await request.json()

    if (!worker_id) {
      return NextResponse.json({ error: 'Worker ID is required' }, { status: 400 })
    }

    // Soft delete the assignment by setting is_active to false
    const { data: updatedAssignment, error: updateError } = await supabase
      .from('site_assignments')
      .update({
        is_active: false,
        unassigned_date: new Date().toISOString().split('T')[0],
      })
      .eq('site_id', siteId)
      .eq('user_id', worker_id)
      .eq('is_active', true)
      .select()
      .maybeSingle()

    if (updateError) {
      console.error('Error unassigning worker:', updateError)
      console.error('Update params:', { siteId, worker_id })
      return NextResponse.json(
        {
          error: 'Failed to unassign worker',
          details: updateError.message,
        },
        { status: 500 }
      )
    }

    if (!updatedAssignment) {
      return NextResponse.json({ error: 'Worker assignment not found' }, { status: 404 })
    }

    // Log the unassignment activity (optional - don't fail if this errors)
    try {
      await supabase.from('activity_logs').insert({
        user_id: authResult.userId,
        action: 'worker_unassigned',
        entity_type: 'site',
        entity_id: siteId,
        details: {
          worker_id: worker_id,
          assignment_id: updatedAssignment.id,
        },
      })
    } catch (logError) {
      console.warn('Failed to log activity:', logError)
      // Continue even if logging fails
    }

    return NextResponse.json({
      success: true,
      data: updatedAssignment,
      message: '작업자가 현장에서 제외되었습니다.',
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
