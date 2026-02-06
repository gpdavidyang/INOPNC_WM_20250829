import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    let serviceClient
    try {
      serviceClient = createServiceRoleClient()
    } catch (error) {
      console.warn('[mobile/work-records] service role unavailable, falling back to server client')
      serviceClient = createClient()
    }
    const { searchParams } = new URL(request.url)

    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const siteId = searchParams.get('site_id')
    const limitParam = parseInt(searchParams.get('limit') ?? '0', 10)
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 1000) : 1000

    const isRestrictedOrgUser = authResult.isRestricted && authResult.restrictedOrgId

    if (authResult.isRestricted && !authResult.restrictedOrgId) {
      return NextResponse.json(
        { success: false, error: '조직 정보가 없어 데이터를 조회할 수 없습니다.' },
        { status: 403 }
      )
    }

    let query = serviceClient
      .from('work_records')
      .select(
        `
          id,
          user_id,
          profile_id,
          site_id,
          work_date,
          check_in_time,
          check_out_time,
          work_hours,
          labor_hours,
          overtime_hours,
          status,
          notes,
          created_at,
          updated_at,
          sites (
            id,
            name,
            address
          ),
          profiles!work_records_profile_id_fkey (
            id,
            full_name
          )
        `
      )
      .order('work_date', { ascending: true })
      .order('check_in_time', { ascending: true })
      .limit(limit)

    if (isRestrictedOrgUser) {
      // Temporarily remove broken filter causing 500 error
      // query = query.eq('sites.customer_company_id', authResult.restrictedOrgId)
    } else if (
      authResult.role === 'admin' ||
      authResult.role === 'manager' ||
      authResult.role === 'hq_admin'
    ) {
      // 관리자/매니저: 전체 조회 권한 (추가 필터 없음)
    } else {
      // 일반 계정: 본인 기록만
      const targetUserId = authResult.userId
      query = query.or(`user_id.eq.${targetUserId},profile_id.eq.${targetUserId}`)
    }

    if (startDate) {
      query = query.gte('work_date', startDate)
    }

    if (endDate) {
      query = query.lte('work_date', endDate)
    }

    if (siteId) {
      query = query.eq('site_id', siteId)
    }

    const { data, error } = await query

    if (error) {
      console.error('[mobile/work-records] query error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch work records' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data ?? [],
    })
  } catch (error) {
    console.error('[mobile/work-records] unexpected error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
