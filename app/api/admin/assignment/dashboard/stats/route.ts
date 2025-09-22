import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { ADMIN_ASSIGNMENT_STATS_STUB } from '@/lib/admin/stub-data'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const authResult = await requireApiAuth()

  if (authResult instanceof NextResponse) {
    return authResult
  }

  if (!authResult.role || !['admin', 'system_admin'].includes(authResult.role)) {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
  }

  const supabase = createClient()

  try {

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

    const assignedUserIds = new Set(assignedUsersData?.map((a: unknown) => a.user_id) || [])
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
      data: stats,
      source: 'supabase',
    })

  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({
      success: true,
      data: ADMIN_ASSIGNMENT_STATS_STUB,
      source: 'stub',
    })
  }
}
