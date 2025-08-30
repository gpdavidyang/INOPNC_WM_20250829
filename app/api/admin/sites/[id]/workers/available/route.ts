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

    // Get all workers that are not assigned to this site
    let query = supabase
      .from('profiles')
      .select('id, full_name, email, phone, role, company')
      .in('role', ['worker', 'supervisor', 'safety_officer'])
      .order('full_name')

    // Exclude already assigned workers
    if (assignedUserIds.length > 0) {
      query = query.not('id', 'in', `(${assignedUserIds.join(',')})`)
    }

    const { data: availableWorkers, error: workersError } = await query

    if (workersError) {
      console.error('Error fetching available workers:', workersError)
      return NextResponse.json({ error: 'Failed to fetch available workers' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: availableWorkers || [],
      total: availableWorkers?.length || 0,
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