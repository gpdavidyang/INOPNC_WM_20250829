import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'


export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    // Check authentication and admin role with timeout
    let user = null
    let authError = null
    
    try {
      // Add timeout for auth check to prevent hanging
      const authPromise = supabase.auth.getUser()
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Auth timeout')), 10000) // 10 second timeout
      })
      
      const authResult = await Promise.race([authPromise, timeoutPromise]) as unknown
      user = authResult.data?.user
      authError = authResult.error
    } catch (error) {
      console.error('Auth check failed or timed out:', error)
      authError = error
    }
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user role - allow admin, site_manager, and worker
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'site_manager', 'worker'].includes(profile.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // For non-admin users, verify they have access to this site
    if (profile.role !== 'admin') {
      // Get user's profile to check site_id
      const { data: userProfile, error: profileFetchError } = await supabase
        .from('profiles')
        .select('site_id')
        .eq('id', user.id)
        .single()

      // Check access through site_assignments OR direct site assignment
      const { data: siteAccess } = await supabase
        .from('site_assignments')
        .select('id')
        .eq('site_id', params.id)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      // Site manager can access if they are assigned via site_assignments OR if their profile.site_id matches
      const hasDirectSiteAccess = userProfile?.site_id === params.id && profile.role === 'site_manager'
      const hasSiteAssignment = !!siteAccess

      if (!hasDirectSiteAccess && !hasSiteAssignment) {
        console.log(`Access denied for user ${user.id}: site_id=${userProfile?.site_id}, target=${params.id}, role=${profile.role}, assignment=${!!siteAccess}`)
        return NextResponse.json({ error: 'Site access denied' }, { status: 403 })
      }
    }

    const siteId = params.id

    // Get workers assigned to this site
    const { data: assignments, error: assignmentsError } = await supabase
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

    // Log for debugging if needed
    if (process.env.NODE_ENV === 'development') {
      console.log(`Fetched ${assignments?.length || 0} assignments for site ${siteId}`)
    }

    if (assignmentsError) {
      console.error('Error fetching site workers:', assignmentsError)
      return NextResponse.json({ error: 'Failed to fetch site workers' }, { status: 500 })
    }

    // Get worker details from profiles table
    const workerIds = assignments?.map((a: unknown) => a.user_id) || []
    let workers = []
    
    
    if (workerIds.length > 0) {
      const { data: userDetails, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, role, company')
        .in('id', workerIds)
      
      if (process.env.NODE_ENV === 'development' && profilesError) {
        console.error('Error fetching user profiles:', profilesError)
      }
      
      // Remove duplicates and prioritize higher-level roles
      const workerMap = new Map()
      
      assignments?.forEach((assignment: unknown) => {
        const user = userDetails?.find((u: unknown) => u.id === assignment.user_id)
        const finalRole = user?.role || assignment.role || 'worker'
        
        
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
