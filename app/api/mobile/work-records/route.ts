import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const serviceClient = createServiceRoleClient()
    const { searchParams } = new URL(request.url)

    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const siteId = searchParams.get('site_id')
    const limitParam = parseInt(searchParams.get('limit') ?? '0', 10)
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 1000) : 1000

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
          sites:sites(id, name, address),
          profiles:profiles!work_records_profile_id_fkey(id, full_name)
        `
      )
      .order('work_date', { ascending: true })
      .order('check_in_time', { ascending: true })
      .limit(limit)

    // Return only the authenticated user's records (user_id or profile_id)
    const targetUserId = authResult.userId
    query = query.or(`user_id.eq.${targetUserId},profile_id.eq.${targetUserId}`)

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
