import * as Sentry from '@sentry/nextjs'
import { performanceMark } from './web-vitals'
import { checkPerformanceBudget } from './performance-budgets'
import React from 'react'

// Custom performance metrics for construction app
export interface PerformanceMetrics {
  apiResponseTime: number[]
  dailyReportLoadTime: number[]
  imageUploadTime: number[]
  offlineSyncTime: number[]
  databaseQueryTime: number[]
  renderTime: Record<string, number[]>
}

class PerformanceTracker {
  private metrics: PerformanceMetrics = {
    apiResponseTime: [],
    dailyReportLoadTime: [],
    imageUploadTime: [],
    offlineSyncTime: [],
    databaseQueryTime: [],
    renderTime: {},
  }
  
  private readonly MAX_SAMPLES = 100
  private readonly PERCENTILES = [50, 75, 90, 95, 99]
  
  // Track API response times
  async trackApiCall<T>(
    endpoint: string, 
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now()
    
    try {
      const result = await Sentry.startSpan({
        name: `API: ${endpoint}`,
        op: 'http.client',
      }, async (span) => {
        try {
          const result = await fn()
          const duration = performance.now() - startTime
          
          this.recordMetric('apiResponseTime', duration)
          span.setMeasurement?.('http.response_time', duration, 'millisecond')
          span.setStatus?.('ok')
          
          // Log slow API calls
          if (duration > 1000) {
            Sentry.captureMessage(`Slow API call: ${endpoint} took ${duration}ms`, 'warning')
          }
          
          return result
        } catch (error) {
          span.setStatus?.('internal_error')
          throw error
        }
      })
      
      return result
    } catch (error) {
      // If Sentry fails, still execute the function
      const result = await fn()
      const duration = performance.now() - startTime
      this.recordMetric('apiResponseTime', duration)
      
      if (duration > 1000) {
        console.warn(`Slow API call: ${endpoint} took ${duration}ms`)
      }
      
      return result
    }
  }
  
  // Track daily report operations
  trackDailyReportOperation(operation: string, duration: number) {
    this.recordMetric('dailyReportLoadTime', duration)
    
    Sentry.addBreadcrumb({
      category: 'performance',
      message: `Daily report ${operation}: ${duration}ms`,
      level: duration > 2000 ? 'warning' : 'info',
      data: { operation, duration },
    })
  }
  
  // Track image upload performance
  trackImageUpload(fileSize: number, duration: number) {
    this.recordMetric('imageUploadTime', duration)
    
    const uploadSpeed = (fileSize / 1024 / 1024) / (duration / 1000) // MB/s
    
    Sentry.addBreadcrumb({
      category: 'performance',
      message: `Image upload: ${duration}ms (${uploadSpeed.toFixed(2)} MB/s)`,
      level: uploadSpeed < 1 ? 'warning' : 'info',
      data: { fileSize, duration, uploadSpeed },
    })
  }
  
  // Track offline sync operations
  trackOfflineSync(itemCount: number, duration: number) {
    this.recordMetric('offlineSyncTime', duration)
    
    const itemsPerSecond = itemCount / (duration / 1000)
    
    Sentry.addBreadcrumb({
      category: 'performance',
      message: `Offline sync: ${itemCount} items in ${duration}ms`,
      level: itemsPerSecond < 10 ? 'warning' : 'info',
      data: { itemCount, duration, itemsPerSecond },
    })
  }
  
  // Track database query performance
  trackDatabaseQuery(query: string, duration: number) {
    this.recordMetric('databaseQueryTime', duration)
    
    if (duration > 100) {
      Sentry.addBreadcrumb({
        category: 'performance',
        message: `Slow database query: ${duration}ms`,
        level: 'warning',
        data: { query: query.substring(0, 100), duration },
      })
    }
  }
  
  // Track React component render performance
  trackComponentRender(componentName: string, duration: number) {
    if (!this.metrics.renderTime[componentName]) {
      this.metrics.renderTime[componentName] = []
    }
    
    this.recordMetric(`renderTime.${componentName}`, duration)
    
    // Log slow renders
    if (duration > 16) { // More than one frame at 60fps
      Sentry.addBreadcrumb({
        category: 'performance',
        message: `Slow render: ${componentName} took ${duration}ms`,
        level: 'warning',
        data: { componentName, duration },
      })
    }
  }
  
