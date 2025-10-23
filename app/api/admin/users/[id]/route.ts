import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { getUserDetail } from '@/lib/api/adapters/user-detail'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const dynamic = 'force-dynamic'

// GET /api/admin/users/:id
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const supabase = createClient()

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', auth.userId)
      .maybeSingle()

    if (!profile || !['admin', 'system_admin'].includes((profile as any).role || '')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const userId = params.id
    const includeInactive = (() => {
      try {
        const sp = new URL(request.url).searchParams
        const v = sp.get('includeInactive')
        return v === '1' || v === 'true'
      } catch {
        return false
      }
    })()
    const user = await getUserDetail(userId, includeInactive)
    if (!user)
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: user })
  } catch (e) {
    console.error('[admin/users/:id] error:', e)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/users/:id
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const adminSupabase = createClient()
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('id, role')
      .eq('id', auth.userId)
      .maybeSingle()

    if (!profile || !['admin', 'system_admin'].includes((profile as any).role || '')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const service = createServiceRoleClient()
    const userId = params.id

    // Block deleting protected admin/system_admin accounts (safety)
    const { data: target, error: targetErr } = await service
      .from('profiles')
      .select('id, role, email, full_name')
      .eq('id', userId)
      .maybeSingle()

    if (targetErr) {
      return NextResponse.json({ success: false, error: '대상 사용자 조회 실패' }, { status: 500 })
    }
    if (!target) {
      return NextResponse.json(
        { success: false, error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (['admin', 'system_admin'].includes(String((target as any).role || ''))) {
      return NextResponse.json(
        { success: false, error: '관리자 계정은 삭제할 수 없습니다.' },
        { status: 400 }
      )
    }

    // Delete profile first
    const { error: profileDeleteError } = await service.from('profiles').delete().eq('id', userId)
    if (profileDeleteError) {
      console.error('[admin/users/:id DELETE] profile delete error:', profileDeleteError)
      return NextResponse.json({ success: false, error: '프로필 삭제 실패' }, { status: 500 })
    }

    // Delete auth user (best-effort)
    try {
      const { error: authDelErr } = await service.auth.admin.deleteUser(userId)
      if (authDelErr) console.warn('[admin/users/:id DELETE] auth delete warn:', authDelErr)
    } catch (e) {
      console.warn('[admin/users/:id DELETE] auth delete exception:', e)
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[admin/users/:id DELETE] error:', e)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
