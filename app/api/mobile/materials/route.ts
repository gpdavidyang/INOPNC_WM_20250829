import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const ALLOWED_ROLES = new Set([
  'worker',
  'site_manager',
  'admin',
  'system_admin',
  'customer_manager',
  'partner',
])

export async function GET() {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const supabase = createClient()
    let role = auth.role || ''

    if (!role) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', auth.userId)
        .maybeSingle()

      if (profileError) {
        console.error('[mobile/materials] profile lookup error:', profileError)
        return NextResponse.json(
          { success: false, error: '권한 확인에 실패했습니다.' },
          { status: 500 }
        )
      }
      role = profile?.role || ''
    }

    if (role && !ALLOWED_ROLES.has(role)) {
      return NextResponse.json({ success: false, error: '접근 권한이 없습니다.' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('materials')
      .select('id, name, code, unit, specification, is_active')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) {
      console.error('[mobile/materials] fetch error:', error)
      return NextResponse.json(
        { success: false, error: '자재 목록을 불러오지 못했습니다.' },
        { status: 500 }
      )
    }

    const materials = (data || []).map(item => ({
      id: String(item.id),
      name: item.name ?? '',
      code: item.code ?? null,
      unit: item.unit ?? null,
      specification: item.specification ?? null,
    }))

    return NextResponse.json({ success: true, data: materials })
  } catch (error) {
    if ((error as any)?.name === 'AbortError') {
      return NextResponse.json({ success: false, error: '요청이 취소되었습니다.' }, { status: 499 })
    }
    console.error('[mobile/materials] unexpected error:', error)
    return NextResponse.json(
      { success: false, error: '자재 목록을 불러오지 못했습니다.' },
      { status: 500 }
    )
  }
}
