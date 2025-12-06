import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'

const ADMIN_ROLES = new Set(['admin', 'system_admin'])

export async function GET() {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const normalizedRole = (auth.role || '').toLowerCase()
    if (!ADMIN_ROLES.has(normalizedRole)) {
      return NextResponse.json({ success: false, error: '접근 권한이 없습니다.' }, { status: 403 })
    }

    let supabase
    try {
      supabase = createServiceRoleClient()
    } catch (error) {
      console.warn(
        '[admin/materials/active] service role unavailable, falling back to session client'
      )
      supabase = createClient()
    }

    const { data, error } = await supabase
      .from('materials')
      .select('id, name, code, unit, is_active, status, is_deleted')
      .order('name', { ascending: true })

    if (error) {
      console.error('[admin/materials/active] fetch error:', error)
      return NextResponse.json(
        { success: false, error: '자재 목록을 불러오지 못했습니다.' },
        { status: 500 }
      )
    }

    const list = (data || []).filter(item => {
      if (typeof item?.is_deleted === 'boolean' && item.is_deleted) return false
      return item
    })

    return NextResponse.json({ success: true, data: list })
  } catch (e) {
    console.error('[admin/materials/active] unexpected error:', e)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
