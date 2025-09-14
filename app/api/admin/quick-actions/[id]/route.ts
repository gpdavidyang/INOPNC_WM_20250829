import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'


export const dynamic = 'force-dynamic'

// GET /api/admin/quick-actions/[id] - 특정 빠른 작업 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const user = await getAuthenticatedUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 관리자 권한 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'system_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: quickAction, error } = await supabase
      .from('quick_actions')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !quickAction) {
      return NextResponse.json({ error: 'Quick action not found' }, { status: 404 })
    }

    return NextResponse.json({ quickAction })
  } catch (error) {
    console.error('Quick action fetch API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/admin/quick-actions/[id] - 빠른 작업 업데이트
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const user = await getAuthenticatedUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 관리자 권한 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'system_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, icon_name, link_url, is_active, display_order } = body

    // 입력 데이터 검증
    if (!title || !icon_name || !link_url) {
      return NextResponse.json({ 
        error: 'Title, icon name, and link URL are required' 
      }, { status: 400 })
    }

    const { data: quickAction, error } = await supabase
      .from('quick_actions')
      .update({
        title,
        description,
        icon_name,
        link_url,
        is_active,
        display_order
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error || !quickAction) {
      console.error('Quick action update error:', error)
      return NextResponse.json({ error: 'Failed to update quick action' }, { status: 500 })
    }

    return NextResponse.json({ quickAction })
  } catch (error) {
    console.error('Quick action update API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/quick-actions/[id] - 빠른 작업 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const user = await getAuthenticatedUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 관리자 권한 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'system_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase
      .from('quick_actions')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Quick action deletion error:', error)
      return NextResponse.json({ error: 'Failed to delete quick action' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Quick action deleted successfully' })
  } catch (error) {
    console.error('Quick action deletion API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
