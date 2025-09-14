/**
 * Monitoring Metrics API Endpoint
 * Provides real-time metrics for the monitoring dashboard
 */


export const GET = withAPIMonitoring(
  async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url)
      const metricType = searchParams.get('type') || 'all'
      const timeRange = searchParams.get('range') || '1h'

      const response: unknown = {
        timestamp: new Date().toISOString(),
        timeRange,
        system: 'inopnc-construction-management'
      }

      switch (metricType) {
        case 'system': {
          response.data = await monitoringManager.getSystemHealth()
          break
        }
        case 'api': {
          response.data = apiMonitor.getMetrics()
          break
        }
        case 'performance': {
          response.data = performanceTracker.getPerformanceSummary()
          break
        }
        case 'construction': {
          response.data = apiMonitor.getConstructionMetrics()
          break
        }
        case 'alerts': {
          response.data = {
            active: alertingManager.getActiveAlerts(),
            rules: alertingManager.getAlertRules()
          }
          break
        }
        case 'security': {
          response.data = await securityManager.getSecurityMetrics()
          break
        }
        case 'all':
        default: {
          // Get comprehensive metrics
          const [
            systemHealth,
            apiMetrics,
            performanceMetrics,
            constructionMetrics,
            securityMetrics
          ] = await Promise.all([
            monitoringManager.getSystemHealth(),
            Promise.resolve(apiMonitor.getMetrics()),
            Promise.resolve(performanceTracker.getPerformanceSummary()),
            Promise.resolve(apiMonitor.getConstructionMetrics()),
            securityManager.getSecurityMetrics()
          ])

          response.data = {
            system: systemHealth,
            api: apiMetrics,
            performance: performanceMetrics,
            construction: constructionMetrics,
            security: securityMetrics,
            alerts: {
              active: alertingManager.getActiveAlerts(),
              count: alertingManager.getActiveAlerts().length
            }
          }
          break
        }
      }

      return NextResponse.json(response)

    } catch (error: unknown) {
      console.error('Failed to fetch monitoring metrics:', error)
      
      return NextResponse.json(
        {
          error: 'Failed to fetch metrics',
          message: error?.message || 'Unknown error',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }
  }
)

export const POST = withAPIMonitoring(
  async (request: NextRequest) => {
    try {
      const body = await request.json()
      const { type, data } = body

      switch (type) {
        case 'web_vitals': {
          // Store web vitals data
          if (data.metric && data.value !== undefined) {
            // Would store in analytics database
            console.log(`Web Vitals - ${data.metric}: ${data.value}`)
          }
          break
        }
        case 'performance_metric': {
          // Store custom performance metric
          if (data.name && data.value !== undefined) {
            // Would store in analytics database
            console.log(`Performance Metric - ${data.name}: ${data.value}`)
          }
          break
        }
        case 'user_action': {
          // Track user actions for analytics
          if (data.action) {
            // Would store in analytics database
            console.log(`User Action: ${data.action}`)
          }
          break
        }
        default:
          return NextResponse.json(
            { error: 'Unknown metric type' },
            { status: 400 }
          )
      }

      return NextResponse.json({ 
        success: true,
        timestamp: new Date().toISOString()
      })

    } catch (error: unknown) {
      console.error('Failed to store metric:', error)
      
      return NextResponse.json(
        {
          error: 'Failed to store metric',
          message: error?.message || 'Unknown error',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }
  }
)