import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { SiteInfo } from '@/types/site-info'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/sites/current
 * Returns the current site for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch user's current site assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('site_assignments')
      .select(`
        site:sites(
          id,
          name,
          address,
          accommodation_name,
          accommodation_address,
          construction_manager_phone,
          safety_manager_phone,
          start_date,
          end_date,
          status
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (assignmentError) {
      if (assignmentError.code === 'PGRST116') {
        // No assignment found
        return NextResponse.json(
          { error: 'No site assignment found' },
          { status: 404 }
        )
      }
      throw assignmentError
    }

    if (!assignment?.site) {
      return NextResponse.json(
        { error: 'No site found' },
        { status: 404 }
      )
    }

    const site = assignment.site as unknown

    // Fetch latest daily report for process info
    const { data: latestReport } = await supabase
      .from('daily_reports')
      .select('member_name, work_process, work_section')
      .eq('site_id', site.id)
      .order('work_date', { ascending: false })
      .limit(1)
      .single()

    // Create process info
    const processInfo = latestReport ? {
      member_name: (latestReport as unknown).member_name || '미정',
      work_process: (latestReport as unknown).work_process || '미정',
      work_section: (latestReport as unknown).work_section || '미정',
      drawing_id: undefined
    } : {
      member_name: '미정',
      work_process: '미정',
      work_section: '미정',
      drawing_id: undefined
    }

    // Create manager contacts array (using phone numbers only)
    const managers = []
    if (site.construction_manager_phone) {
      managers.push({
        role: 'construction_manager' as const,
        name: '현장 소장',
        phone: site.construction_manager_phone
      })
    }
    if (site.safety_manager_phone) {
      managers.push({
        role: 'safety_manager' as const,
        name: '안전 관리자',
        phone: site.safety_manager_phone
      })
    }

    // Construct SiteInfo object
    const siteData: SiteInfo = {
      id: site.id,
      name: site.name,
      address: {
        id: site.id,
        site_id: site.id,
        full_address: site.address || '주소 정보 없음',
        latitude: undefined,
        longitude: undefined,
        postal_code: undefined
      },
      accommodation: site.accommodation_address ? {
        id: site.id,
        site_id: site.id,
        accommodation_name: site.accommodation_name || '숙소',
        full_address: site.accommodation_address,
        latitude: undefined,
        longitude: undefined
      } : undefined,
      process: processInfo,
      managers,
      construction_period: {
        start_date: site.start_date,
        end_date: site.end_date
      },
      is_active: site.status === 'active'
    }

    return NextResponse.json({ data: siteData })
  } catch (error) {
    console.error('Error fetching current site:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}