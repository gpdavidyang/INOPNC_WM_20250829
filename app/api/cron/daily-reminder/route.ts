import { dispatchNotificationServiceRole } from '@/lib/notifications/server-push'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // 1. Verify Cron Secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const supabase = createServiceRoleClient()

    // 2. Calculate today's date in KST (UTC+9)
    const kstDate = new Date(new Date().getTime() + 9 * 60 * 60 * 1000)
    const todayStr = kstDate.toISOString().split('T')[0] // YYYY-MM-DD

    // 3. Get all active workers and site managers
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, role')
      .in('role', ['worker', 'site_manager'])
      .eq('status', 'active')

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`)
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'No active users found' })
    }

    // 4. Get all daily reports for today (status aware)
    const { data: reports, error: reportsError } = await supabase
      .from('daily_reports')
      .select('created_by, status')
      .eq('work_date', todayStr)

    if (reportsError) {
      throw new Error(`Failed to fetch reports: ${reportsError.message}`)
    }

    // 5. Find users who haven't completed submission (exclude submitted/approved)
    const completedUserIds = new Set(
      (reports || [])
        .filter((r: any) =>
          ['submitted', 'approved'].includes(String(r?.status || '').toLowerCase())
        )
        .map((r: any) => String(r?.created_by || ''))
        .filter(Boolean)
    )
    const draftUserIds = new Set(
      (reports || [])
        .filter((r: any) => String(r?.status || '').toLowerCase() === 'draft')
        .map((r: any) => String(r?.created_by || ''))
        .filter(Boolean)
    )
    const targetUserIds = users.filter(u => !completedUserIds.has(String(u.id))).map(u => u.id)

    if (targetUserIds.length === 0) {
      return NextResponse.json({
        message: 'All users have submitted reports today',
        date: todayStr,
      })
    }

    // 6. Dedupe (per user, per day)
    const { data: existingLogs } = await supabase
      .from('notification_logs')
      .select('user_id')
      .eq('notification_type', 'daily_report_reminder')
      .eq('metadata->>work_date', todayStr)
      .in('user_id', targetUserIds)

    const alreadyNotified = new Set((existingLogs || []).map((r: any) => String(r.user_id)))
    const dedupedTargets = targetUserIds.filter(id => !alreadyNotified.has(String(id)))

    if (dedupedTargets.length === 0) {
      return NextResponse.json({
        success: true,
        date: todayStr,
        message: 'Deduped: already reminded today',
        target_count: 0,
      })
    }

    const targetsWithDraft = dedupedTargets.filter(id => draftUserIds.has(String(id)))
    const targetsWithoutDraft = dedupedTargets.filter(id => !draftUserIds.has(String(id)))

    const basePayload = {
      title: '작업일지 작성 리마인더',
      icon: '/icons/daily-report-icon.png',
      badge: '/icons/badge-report.png',
      urgency: 'medium' as const,
      type: 'DAILY_REPORT_REMINDER',
      url: '/mobile',
      data: {
        type: 'daily_report_reminder',
        url: '/mobile',
        work_date: todayStr,
      },
    }

    const results: any[] = []
    if (targetsWithDraft.length > 0) {
      results.push(
        await dispatchNotificationServiceRole({
          userIds: targetsWithDraft,
          notificationType: 'daily_report_reminder',
          senderId: 'system',
          logMetadata: { work_date: todayStr, variant: 'draft_exists' },
          dedupe: { key: 'work_date', value: todayStr },
          payload: {
            ...basePayload,
            body: '임시 저장된 작업일지가 남아있습니다. 제출을 완료해 주세요.',
          },
        })
      )
    }
    if (targetsWithoutDraft.length > 0) {
      results.push(
        await dispatchNotificationServiceRole({
          userIds: targetsWithoutDraft,
          notificationType: 'daily_report_reminder',
          senderId: 'system',
          logMetadata: { work_date: todayStr, variant: 'no_draft' },
          dedupe: { key: 'work_date', value: todayStr },
          payload: {
            ...basePayload,
            body: '오늘 작업일지를 작성해 주세요.',
          },
        })
      )
    }

    // 7. Log job execution
    return NextResponse.json({
      success: true,
      date: todayStr,
      target_count: dedupedTargets.length,
      breakdown: {
        draft_targets: targetsWithDraft.length,
        no_draft_targets: targetsWithoutDraft.length,
      },
      sent_result: results,
    })
  } catch (error: any) {
    console.error('[Cron] Daily Reminder Error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
