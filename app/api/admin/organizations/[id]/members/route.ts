import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { updateUser } from '@/app/actions/admin/users'

export const dynamic = 'force-dynamic'

type MemberLite = {
  id: string
  full_name?: string | null
  email?: string | null
  role?: string | null
  organization_id?: string | null
}

function forbidden() {
  return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth
    if (!auth.role || !['admin', 'system_admin'].includes(auth.role)) {
      return forbidden()
    }

    const search = new URL(request.url).searchParams.get('search')?.trim() || ''
    const supabase = createServiceRoleClient()

    let query = supabase
      .from('profiles')
      .select('id, full_name, email, role, organization_id, status')
      .eq('status', 'active')
      .order('full_name', { ascending: true, nullsFirst: true })
      .limit(50)

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data, error } = await query
    if (error) {
      console.error('[org members] candidate query failed:', error)
      return NextResponse.json(
        { success: false, error: '구성원 후보를 불러오지 못했습니다.' },
        { status: 500 }
      )
    }

    const candidates = (data || [])
      .filter((user: MemberLite) => !user.organization_id || user.organization_id === params.id)
      .map((user: MemberLite) => ({
        id: user.id,
        name: user.full_name || '-',
        email: user.email || '',
        role: user.role || '',
        organization_id: user.organization_id || null,
      }))

    return NextResponse.json({ success: true, candidates })
  } catch (error) {
    console.error('[org members] GET error:', error)
    return NextResponse.json(
      { success: false, error: '구성원 후보를 불러오지 못했습니다.' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth
    if (!auth.role || !['admin', 'system_admin'].includes(auth.role)) {
      return forbidden()
    }

    const body = await request.json().catch(() => null)
    const userId = typeof body?.user_id === 'string' ? body.user_id.trim() : ''
    if (!userId) {
      return NextResponse.json({ success: false, error: 'user_id is required' }, { status: 400 })
    }

    const result = await updateUser({ id: userId, organization_id: params.id })
    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, error: result.error || '구성원을 추가하지 못했습니다.' },
        { status: 400 }
      )
    }

    const user = result.data as any
    return NextResponse.json({
      success: true,
      member: {
        id: user.id,
        name: user.full_name || '-',
        email: user.email || '',
        role: user.role || '',
      },
    })
  } catch (error) {
    console.error('[org members] POST error:', error)
    return NextResponse.json(
      { success: false, error: '구성원을 추가하지 못했습니다.' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth
    if (!auth.role || !['admin', 'system_admin'].includes(auth.role)) {
      return forbidden()
    }

    const userId = new URL(request.url).searchParams.get('user_id')?.trim() || ''
    if (!userId) {
      return NextResponse.json({ success: false, error: 'user_id is required' }, { status: 400 })
    }

    const result = await updateUser({ id: userId, organization_id: null })
    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, error: result.error || '구성원을 제거하지 못했습니다.' },
        { status: 400 }
      )
    }

    const user = result.data as any
    return NextResponse.json({
      success: true,
      member: {
        id: user.id,
        name: user.full_name || '-',
        email: user.email || '',
        role: user.role || '',
      },
    })
  } catch (error) {
    console.error('[org members] DELETE error:', error)
    return NextResponse.json(
      { success: false, error: '구성원을 제거하지 못했습니다.' },
      { status: 500 }
    )
  }
}
