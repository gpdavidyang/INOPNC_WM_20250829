import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Simple wrapper for API monitoring
function withApiMonitoring(handler: Function) {
  return async (request: NextRequest) => {
    return handler(request)
  }
}

interface WebVitalData {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  threshold: { good: number; needs_improvement: number }
}

// Web Vitals thresholds (Google recommended)
const THRESHOLDS = {
  LCP: { good: 2500, needs_improvement: 4000 },
  INP: { good: 200, needs_improvement: 500 },
  CLS: { good: 0.1, needs_improvement: 0.25 },
  FCP: { good: 1800, needs_improvement: 3000 },
  TTFB: { good: 800, needs_improvement: 1800 },
}

function rateMetric(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS]
  if (!threshold) return 'poor'
  
  if (value <= threshold.good) return 'good'
  if (value <= threshold.needs_improvement) return 'needs-improvement'
  return 'poor'
}

export const GET = withApiMonitoring(
  async (request: NextRequest) => {
    try {
      const supabase = createClient()
      const { searchParams } = new URL(request.url)
      const timeRange = searchParams.get('timeRange') || '24h'
      
      // Calculate time range
      const now = new Date()
      const startTime = new Date()
      switch (timeRange) {
        case '1h':
          startTime.setHours(now.getHours() - 1)
          break
        case '24h':
          startTime.setDate(now.getDate() - 1)
          break
        case '7d':
          startTime.setDate(now.getDate() - 7)
          break
        case '30d':
          startTime.setDate(now.getDate() - 30)
          break
        default:
          startTime.setDate(now.getDate() - 1)
      }

      // Query Web Vitals data from analytics_metrics table
      const { data: webVitalsData, error } = await supabase
        .from('analytics_metrics')
        .select('metric_type, metric_value, created_at')
        .in('metric_type', ['web_vitals_lcp', 'web_vitals_inp', 'web_vitals_cls', 'web_vitals_fcp', 'web_vitals_ttfb'])
        .gte('created_at', startTime.toISOString())
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching Web Vitals data:', error)
        return NextResponse.json({ error: 'Failed to fetch Web Vitals data' }, { status: 500 })
      }

      // Aggregate the latest values for each metric
      const latestValues: Record<string, number> = {}
      
      webVitalsData?.forEach((row: unknown) => {
        const metricName = row.metric_type.replace('web_vitals_', '').toUpperCase()
        if (!latestValues[metricName] || row.created_at > latestValues[metricName + '_time']) {
          latestValues[metricName] = row.metric_value
          latestValues[metricName + '_time'] = row.created_at
        }
      })

      // Format response data
      const webVitals: WebVitalData[] = Object.keys(THRESHOLDS).map((metricName: unknown) => {
        const value = latestValues[metricName] || 0
        const threshold = THRESHOLDS[metricName as keyof typeof THRESHOLDS]
        
        return {
          name: metricName,
          value,
          rating: rateMetric(metricName, value),
          threshold,
        }
      })

      return NextResponse.json(webVitals)
    } catch (error) {
      console.error('Error in Web Vitals API:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
)