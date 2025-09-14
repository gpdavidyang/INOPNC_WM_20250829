import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET: List user assignments
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || 'active'

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

    // Build query based on status filter
    let query = supabase
      .from('unified_user_assignments')
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
          id,
          full_name,
          email,
          role,
          phone,
          partner_company:partner_companies!profiles_partner_company_id_fkey(
            id,
            company_name
          )
        ),
        site:sites!unified_user_assignments_site_id_fkey(
          id,
          name,
          address,
          status,
          manager_name
        )
      `)

    if (status === 'active') {
      query = query.eq('is_active', true)
    } else if (status === 'inactive') {
      query = query.eq('is_active', false)
    }
    // 'all' status shows everything

    query = query.order('assigned_date', { ascending: false })

    const { data: assignments, error } = await query

    if (error) {
      console.error('Failed to fetch assignments:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to load user assignments' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: assignments || []
    })

  } catch (error) {
    console.error('Assignments fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load assignments data' },
      { status: 500 }
    )
  }
}

// POST: Create new user assignment
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
    const { user_id, site_id, assignment_type, role, notes } = body

    // Validate required fields
    if (!user_id || !site_id) {
      return NextResponse.json(
        { success: false, error: 'User and site are required' },
        { status: 400 }
      )
    }

    // Check if user is already assigned to this site
    const { data: existingAssignment } = await supabase
      .from('unified_user_assignments')
      .select('id')
      .eq('user_id', user_id)
      .eq('site_id', site_id)
      .eq('is_active', true)
      .single()

    if (existingAssignment) {
      return NextResponse.json(
        { success: false, error: 'User is already assigned to this site' },
        { status: 409 }
      )
    }

    // Create new assignment
    const { data: newAssignment, error } = await supabase
      .from('unified_user_assignments')
      .insert({
        user_id,
        site_id,
        assignment_type: assignment_type || 'permanent',
        role: role || 'worker',
        notes: notes || null,
        is_active: true,
        assigned_by: user.id,
        assigned_date: new Date().toISOString()
      })
      .select(`
        id,
        user_id,
        site_id,
        assignment_type,
        role,
        assigned_date,
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

    if (error) {
      console.error('Failed to create assignment:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create user assignment' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: newAssignment,
      message: 'User assignment created successfully'
    })

  } catch (error) {
    console.error('Assignment creation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create assignment' },
      { status: 500 }
    )
  }
}