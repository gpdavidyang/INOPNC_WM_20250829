import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { ADMIN_ASSIGNMENT_ACTIVITY_STUB } from '@/lib/admin/stub-data'

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
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '20')

  try {

    // Get recent assignment activities
    const { data: assignments, error: assignError } = await supabase
      .from('unified_user_assignments')
      .select(`
        id,
        assigned_date,
        unassigned_date,
        is_active,
        assignment_type,
        role,
        user:profiles!unified_user_assignments_user_id_fkey(full_name),
        site:sites!unified_user_assignments_site_id_fkey(name)
      `)
      .order('assigned_date', { ascending: false })
      .limit(limit / 2)

    // Get recent mapping activities
    const { data: mappings, error: mappingError } = await supabase
      .from('partner_site_mappings')
      .select(`
        id,
        created_at,
        is_active,
        partner_company:partner_companies!partner_site_mappings_partner_company_id_fkey(company_name),
        site:sites!partner_site_mappings_site_id_fkey(name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit / 2)

    if (assignError || mappingError) {
      console.error('Activity fetch error:', assignError || mappingError)
      return NextResponse.json(
        { success: false, error: 'Failed to load activity data' },
        { status: 500 }
      )
    }

    // Transform assignment data
    const assignmentActivities = (assignments || []).map((assignment: unknown) => ({
      id: `assignment-${assignment.id}`,
      type: assignment.is_active ? 'assignment' : 'unassignment',
      description: assignment.is_active 
        ? `${assignment.user?.full_name}님이 ${assignment.site?.name} 현장에 배정되었습니다`
        : `${assignment.user?.full_name}님의 ${assignment.site?.name} 현장 배정이 해제되었습니다`,
      timestamp: assignment.unassigned_date || assignment.assigned_date,
      user_name: assignment.user?.full_name,
      site_name: assignment.site?.name
    }))

    // Transform mapping data
    const mappingActivities = (mappings || []).map((mapping: unknown) => ({
      id: `mapping-${mapping.id}`,
      type: 'mapping' as const,
      description: `${mapping.partner_company?.company_name}와 ${mapping.site?.name} 현장이 매핑되었습니다`,
      timestamp: mapping.created_at,
      partner_name: mapping.partner_company?.company_name,
      site_name: mapping.site?.name
    }))

    // Combine and sort activities
    const allActivities = [...assignmentActivities, ...mappingActivities]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)

    return NextResponse.json({
      success: true,
      data: allActivities,
      source: 'supabase',
    })

  } catch (error) {
    console.error('Activity fetch error:', error)
    return NextResponse.json({
      success: true,
      data: ADMIN_ASSIGNMENT_ACTIVITY_STUB,
      source: 'stub',
    })
  }
}
