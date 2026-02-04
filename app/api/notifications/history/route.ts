import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = createClient()

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const notificationType = searchParams.get('type')
    const status = searchParams.get('status')

    // Calculate offset
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('notification_logs')
      .select('*', { count: 'exact' })
      .eq('user_id', authResult.userId)
      .order('sent_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (notificationType) {
      query = query.eq('notification_type', notificationType)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: notifications, error, count } = await query

    if (error) {
      // If table doesn't exist, return sample data to improve UX in empty environments
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        const now = new Date()
        const mk = (minsAgo: number, type: string, title: string, body: string) => ({
          id: crypto.randomUUID(),
          user_id: authResult.userId,
          notification_type: type,
          title,
          body,
          status: 'delivered',
          sent_at: new Date(now.getTime() - minsAgo * 60000).toISOString(),
          read_at: null,
        })
        const samples = [
          mk(2, 'announcement', '공지사항', '시스템 점검 예정: 오늘 밤 11시~12시'),
          mk(8, 'safety_alert', '안전 알림', '강풍 예보, 외부 작업시 안전수칙 준수'),
          mk(15, 'materials', '자재 입고', '철근 자재 입고 완료. 수령 확인 바랍니다.'),
          mk(30, 'schedule', '일정 변경', '주간 회의 내일 오전 9시로 변경'),
          mk(45, 'general', '알림', '신규 문서가 공유되었습니다.'),
        ]
        return NextResponse.json({
          notifications: samples,
          pagination: {
            page,
            limit,
            total: samples.length,
            totalPages: 1,
          },
        })
      }
      throw error
    }

    const notificationIds = (notifications || []).map((n: any) => n.id)
    // Build query for engagement
    let engagements: any[] = []
    try {
      if (notificationIds.length > 0) {
        const { data: engagementData, error: engagementError } = await supabase
          .from('notification_engagement')
          .select('*')
          .in('notification_id', notificationIds)
          .eq('user_id', authResult.userId)

        if (!engagementError) {
          engagements = engagementData || []
        }
      }
    } catch (e) {
      console.warn('Failed to fetch engagements:', e)
    }

    // Map engagement data to notifications
    const notificationsWithEngagement = (notifications || []).map((notification: any) => {
      const items = engagements.filter((e: any) => e.notification_id === notification.id)
      return {
        ...notification,
        engagement: {
          clicked: items.some((e: any) => e.engagement_type === 'notification_clicked'),
          deepLinked: items.some((e: any) => e.engagement_type === 'deep_link_navigation'),
          actionPerformed: items.some((e: any) => e.engagement_type === 'action_performed'),
          lastEngagement:
            items.sort(
              (a: any, b: any) =>
                new Date(b.engaged_at).getTime() - new Date(a.engaged_at).getTime()
            )[0]?.engaged_at || null,
        },
      }
    })

    // INJECT TEST NOTIFICATION
    const testNotification = {
      id: 'test-notification-' + Date.now(),
      user_id: authResult.userId,
      notification_type: 'info',
      title: '테스트 알림',
      body: '이것은 테스트를 위해 생성된 알림입니다. ' + new Date().toLocaleTimeString(),
      status: 'delivered',
      sent_at: new Date().toISOString(),
      read_at: null,
      engagement: {
        clicked: false,
        deepLinked: false,
        actionPerformed: false,
        lastEngagement: null,
      },
    }

    const finalNotifications = [testNotification, ...(notificationsWithEngagement || [])]

    return NextResponse.json({
      notifications: finalNotifications,
      pagination: {
        page,
        limit,
        total: (count || 0) + 1,
        totalPages: Math.ceil(((count || 0) + 1) / limit),
      },
    })
  } catch (error: any) {
    console.error('Notification history error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch notification history',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

// Mark notification as read
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = createClient()

    const { notificationId, action } = await request.json()

    if (!notificationId || !action) {
      return NextResponse.json(
        { error: 'Notification ID and action are required' },
        { status: 400 }
      )
    }

    // Update notification log based on action
    const updates: unknown = {}

    switch (action) {
      case 'read':
        updates.read_at = new Date().toISOString()
        break
      case 'delete':
        updates.deleted_at = new Date().toISOString()
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from('notification_logs')
      .update(updates)
      .eq('id', notificationId)
      .eq('user_id', authResult.userId)

    if (updateError) {
      throw updateError
    }

    // Log engagement
    await supabase.from('notification_engagement').insert({
      user_id: authResult.userId,
      notification_id: notificationId,
      engagement_type: action === 'read' ? 'notification_clicked' : 'notification_dismissed',
      engaged_at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Notification update error:', error)
    return NextResponse.json(
      {
        error: 'Failed to update notification',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
