import * as Sentry from '@sentry/nextjs'

// Performance thresholds based on Google's recommendations
const THRESHOLDS = {
  LCP: { good: 2500, needs_improvement: 4000 }, // Largest Contentful Paint
  CLS: { good: 0.1, needs_improvement: 0.25 },   // Cumulative Layout Shift
  FCP: { good: 1800, needs_improvement: 3000 },  // First Contentful Paint
  INP: { good: 200, needs_improvement: 500 },    // Interaction to Next Paint (replaces FID)
  TTFB: { good: 800, needs_improvement: 1800 },  // Time to First Byte
}

// Rate a metric value
function rateMetric(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS]
  if (!threshold) return 'poor'
  
  if (value <= threshold.good) return 'good'
  if (value <= threshold.needs_improvement) return 'needs-improvement'
  return 'poor'
}

// Send metric to analytics
function sendToAnalytics(metric: Metric) {
  const rating = rateMetric(metric.name, metric.value)
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}:`, {
      value: metric.value,
      rating,
      delta: metric.delta,
      navigationType: metric.navigationType,
    })
  }
  
  // Send to Sentry
  try {
    const client = Sentry.getClient()
    if (client) {
      // Use modern Sentry API for measurements
      Sentry.withScope((scope) => {
        scope.setMeasurement(
          metric.name.toLowerCase(),
          metric.value,
          metric.name === 'CLS' ? '' : 'millisecond'
        )
      })
    }
  } catch (error) {
    // Ignore Sentry errors in web vitals tracking
  }
  
  // Send custom event to Sentry
  Sentry.addBreadcrumb({
    category: 'web-vitals',
    message: `${metric.name}: ${metric.value}`,
    level: rating === 'poor' ? 'warning' : 'info',
    data: {
      metric: metric.name,
      value: metric.value,
      rating,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType,
      entries: metric.entries?.length || 0,
    },
  })
  
  // Check performance budget and trigger alerts if needed
  const alert = checkPerformanceBudget(metric.name, metric.value, {
    rating,
    delta: metric.delta,
    navigationType: metric.navigationType,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
  })

  if (alert) {
    console.warn(`Performance budget violation detected:`, alert)
  }

  // Send to custom analytics endpoint
  if (typeof window !== 'undefined' && window.fetch) {
    // Fire and forget - don't await
    fetch('/api/analytics/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'web_vitals',
        metric: metric.name,
        value: metric.value,
        rating,
        delta: metric.delta,
        id: metric.id,
        navigationType: metric.navigationType,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {
      // Ignore errors - this is best effort
    })
  }
}

// Initialize Web Vitals tracking
export function initWebVitals() {
  if (typeof window === 'undefined') return
  
  // Core Web Vitals
  onLCP(sendToAnalytics)
  onINP(sendToAnalytics) // INP replaced FID in web-vitals v3+
  onCLS(sendToAnalytics)
  
  // Additional metrics
  onFCP(sendToAnalytics)
  onTTFB(sendToAnalytics)
}

// Get current Web Vitals snapshot
export async function getWebVitalsSnapshot() {
  if (typeof window === 'undefined') return null
  
  const snapshot = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    metrics: {} as Record<string, any>,
  }
  
  // Collect all available metrics
  const metrics = ['LCP', 'FID', 'CLS', 'FCP', 'INP', 'TTFB']
  
  for (const metricName of metrics) {
    try {
      // Get metric value from performance API
      const entries = performance.getEntriesByType('measure').filter(
        entry => entry.name.includes(metricName)
      )
      
      if (entries.length > 0) {
        const lastEntry = entries[entries.length - 1]
        snapshot.metrics[metricName] = {
          value: lastEntry.duration,
          rating: rateMetric(metricName, lastEntry.duration),
        }
      }
    } catch (error) {
      // Ignore errors for individual metrics
    }
  }
  
  return snapshot
}

// Performance observer for custom metrics
export function observePerformance() {
  if (typeof window === 'undefined' || !window.PerformanceObserver) return
  
  // Observe long tasks
  try {
    const longTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) { // Tasks longer than 50ms
          Sentry.addBreadcrumb({
            category: 'performance',
            message: `Long task detected: ${entry.duration}ms`,
            level: 'warning',
            data: {
              duration: entry.duration,
              startTime: entry.startTime,
              name: entry.name,
            },
          })
        }
      }
    })
    
    longTaskObserver.observe({ entryTypes: ['longtask'] })
  } catch (error) {
    // Long task observer not supported
  }
  
  // Observe layout shifts
  try {
    const layoutShiftObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const layoutShift = entry as unknown
        if (layoutShift.value > 0.1 && !layoutShift.hadRecentInput) {
          Sentry.addBreadcrumb({
            category: 'performance',
            message: `Layout shift detected: ${layoutShift.value}`,
            level: 'warning',
            data: {
              value: layoutShift.value,
              sources: layoutShift.sources?.map((source: unknown) => ({
                node: source.node?.nodeName,
                previousRect: source.previousRect,
                currentRect: source.currentRect,
              })),
            },
          })
        }
      }
    })
    
    layoutShiftObserver.observe({ entryTypes: ['layout-shift'] })
  } catch (error) {
    // Layout shift observer not supported
  }
}

// Performance marks for custom measurements
export const performanceMark = {
  start: (name: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      performance.mark(`${name}-start`)
    }
  },
  
  end: (name: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      performance.mark(`${name}-end`)
      
      try {
        performance.measure(name, `${name}-start`, `${name}-end`)
        const measure = performance.getEntriesByName(name, 'measure')[0]
        
        if (measure) {
          // Send to Sentry
          Sentry.addBreadcrumb({
            category: 'performance',
            message: `${name}: ${measure.duration}ms`,
            level: 'info',
            data: {
              name,
              duration: measure.duration,
              startTime: measure.startTime,
            },
          })
          
          // Clean up marks
          performance.clearMarks(`${name}-start`)
          performance.clearMarks(`${name}-end`)
          performance.clearMeasures(name)
          
          return measure.duration
        }
      } catch (error) {
        // Ignore measurement errors
      }
    }
    
    return null
  },
}