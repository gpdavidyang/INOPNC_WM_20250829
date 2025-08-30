import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
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

    // Create service client for admin operations (bypasses RLS)
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get workers assigned to this site
    const { data: assignments, error: assignmentsError } = await serviceClient
      .from('site_assignments')
      .select(`
        id,
        user_id,
        site_id,
        assigned_date,
        role,
        is_active,
        created_at
      `)
      .eq('site_id', siteId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (assignmentsError) {
      console.error('Error fetching site workers:', assignmentsError)
      return NextResponse.json({ error: 'Failed to fetch site workers' }, { status: 500 })
    }

    // Get worker details from profiles table
    const workerIds = assignments?.map(a => a.user_id) || []
    let workers = []
    
    if (workerIds.length > 0) {
      const { data: userDetails } = await serviceClient
        .from('profiles')
        .select('id, full_name, email, phone, role, company')
        .in('id', workerIds)
      
      workers = assignments?.map(assignment => {
        const user = userDetails?.find(u => u.id === assignment.user_id)
        return {
          id: assignment.user_id,
          full_name: user?.full_name || 'Unknown',
          email: user?.email || '',
          phone: user?.phone || '',
          role: assignment.role || user?.role || 'worker',
          company: user?.company || '',
          trade: '', // site_assignments doesn't have trade info
          position: '', // site_assignments doesn't have position info
          assigned_at: assignment.assigned_date,
          assignment_id: assignment.id
        }
      }) || []
    }

    // Get statistics
    const statistics = {
      total_workers: workers.length,
      by_role: workers.reduce((acc, worker) => {
        const role = worker.role || 'unknown'
        acc[role] = (acc[role] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      by_trade: workers.reduce((acc, worker) => {
        if (worker.trade) {
          acc[worker.trade] = (acc[worker.trade] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>)
    }

    return NextResponse.json({
      success: true,
      data: workers,
      statistics,
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