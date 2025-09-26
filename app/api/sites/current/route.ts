import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import type { SiteInfo } from '@/types/site-info'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/sites/current
 * Returns the current site for the authenticated user
 */
export async function GET(_request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const supabase = createClient()

    // 1) 현재 활성 배정 조회 (관계 조인 없이 site_id만)
    const { data: assignment, error: assignmentError } = await supabase
      .from('site_assignments')
      .select('site_id')
      .eq('user_id', auth.userId)
      .eq('is_active', true)
      .maybeSingle()

    if (assignmentError) {
      console.error('[sites/current] assignment error:', assignmentError)
      return NextResponse.json({ error: 'Assignment fetch failed' }, { status: 500 })
    }
    if (!assignment?.site_id) {
      return NextResponse.json({ error: 'No site assignment found' }, { status: 404 })
    }

    const siteId = assignment.site_id as string

    // 2) 현장 상세 정보 조회 (단일 쿼리, 조인 없음)
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select(
        'id, name, address, accommodation_name, accommodation_address, construction_manager_phone, safety_manager_phone, start_date, end_date, status'
      )
      .eq('id', siteId)
      .maybeSingle()

    if (siteError) {
      console.error('[sites/current] site error:', siteError)
      return NextResponse.json({ error: 'Site fetch failed' }, { status: 500 })
    }
    if (!site) {
      return NextResponse.json({ error: 'No site found' }, { status: 404 })
    }

    // 3) 최신 작업일지로 공정/구간 간단 정보
    const { data: latestReport } = await supabase
      .from('daily_reports')
      .select('member_name, work_process, work_section')
      .eq('site_id', site.id)
      .order('work_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    const processInfo = latestReport
      ? {
          member_name: (latestReport as any).member_name || '미정',
          work_process: (latestReport as any).work_process || '미정',
          work_section: (latestReport as any).work_section || '미정',
          drawing_id: undefined,
        }
      : {
          member_name: '미정',
          work_process: '미정',
          work_section: '미정',
          drawing_id: undefined,
        }

    const managers = [] as Array<{
      role: 'construction_manager' | 'safety_manager'
      name: string
      phone: string
    }>
    if (site.construction_manager_phone) {
      managers.push({
        role: 'construction_manager',
        name: '현장 소장',
        phone: site.construction_manager_phone,
      })
    }
    if (site.safety_manager_phone) {
      managers.push({
        role: 'safety_manager',
        name: '안전 관리자',
        phone: site.safety_manager_phone,
      })
    }

    const siteData: SiteInfo = {
      id: site.id,
      name: site.name,
      address: {
        id: site.id,
        site_id: site.id,
        full_address: site.address || '주소 정보 없음',
        latitude: undefined,
        longitude: undefined,
        postal_code: undefined,
      },
      accommodation: site.accommodation_address
        ? {
            id: site.id,
            site_id: site.id,
            accommodation_name: site.accommodation_name || '숙소',
            full_address: site.accommodation_address,
            latitude: undefined,
            longitude: undefined,
          }
        : undefined,
      process: processInfo,
      managers,
      construction_period: { start_date: site.start_date, end_date: site.end_date },
      is_active: site.status === 'active',
    }

    return NextResponse.json({ data: siteData })
  } catch (error) {
    console.error('Error fetching current site:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
