import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { createClient } from '@/lib/supabase/server'

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
          sites:sites!inner(id, name, address, customer_company_id),
          profiles:profiles!work_records_profile_id_fkey(id, full_name)
        `
      )
      .order('work_date', { ascending: true })
      .order('check_in_time', { ascending: true })
      .limit(limit)

    if (isRestrictedOrgUser) {
      // Partner/고객사 계정: 해당 조직에 속한 현장 데이터만 조회 (모든 작업자 포함)
      query = query.eq('sites.customer_company_id', authResult.restrictedOrgId)
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
