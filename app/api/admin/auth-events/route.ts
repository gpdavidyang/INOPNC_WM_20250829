export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { requireAdminSession } from '@/lib/auth/admin-session'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminSession(request)
    if (!auth?.isAdmin) {
      return NextResponse.json({ success: false, error: '권한이 없습니다.' }, { status: 403 })
    }

    const client = createServiceRoleClient()
    const { data, error } = await client
      .from('activity_logs')
      .select('created_at, user_email, action, details')
      .eq('entity_type', 'auth')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('[ADMIN][AUTH-EVENTS] Query error:', error)
      return NextResponse.json(
        { success: false, error: '로그를 가져오지 못했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      events: data || [],
    })
  } catch (error) {
    console.error('[ADMIN][AUTH-EVENTS] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: '요청을 처리하지 못했습니다.' },
      { status: 500 }
    )
  }
}
