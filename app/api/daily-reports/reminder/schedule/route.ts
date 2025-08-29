import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { siteIds, scheduleTime = '17:00', enabled = true } = await request.json()

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission (must be site manager or admin)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, site_id, organization_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'system_admin', 'site_manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Validate site access
    let targetSiteIds = siteIds
    if (profile.role === 'site_manager') {
      // Site managers can only schedule for their own site
      targetSiteIds = [profile.site_id]
    }

    if (!targetSiteIds?.length) {
      return NextResponse.json({ error: 'No valid sites specified' }, { status: 400 })
    }

    // Calculate next reminder time based on schedule
    const [hours, minutes] = scheduleTime.split(':').map(Number)
    const nextReminder = new Date()
    nextReminder.setHours(hours, minutes, 0, 0)
    
    // If time has passed today, schedule for tomorrow
    if (nextReminder < new Date()) {
      nextReminder.setDate(nextReminder.getDate() + 1)
    }

    if (enabled) {
      // Create scheduled notification for daily report reminders
      const { data: scheduledNotification, error: scheduleError } = await supabase
        .from('scheduled_notifications')
        .insert({
          title: '작업일지 작성 리마인더',
          body: '오늘의 작업일지를 작성해주세요',
          payload: {
            title: '작업일지 작성 리마인더',
            body: '오늘의 작업일지를 작성해주세요',
            urgency: 'medium',
            icon: '/icons/daily-report-icon.png',
            badge: '/icons/badge-report.png',
            data: {
              type: 'daily_report_reminder',
              url: '/dashboard/daily-reports/new'
            }
          },
          site_ids: targetSiteIds,
          notification_type: 'daily_report_reminder',
          scheduled_at: nextReminder.toISOString(),
          created_by: user.id,
          organization_id: profile.organization_id
        })
        .select()

      if (scheduleError) {
        console.error('Error creating scheduled reminder:', scheduleError)
        return NextResponse.json({ error: 'Failed to schedule reminder' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Daily report reminder scheduled',
        scheduledId: scheduledNotification[0]?.id,
        nextReminder: nextReminder.toISOString()
      })
    } else {
      // Cancel existing scheduled reminders
      const { error: cancelError } = await supabase
        .from('scheduled_notifications')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('notification_type', 'daily_report_reminder')
        .eq('status', 'pending')
        .eq('created_by', user.id)
        .in('site_ids', targetSiteIds)

      if (cancelError) {
        console.error('Error cancelling reminders:', cancelError)
        return NextResponse.json({ error: 'Failed to cancel reminders' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Daily report reminders cancelled'
      })
    }

  } catch (error: any) {
    console.error('Reminder schedule error:', error)
    return NextResponse.json({ 
      error: 'Failed to schedule reminder',
      details: error.message 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's scheduled reminders
    const { data: reminders, error: fetchError } = await supabase
      .from('scheduled_notifications')
      .select('*')
      .eq('notification_type', 'daily_report_reminder')
      .eq('status', 'pending')
      .eq('created_by', user.id)
      .order('scheduled_at', { ascending: true })

    if (fetchError) {
      console.error('Error fetching reminders:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      reminders: reminders || []
    })

  } catch (error: any) {
    console.error('Get reminders error:', error)
    return NextResponse.json({ 
      error: 'Failed to get reminders',
      details: error.message 
    }, { status: 500 })
  }
}