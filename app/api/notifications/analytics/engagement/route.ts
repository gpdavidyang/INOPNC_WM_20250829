
interface EngagementData {
  type: 'deep_link_navigation' | 'notification_received_foreground' | 'notification_clicked' | 'notification_dismissed' | 'action_performed'
  notificationType?: string
  notificationId?: string
  action?: string
  targetUrl?: string
  timestamp: string
  metadata?: Record<string, unknown>
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data: EngagementData = await request.json()

    // Validate required fields
    if (!data.type || !data.timestamp) {
      return NextResponse.json({ error: 'Type and timestamp are required' }, { status: 400 })
    }

    // Insert engagement record
    const { error: insertError } = await supabase
      .from('notification_engagement')
      .insert({
        user_id: user.id,
        engagement_type: data.type,
        notification_type: data.notificationType,
        notification_id: data.notificationId,
        action: data.action,
        target_url: data.targetUrl,
        metadata: data.metadata || {},
        engaged_at: data.timestamp
      })

    if (insertError) {
      console.error('Failed to log engagement:', insertError)
      return NextResponse.json({ error: 'Failed to log engagement' }, { status: 500 })
    }

    // Update notification log if notification ID is provided
    if (data.notificationId && data.type === 'notification_clicked') {
      await supabase
        .from('notification_logs')
        .update({
          clicked_at: data.timestamp,
          engagement_status: 'clicked'
        })
        .eq('id', data.notificationId)
        .eq('user_id', user.id)
    }

    return NextResponse.json({ success: true })

  } catch (error: unknown) {
    console.error('Notification engagement error:', error)
    return NextResponse.json({ 
      error: 'Failed to log notification engagement',
      details: error.message 
    }, { status: 500 })
  }
}