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

    // Verify user role - allow admin, site_manager, and worker
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'site_manager', 'worker'].includes(profile.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // For non-admin users, verify they have access to this site
    if (profile.role !== 'admin') {
      const { data: siteAccess } = await supabase
        .from('site_assignments')
        .select('id')
        .eq('site_id', params.id)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      if (!siteAccess) {
        return NextResponse.json({ error: 'Site access denied' }, { status: 403 })
      }
    }

    const siteId = params.id
    console.log(`DEBUG: Fetching workers for site ID: ${siteId}`)

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

    console.log(`DEBUG: Site assignments query result:`, { 
      assignmentsCount: assignments?.length || 0, 
      assignments: assignments,
      error: assignmentsError 
    })

    if (assignmentsError) {
      console.error('Error fetching site workers:', assignmentsError)
      return NextResponse.json({ error: 'Failed to fetch site workers' }, { status: 500 })
    }

    // Get worker details from profiles table
    const workerIds = assignments?.map(a => a.user_id) || []
    let workers = []
    
    console.log(`DEBUG: Worker IDs to fetch: ${JSON.stringify(workerIds)}`)
    
    if (workerIds.length > 0) {
      const { data: userDetails, error: profilesError } = await serviceClient
        .from('profiles')
        .select('id, full_name, email, phone, role, company')
        .in('id', workerIds)
      
      console.log(`DEBUG: Profiles query result:`, { 
        profilesCount: userDetails?.length || 0, 
        profiles: userDetails,
        error: profilesError 
      })
      
      // Remove duplicates and prioritize higher-level roles
      const workerMap = new Map()
      
      assignments?.forEach(assignment => {
        const user = userDetails?.find(u => u.id === assignment.user_id)
        const finalRole = user?.role || assignment.role || 'worker'
        
        console.log(`DEBUG: Processing assignment for user ${assignment.user_id}:`, {
          assignmentRole: assignment.role,
          profileRole: user?.role,
          finalRole,
          userName: user?.full_name
        })
        
        const existingWorker = workerMap.get(assignment.user_id)
        
        // Role priority: admin > site_manager > worker
        const rolePriority = (role: string) => {
          switch(role) {
            case 'admin': return 3
            case 'site_manager': return 2
            case 'worker': return 1
            default: return 0
          }
        }
        
        const worker = {
          id: assignment.user_id,
          full_name: user?.full_name || 'Unknown',
          email: user?.email || '',
          phone: user?.phone || '',
          role: finalRole,
          company: user?.company || '',
          trade: '', // site_assignments doesn't have trade info
          position: '', // site_assignments doesn't have position info
          assigned_at: assignment.assigned_date,
          assignment_id: assignment.id
        }
        
        // Only add if this is a new user or if they have a higher priority role
        if (!existingWorker || rolePriority(finalRole) > rolePriority(existingWorker.role)) {
          workerMap.set(assignment.user_id, worker)
        }
      })
      
      workers = Array.from(workerMap.values())
    }

    console.log(`DEBUG: Final workers array:`, { 
      workersCount: workers.length, 
      workers: workers.map(w => ({ id: w.id, name: w.full_name, role: w.role }))
    })

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