import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { QuickAction } from '@/types'

export const dynamic = 'force-dynamic'


// GET /api/admin/quick-actions - 빠른 작업 목록 조회
export async function GET() {
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

    const { data: quickActions, error } = await supabase
      .from('quick_actions')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Quick actions fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch quick actions' }, { status: 500 })
    }

    return NextResponse.json({ quickActions })
  } catch (error) {
    console.error('Quick actions API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/quick-actions - 새 빠른 작업 생성
export async function POST(request: NextRequest) {
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
    const { title, description, icon_name, link_url, is_active = true, display_order = 0 } = body

    // 입력 데이터 검증
    if (!title || !icon_name || !link_url) {
      return NextResponse.json({ 
        error: 'Title, icon name, and link URL are required' 
      }, { status: 400 })
    }

    const { data: quickAction, error } = await supabase
      .from('quick_actions')
      .insert({
        title,
        description,
        icon_name,
        link_url,
        is_active,
        display_order,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Quick action creation error:', error)
      return NextResponse.json({ error: 'Failed to create quick action' }, { status: 500 })
    }

    return NextResponse.json({ quickAction }, { status: 201 })
  } catch (error) {
    console.error('Quick action creation API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
