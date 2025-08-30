import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
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

    // Get all workers not assigned to this site
    // First, get IDs of workers already assigned to this site
    const { data: assignedWorkers } = await supabase
      .from('site_workers')
      .select('user_id')
      .eq('site_id', siteId)
      .eq('is_active', true)

    const assignedUserIds = assignedWorkers?.map(w => w.user_id) || []

    // First try to get from users table (which seems to have more data)
    let query = supabase
      .from('users')
      .select('id, name, email, phone, role, department')
      .in('role', ['worker', 'supervisor', 'safety_officer', '작업자', '감독자', '안전관리자', '현장관리자'])
      .order('name')

    // Exclude already assigned workers
    if (assignedUserIds.length > 0) {
      query = query.not('id', 'in', `(${assignedUserIds.join(',')})`)
    }

    const { data: availableWorkers, error: workersError } = await query

    // Map the data to expected format
    const formattedWorkers = availableWorkers?.map(worker => ({
      id: worker.id,
      full_name: worker.name,
      email: worker.email,
      phone: worker.phone,
      role: worker.role,
      company: worker.department
    })) || []

    if (workersError) {
      console.error('Error fetching available workers:', workersError)
      return NextResponse.json({ error: 'Failed to fetch available workers' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: formattedWorkers,
      total: formattedWorkers.length,
      site_id: siteId
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}