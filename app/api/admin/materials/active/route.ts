import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createServiceRoleClient()
    const { data, error } = await supabase
      .from('materials')
      .select('id, name, code, unit, is_active, use_yn, use_flag, status, is_deleted')
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
