import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
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

    // Get total users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .not('role', 'eq', 'system_admin')

    // Get assigned users (users with active assignments)
    const { data: assignedUsersData } = await supabase
      .from('unified_user_assignments')
      .select('user_id', { count: 'exact' })
      .eq('is_active', true)

    const assignedUserIds = new Set(assignedUsersData?.map((a: any) => a.user_id) || [])
    const assignedUsers = assignedUserIds.size
    const unassignedUsers = (totalUsers || 0) - assignedUsers

    // Get total sites and active sites
    const { count: totalSites } = await supabase
      .from('sites')
      .select('id', { count: 'exact' })

    const { count: activeSites } = await supabase
      .from('sites')
      .select('id', { count: 'exact' })
      .eq('status', 'active')

    // Get total partners
    const { count: totalPartners } = await supabase
      .from('partner_companies')
      .select('id', { count: 'exact' })

    // Get partner-site mappings
    const { count: partnerSiteMappings } = await supabase
      .from('partner_site_mappings')
      .select('id', { count: 'exact' })
      .eq('is_active', true)

    // Get recent assignments (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const { count: recentAssignments } = await supabase
      .from('unified_user_assignments')
      .select('id', { count: 'exact' })
      .gte('assigned_date', sevenDaysAgo.toISOString())

    const stats = {
      totalUsers: totalUsers || 0,
      assignedUsers,
      unassignedUsers,
      totalSites: totalSites || 0,
      activeSites: activeSites || 0,
      totalPartners: totalPartners || 0,
      partnerSiteMappings: partnerSiteMappings || 0,
      recentAssignments: recentAssignments || 0
    }

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load dashboard statistics' },
      { status: 500 }
    )
  }
}