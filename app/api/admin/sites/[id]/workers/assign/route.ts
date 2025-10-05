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

    // Allow broader roles and verify site access for non-admin
    const allowedRoles = ['admin', 'system_admin', 'site_manager']
    if (!allowedRoles.includes(authResult.role || '')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Prefer service client to avoid RLS issues; fallback to session client
    const supabase = (() => {
      try {
        return createServiceClient()
      } catch {
        return createClient()
      }
    })()

    const siteId = params.id
    const { worker_ids, trade, position, role: roleOverride, role_override } = await request.json()

    if (!worker_ids || !Array.isArray(worker_ids) || worker_ids.length === 0) {
      return NextResponse.json({ error: 'Invalid worker IDs' }, { status: 400 })
    }

    // Validate UUID format (best-effort) and de-duplicate
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    const uniqueIds = Array.from(new Set(worker_ids.map((x: unknown) => String(x || '').trim())))
    const validIds = uniqueIds.filter(id => uuidRe.test(id))
    if (validIds.length === 0) {
      return NextResponse.json(
        { error: 'No valid user IDs', details: 'Expected UUID strings in worker_ids' },
        { status: 400 }
      )
    }

    // Get the actual roles of the workers from profiles
    console.log('Fetching profiles for worker IDs:', worker_ids)
    const { data: workerProfiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .in('id', validIds)

    console.log('Worker profiles query result:', {
      data: workerProfiles,
      error: profileError,
      count: workerProfiles?.length,
    })

    if (profileError) {
      console.error('Error fetching worker profiles:', profileError)
      console.error('Profile query details:', {
        worker_ids,
        error_message: profileError.message,
        error_code: profileError.code,
        error_details: profileError.details,
      })
      return NextResponse.json(
        {
          error: 'Failed to fetch worker profiles',
          details: profileError.message,
        },
        { status: 500 }
      )
    }

    // Create assignments for each worker with their actual role
    // Filter out already-active assignments to avoid duplicate key/constraint errors
    const { data: existing } = await supabase
      .from('site_assignments')
      .select('user_id')
      .eq('site_id', siteId)
      .eq('is_active', true)
      .in('user_id', validIds)

    const existingSet = new Set((existing || []).map((r: any) => r.user_id))

    const toInsert = validIds.filter(id => !existingSet.has(id))

    if (toInsert.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: '모든 사용자가 이미 배정되어 있습니다.',
        skipped: validIds.length,
      })
    }

    const assignments = toInsert.map(workerId => {
      const workerProfile = workerProfiles?.find((p: unknown) => p.id === workerId)
      // Map the user's role to a valid site assignment role
      const desiredRole = (roleOverride || role_override) as string | undefined
      const normalizedDesired =
        desiredRole && ['worker', 'site_manager', 'supervisor'].includes(desiredRole)
          ? desiredRole
          : undefined
      let assignmentRole = normalizedDesired || 'worker'
      if (!normalizedDesired) {
        if (workerProfile?.role === 'site_manager') {
          assignmentRole = 'site_manager'
        } else if (workerProfile?.role === 'supervisor') {
          assignmentRole = 'supervisor'
        }
      }
      // All other roles (admin, worker, partner, etc.) default to 'worker' role in site_assignments

      return {
        site_id: siteId,
        user_id: workerId,
        assigned_date: new Date().toISOString().split('T')[0], // Date only format
        role: assignmentRole, // Use mapped role that's valid for site_assignments
        is_active: true,
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
      count: insertedAssignments?.length,
    })

    if (insertError) {
      console.error('Error assigning workers:', insertError)
      console.error('Assignments data:', assignments)
      console.error('Insert error details:', {
        error_message: insertError.message,
        error_code: insertError.code,
        error_details: insertError.details,
        error_hint: insertError.hint,
      })
      return NextResponse.json(
        {
          error: 'Failed to assign workers',
          details: insertError.message,
          code: insertError.code,
        },
        { status: 500 }
      )
    }

    // Log the assignment activity (optional - don't fail if this errors)
    try {
      await supabase.from('activity_logs').insert({
        user_id: authResult.userId,
        action: 'workers_assigned',
        entity_type: 'site',
        entity_id: siteId,
        details: {
          worker_count: worker_ids.length,
          worker_ids: worker_ids,
        },
      })
    } catch (logError) {
      console.warn('Failed to log activity:', logError)
      // Continue even if logging fails
    }

    return NextResponse.json({
      success: true,
      data: insertedAssignments,
      count: insertedAssignments?.length || 0,
      skipped: validIds.length - (insertedAssignments?.length || 0),
      message: `${insertedAssignments?.length || 0}명의 작업자가 현장에 배정되었습니다.`,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: (error as any)?.message },
      { status: 500 }
    )
  }
}
