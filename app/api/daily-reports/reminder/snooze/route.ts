import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { siteId, snoozeHours = 2 } = await request.json()

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Calculate next reminder time
    const nextReminderTime = new Date()
    nextReminderTime.setHours(nextReminderTime.getHours() + snoozeHours)

    // Store snooze preference
    const snoozedUntil = nextReminderTime.toISOString()
    
    // Update user's daily report preferences
    const preferences = profile.notification_preferences || {}
    preferences.daily_report_snoozed_until = snoozedUntil
    preferences.daily_report_snooze_site_id = siteId

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        notification_preferences: preferences,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating snooze preference:', updateError)
      return NextResponse.json({ error: 'Failed to update snooze preference' }, { status: 500 })
    }

    // Create a notification log entry
    await supabase
      .from('notification_logs')
      .insert({
        user_id: user.id,
        notification_type: 'daily_report_reminder',
        title: '작업일지 리마인더 연기',
        body: `작업일지 리마인더가 ${snoozeHours}시간 후로 연기되었습니다`,
        status: 'delivered',
        sent_at: new Date().toISOString(),
        sent_by: user.id
      })

    return NextResponse.json({
      success: true,
      message: `Reminder snoozed for ${snoozeHours} hours`,
      snoozedUntil
    })

  } catch (error: any) {
    console.error('Reminder snooze error:', error)
    return NextResponse.json({ 
      error: 'Failed to snooze reminder',
      details: error.message 
    }, { status: 500 })
  }
}