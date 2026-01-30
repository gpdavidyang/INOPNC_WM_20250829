import { sendPushToUsers } from '@/lib/notifications/server-push'
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

    // 4. Get all daily reports submitted for today
    const { data: reports, error: reportsError } = await supabase
      .from('daily_reports')
      .select('created_by')
      .eq('work_date', todayStr)

    if (reportsError) {
      throw new Error(`Failed to fetch reports: ${reportsError.message}`)
    }

    // 5. Find users who haven't submitted a report
    const submittedUserIds = new Set(reports?.map(r => r.created_by) || [])
    const targetUserIds = users.filter(u => !submittedUserIds.has(u.id)).map(u => u.id)

    if (targetUserIds.length === 0) {
      return NextResponse.json({
        message: 'All users have submitted reports today',
        date: todayStr,
      })
    }

    // 6. Send Notifications using server-side push helper
    // We send 'daily_report_reminder' type, which sendPushToUsers filters based on preferences
    const result = await sendPushToUsers({
      userIds: targetUserIds,
      notificationType: 'daily_report_reminder',
      senderId: 'system',
      payload: {
        title: '작업일지 작성 리마인더',
        body: '오늘의 작업일지를 작성해주세요',
        icon: '/icons/daily-report-icon.png',
        badge: '/icons/badge-report.png',
        urgency: 'medium',
        data: {
          type: 'daily_report_reminder',
          url: '/dashboard/daily-reports/new',
        },
      },
    })

    // 7. Log job execution
    return NextResponse.json({
      success: true,
      date: todayStr,
      target_count: targetUserIds.length,
      sent_result: result,
    })
  } catch (error: any) {
    console.error('[Cron] Daily Reminder Error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
