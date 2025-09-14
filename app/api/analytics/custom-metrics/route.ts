
interface CustomMetric {
  name: string
  value: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  change: number
}

export const GET = withApiMonitoring(
  async (request: NextRequest) => {
    try {
      const supabase = await createClient()
      const { searchParams } = new URL(request.url)
      const timeRange = searchParams.get('timeRange') || '24h'
      
      // Calculate time ranges for current and previous periods
      const now = new Date()
      const currentPeriodStart = new Date()
      const previousPeriodStart = new Date()
      const previousPeriodEnd = new Date()
      
      switch (timeRange) {
        case '1h':
          currentPeriodStart.setHours(now.getHours() - 1)
          previousPeriodStart.setHours(now.getHours() - 2)
          previousPeriodEnd.setHours(now.getHours() - 1)
          break
        case '24h':
          currentPeriodStart.setDate(now.getDate() - 1)
          previousPeriodStart.setDate(now.getDate() - 2)
          previousPeriodEnd.setDate(now.getDate() - 1)
          break
        case '7d':
          currentPeriodStart.setDate(now.getDate() - 7)
          previousPeriodStart.setDate(now.getDate() - 14)
          previousPeriodEnd.setDate(now.getDate() - 7)
          break
        case '30d':
          currentPeriodStart.setDate(now.getDate() - 30)
          previousPeriodStart.setDate(now.getDate() - 60)
          previousPeriodEnd.setDate(now.getDate() - 30)
          break
        default:
          currentPeriodStart.setDate(now.getDate() - 1)
          previousPeriodStart.setDate(now.getDate() - 2)
          previousPeriodEnd.setDate(now.getDate() - 1)
      }

      // Query custom performance metrics
      const customMetricTypes = [
        'api_response_time',
        'daily_report_load_time',
        'image_upload_time',
        'offline_sync_time',
        'component_render_time'
      ]

      // Get current period data
      const { data: currentData, error: currentError } = await supabase
        .from('analytics_metrics')
        .select('metric_type, metric_value, metric_count')
        .in('metric_type', customMetricTypes)
        .gte('created_at', currentPeriodStart.toISOString())
        .lt('created_at', now.toISOString())

      if (currentError) {
        console.error('Error fetching current metrics:', currentError)
        return NextResponse.json({ error: 'Failed to fetch current metrics' }, { status: 500 })
      }

      // Get previous period data for comparison
      const { data: previousData, error: previousError } = await supabase
        .from('analytics_metrics')
        .select('metric_type, metric_value, metric_count')
        .in('metric_type', customMetricTypes)
        .gte('created_at', previousPeriodStart.toISOString())
        .lt('created_at', previousPeriodEnd.toISOString())

      if (previousError) {
        console.error('Error fetching previous metrics:', previousError)
        // Continue without comparison data
      }

      // Aggregate metrics by type
      const aggregateMetrics = (data: unknown[]) => {
        const aggregated: Record<string, { total: number; count: number }> = {}
        
        data?.forEach(row => {
          if (!aggregated[row.metric_type]) {
            aggregated[row.metric_type] = { total: 0, count: 0 }
          }
          aggregated[row.metric_type].total += row.metric_value * (row.metric_count || 1)
          aggregated[row.metric_type].count += row.metric_count || 1
        })
        
        return aggregated
      }

      const currentAggregated = aggregateMetrics(currentData || [])
      const previousAggregated = aggregateMetrics(previousData || [])

      // Format metrics with trend analysis
      const customMetrics: CustomMetric[] = customMetricTypes.map(metricType => {
        const current = currentAggregated[metricType]
        const previous = previousAggregated[metricType]
        
        const currentValue = current ? current.total / current.count : 0
        const previousValue = previous ? previous.total / previous.count : 0
        
        let change = 0
        let trend: 'up' | 'down' | 'stable' = 'stable'
        
        if (previousValue > 0) {
          change = ((currentValue - previousValue) / previousValue) * 100
          if (Math.abs(change) < 5) {
            trend = 'stable'
          } else {
            trend = change > 0 ? 'up' : 'down'
          }
        }

        // Determine units and friendly names
        let name: string
        let unit: string
        
        switch (metricType) {
          case 'api_response_time':
            name = 'API Response Time'
            unit = 'ms'
            break
          case 'daily_report_load_time':
            name = 'Daily Report Load'
            unit = 'ms'
            break
          case 'image_upload_time':
            name = 'Image Upload Time'
            unit = 's'
            break
          case 'offline_sync_time':
            name = 'Offline Sync Time'
            unit = 's'
            break
          case 'component_render_time':
            name = 'Component Render'
            unit = 'ms'
            break
          default:
            name = metricType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
            unit = 'ms'
        }

        return {
          name,
          value: Math.round(currentValue * 100) / 100,
          unit,
          trend,
          change: Math.round(change * 10) / 10,
        }
      })

      return NextResponse.json(customMetrics)
    } catch (error) {
      console.error('Error in Custom Metrics API:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
)