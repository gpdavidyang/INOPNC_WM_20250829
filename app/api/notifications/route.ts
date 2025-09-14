
// GET /api/notifications - 알림 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const supabase = createClient()
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 사용자 프로필 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // 쿼리 파라미터
    const type = searchParams.get('type')
    const unreadOnly = searchParams.get('unread_only') === 'true'
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // 기본 쿼리 - 사용자별 알림 + 전체 공지
    let query = supabase
      .from('notifications')
      .select('*')
      .or(`user_id.is.null,user_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    // 타입 필터
    if (type && type !== 'all') {
      query = query.eq('type', type)
    }

    // 읽지 않은 알림만
    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    // 페이지네이션
    if (limit > 0) {
      query = query.range(offset, offset + limit - 1)
    }

    const { data: notifications, error } = await query

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
    }

    // 관리자인 경우 모든 알림 통계 추가
    let adminStats = null
    if (profile.role === 'admin') {
      const { data: allNotifications } = await supabase
        .from('notifications')
        .select('type, is_read, created_at')

      if (allNotifications) {
        adminStats = {
          total: allNotifications.length,
          unread: allNotifications.filter((n: unknown) => !n.is_read).length,
          byType: allNotifications.reduce((acc: unknown, n: unknown) => {
            acc[n.type] = (acc[n.type] || 0) + 1
            return acc
          }, {}),
          recent: allNotifications.filter((n: unknown) => 
            new Date().getTime() - new Date(n.created_at).getTime() < 24 * 60 * 60 * 1000
          ).length
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: notifications || [],
      stats: adminStats,
      user: {
        id: profile.id,
        role: profile.role
      }
    })

  } catch (error) {
    console.error('Notifications API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/notifications - 새 알림 생성 (관리자 전용)
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 사용자 프로필 및 권한 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // 관리자만 알림 생성 가능
    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Only administrators can create notifications' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      title, 
      message, 
      type = 'info', 
      target_user_id = null, 
      target_role = null,
      action_url = null,
      priority = 'medium'
    } = body

    // 필수 필드 검증
    if (!title || !message) {
      return NextResponse.json({ 
        error: 'Title and message are required' 
      }, { status: 400 })
    }

    // 대상 사용자 결정
    let targetUsers = []
    
    if (target_user_id) {
      // 특정 사용자
      targetUsers = [{ user_id: target_user_id }]
    } else if (target_role) {
      // 특정 역할의 모든 사용자
      const { data: roleUsers } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', target_role)
      
      targetUsers = roleUsers?.map((u: unknown) => ({ user_id: u.id })) || []
    } else {
      // 전체 공지 (user_id = null)
      targetUsers = [{ user_id: null }]
    }

    // 알림 생성
    const notifications = targetUsers.map((target: unknown) => ({
      title,
      message,
      type,
      user_id: target.user_id,
      action_url,
      is_read: false,
      created_at: new Date().toISOString()
    }))

    const { data, error } = await supabase
      .from('notifications')
      .insert(notifications)
      .select()

    if (error) {
      console.error('Error creating notification:', error)
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data,
      message: `${notifications.length}개의 알림이 생성되었습니다`
    })

  } catch (error) {
    console.error('Create notification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/notifications - 알림 일괄 삭제
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { notificationIds, deleteAll } = await request.json()

    let result
    if (deleteAll) {
      // 자신의 모든 알림 삭제
      result = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // 특정 알림들 삭제
      result = await supabase
        .from('notifications')
        .delete()
        .in('id', notificationIds)
        .eq('user_id', user.id) // 자신의 알림만 삭제 가능
    } else {
      return NextResponse.json({ 
        error: 'Invalid request parameters' 
      }, { status: 400 })
    }

    if (result.error) {
      console.error('Error deleting notifications:', result.error)
      return NextResponse.json({ error: 'Failed to delete notifications' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Notifications deleted successfully'
    })

  } catch (error) {
    console.error('Delete notifications error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}