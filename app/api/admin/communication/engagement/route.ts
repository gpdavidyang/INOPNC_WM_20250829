import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const AUDIT_TYPES = ['admin_starred', 'admin_unstarred', 'admin_read', 'admin_ack', 'admin_reject']

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) {
      return auth
    }
    if (!['admin', 'system_admin'].includes(auth.role || '')) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const limitParam = Number.parseInt(searchParams.get('limit') || '20', 10)
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 50) : 20

    const { data: engagementRows, error: engagementError } = await supabase
      .from('notification_engagement')
      .select('id, notification_id, engagement_type, engaged_at, user_id, metadata')
      .in('engagement_type', AUDIT_TYPES)
      .order('engaged_at', { ascending: false })
      .limit(limit)

    if (engagementError) {
      console.error('[communication engagement] fetch failed', engagementError)
      return NextResponse.json(
        { success: false, error: 'Failed to load engagement data' },
        { status: 500 }
      )
    }

    const notificationIds = Array.from(
      new Set(
        (engagementRows || [])
          .map(row => row?.notification_id)
          .filter((id): id is string => Boolean(id))
      )
    )
    const userIds = Array.from(
      new Set(
        (engagementRows || []).map(row => row?.user_id).filter((id): id is string => Boolean(id))
      )
    )

    const [logsRes, usersRes] = await Promise.all([
      notificationIds.length
        ? supabase
            .from('notification_logs')
            .select('id, title, notification_type, status, sent_at')
            .in('id', notificationIds)
        : Promise.resolve({ data: [] as any[], error: null }),
      userIds.length
        ? supabase.from('profiles').select('id, full_name, email').in('id', userIds)
        : Promise.resolve({ data: [] as any[], error: null }),
    ])

    const logMap = new Map<string, any>()
    for (const log of logsRes.data || []) {
      logMap.set((log as any).id, log)
    }
    const userMap = new Map<string, any>()
    for (const user of usersRes.data || []) {
      userMap.set((user as any).id, user)
    }

    const events =
      engagementRows?.map(row => {
        const log = row?.notification_id ? logMap.get(row.notification_id) : null
        const user = row?.user_id ? userMap.get(row.user_id) : null
        return {
          id: row?.id,
          notification_id: row?.notification_id,
          engagement_type: row?.engagement_type,
          engaged_at: row?.engaged_at,
          user: user
            ? {
                id: user.id,
                name: user.full_name || user.email,
                email: user.email,
              }
            : null,
          notification: log
            ? {
                title: log.title,
                status: log.status,
                type: log.notification_type,
                sent_at: log.sent_at,
              }
            : null,
          metadata: row?.metadata || null,
        }
      }) || []

    return NextResponse.json({ success: true, events })
  } catch (error) {
    console.error('[communication engagement] unexpected error', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
