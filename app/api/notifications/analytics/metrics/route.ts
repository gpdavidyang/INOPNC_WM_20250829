
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin/manager
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'system_admin', 'site_manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const endDate = searchParams.get('endDate') || new Date().toISOString()
    const notificationType = searchParams.get('type')

    // Build base query
    let metricsQuery = supabase
      .from('notification_logs')
      .select('*')
      .gte('sent_at', startDate)
      .lte('sent_at', endDate)

    if (notificationType) {
      metricsQuery = metricsQuery.eq('notification_type', notificationType)
    }

    // For non-system admins, limit to their organization
    if (profile.role !== 'system_admin') {
      metricsQuery = metricsQuery.eq('organization_id', profile.organization_id)
    }

    const { data: logs, error: logsError } = await metricsQuery

    if (logsError) {
      throw logsError
    }

    // Calculate metrics
    const totalSent = logs?.length || 0
    const delivered = logs?.filter((log: unknown) => log.status === 'delivered').length || 0
    const failed = logs?.filter((log: unknown) => log.status === 'failed').length || 0
    const clicked = logs?.filter((log: unknown) => log.clicked_at).length || 0

    // Get engagement data
    let engagementQuery = supabase
      .from('notification_engagement')
      .select('*')
      .gte('engaged_at', startDate)
      .lte('engaged_at', endDate)

    if (notificationType) {
      engagementQuery = engagementQuery.eq('notification_type', notificationType)
    }

    const { data: engagements } = await engagementQuery

    // Calculate engagement metrics
    const deepLinks = engagements?.filter((e: Event) => e.engagement_type === 'deep_link_navigation').length || 0
    const actions = engagements?.filter((e: Event) => e.engagement_type === 'action_performed').length || 0

    // Group by notification type
    const byType: Record<string, unknown> = {}
    logs?.forEach((log: unknown) => {
      if (!byType[log.notification_type]) {
        byType[log.notification_type] = {
          sent: 0,
          delivered: 0,
          failed: 0,
          clicked: 0,
          deliveryRate: 0,
          clickRate: 0
        }
      }
      
      byType[log.notification_type].sent++
      if (log.status === 'delivered') byType[log.notification_type].delivered++
      if (log.status === 'failed') byType[log.notification_type].failed++
      if (log.clicked_at) byType[log.notification_type].clicked++
    })

    // Calculate rates
    Object.keys(byType).forEach(type => {
      const stats = byType[type]
      stats.deliveryRate = stats.sent > 0 ? (stats.delivered / stats.sent * 100).toFixed(2) : 0
      stats.clickRate = stats.delivered > 0 ? (stats.clicked / stats.delivered * 100).toFixed(2) : 0
    })

    // Time series data (last 7 days)
    const timeSeries = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)
      
      const dayLogs = logs?.filter((log: unknown) => {
        const logDate = new Date(log.sent_at)
        return logDate >= date && logDate < nextDate
      }) || []
      
      timeSeries.push({
        date: date.toISOString().split('T')[0],
        sent: dayLogs.length,
        delivered: dayLogs.filter((log: unknown) => log.status === 'delivered').length,
        clicked: dayLogs.filter((log: unknown) => log.clicked_at).length
      })
    }

    return NextResponse.json({
      summary: {
        totalSent,
        delivered,
        failed,
        clicked,
        deliveryRate: totalSent > 0 ? (delivered / totalSent * 100).toFixed(2) : 0,
        clickRate: delivered > 0 ? (clicked / delivered * 100).toFixed(2) : 0,
        engagementRate: delivered > 0 ? ((clicked + deepLinks + actions) / delivered * 100).toFixed(2) : 0
      },
      byType,
      timeSeries,
      engagement: {
        deepLinks,
        actions,
        totalEngagements: engagements?.length || 0
      },
      period: {
        startDate,
        endDate
      }
    })

  } catch (error: unknown) {
    console.error('Notification metrics error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch notification metrics',
      details: error.message 
    }, { status: 500 })
  }
}