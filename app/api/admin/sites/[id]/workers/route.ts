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

    // Get workers assigned to this site
    const { data: assignments, error: assignmentsError } = await supabase
      .from('site_workers')
      .select(`
        id,
        user_id,
        site_id,
        assigned_at,
        assigned_by,
        trade,
        position,
        is_active
      `)
      .eq('site_id', siteId)
      .eq('is_active', true)
      .order('assigned_at', { ascending: false })

    if (assignmentsError) {
      console.error('Error fetching site workers:', assignmentsError)
      return NextResponse.json({ error: 'Failed to fetch site workers' }, { status: 500 })
    }

    // Get worker details from users table
    const workerIds = assignments?.map(a => a.user_id) || []
    let workers = []
    
    if (workerIds.length > 0) {
      const { data: userDetails } = await supabase
        .from('users')
        .select('id, name, email, phone, role, department')
        .in('id', workerIds)
      
      workers = assignments?.map(assignment => {
        const user = userDetails?.find(u => u.id === assignment.user_id)
        return {
          id: assignment.user_id,
          full_name: user?.name || 'Unknown',
          email: user?.email || '',
          phone: user?.phone || '',
          role: user?.role || 'worker',
          company: user?.department || '',
          trade: assignment.trade,
          position: assignment.position,
          assigned_at: assignment.assigned_at,
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