  // Record a metric value
  private recordMetric(key: string, value: number) {
    const keys = key.split('.')
    let target: any = this.metrics
    
    for (let i = 0; i < keys.length - 1; i++) {
      target = target[keys[i]]
    }
    
    const finalKey = keys[keys.length - 1]
    if (!Array.isArray(target[finalKey])) {
      target[finalKey] = []
    }
    
    target[finalKey].push(value)
    
    // Keep only the most recent samples
    if (target[finalKey].length > this.MAX_SAMPLES) {
      target[finalKey] = target[finalKey].slice(-this.MAX_SAMPLES)
    }

    // Check performance budget for this metric
    const metricName = key.replace(/\./g, '_') // Convert dots to underscores for budget matching
    const alert = checkPerformanceBudget(metricName, value, {
      timestamp: new Date().toISOString(),
      metricType: 'custom',
    })

    if (alert) {
      console.warn(`Performance budget violation in ${key}:`, alert)
    }
  }
  
  // Calculate percentiles for a metric
  private calculatePercentiles(values: number[]) {
    if (values.length === 0) return null
    
    const sorted = [...values].sort((a, b) => a - b)
    const result: Record<string, number> = {}
    
    for (const p of this.PERCENTILES) {
      const index = Math.ceil((p / 100) * sorted.length) - 1
      result[`p${p}`] = sorted[index]
    }
    
    result.avg = values.reduce((a, b) => a + b, 0) / values.length
    result.min = sorted[0]
    result.max = sorted[sorted.length - 1]
    
    return result
  }
  
  // Get performance summary
  getPerformanceSummary() {
    const summary: Record<string, unknown> = {}
    
    // Calculate percentiles for each metric
    for (const [key, values] of Object.entries(this.metrics)) {
      if (Array.isArray(values)) {
        summary[key] = this.calculatePercentiles(values)
      } else if (typeof values === 'object') {
        summary[key] = {}
        for (const [subKey, subValues] of Object.entries(values)) {
          if (Array.isArray(subValues)) {
            summary[key][subKey] = this.calculatePercentiles(subValues)
          }
        }
      }
    }
    
    return summary
  }
  
  // Send metrics to analytics
  async sendMetrics() {
    const summary = this.getPerformanceSummary()
    
    // Send to Sentry
    Sentry.addBreadcrumb({
      category: 'performance',
      message: 'Performance metrics summary',
      level: 'info',
      data: summary,
    })
    
    // Send to analytics API - with better error handling
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
      
      const response = await fetch('/api/analytics/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'performance_summary',
          data: summary,
          timestamp: new Date().toISOString(),
        }),
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
      // If we get a 503, don't retry immediately
      if (response.status === 503) {
        // console.debug('Analytics service unavailable, metrics will be sent later')
        return
      }
    } catch (error) {
      // Silently ignore errors - this is best effort
      // Don't log to console to avoid cluttering
      if (error instanceof Error && error.name === 'AbortError') {
        // console.debug('Metrics request timed out')
      }
    }
  }
  
  // Clear metrics
  clearMetrics() {
    this.metrics = {
      apiResponseTime: [],
      dailyReportLoadTime: [],
      imageUploadTime: [],
      offlineSyncTime: [],
      databaseQueryTime: [],
      renderTime: {},
    }
  }
}

// Singleton instance
export const performanceTracker = new PerformanceTracker()

// React hook for component performance tracking
export function useComponentPerformance(componentName: string) {
  const startTime = performance.now()
  
  return {
    trackRender: () => {
      const duration = performance.now() - startTime
      performanceTracker.trackComponentRender(componentName, duration)
    },
  }
}

// HOC for automatic component performance tracking
export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return function WrappedComponent(props: P) {
    const { trackRender } = useComponentPerformance(componentName)
    
    // Track render on mount and update
    React.useEffect(() => {
      trackRender()
    })
    
    return React.createElement(Component, props)
  }
}

// Utility to measure async operations
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  performanceMark.start(name)
  
  try {
    const result = await fn()
    const duration = performanceMark.end(name) || 0
    
    // Track based on operation type
    if (name.includes('api')) {
      performanceTracker['recordMetric']('apiResponseTime', duration)
    } else if (name.includes('daily-report')) {
      performanceTracker.trackDailyReportOperation(name, duration)
    } else if (name.includes('image')) {
      performanceTracker['recordMetric']('imageUploadTime', duration)
    } else if (name.includes('sync')) {
      performanceTracker['recordMetric']('offlineSyncTime', duration)
    }
    
    return result
  } catch (error) {
    performanceMark.end(name)
    throw error
  }
}

// Schedule periodic metric reporting - DISABLED to prevent 503 errors
if (typeof window !== 'undefined' && false) {
  // Metrics are disabled until analytics_metrics table is created
  // console.debug('Performance metrics reporting is disabled')
}