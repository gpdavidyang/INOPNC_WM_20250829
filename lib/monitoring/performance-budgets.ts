import * as Sentry from '@sentry/nextjs'

// Performance budget configuration
export interface PerformanceBudget {
  name: string
  metric: string
  thresholds: {
    good: number
    warning: number
    critical: number
  }
  unit: string
  enabled: boolean
}

// Default performance budgets for construction app
export const DEFAULT_PERFORMANCE_BUDGETS: PerformanceBudget[] = [
  // Core Web Vitals
  {
    name: 'Largest Contentful Paint',
    metric: 'LCP',
    thresholds: { good: 2500, warning: 4000, critical: 6000 },
    unit: 'ms',
    enabled: true,
  },
  {
    name: 'Interaction to Next Paint',
    metric: 'INP',
    thresholds: { good: 200, warning: 500, critical: 1000 },
    unit: 'ms',
    enabled: true,
  },
  {
    name: 'Cumulative Layout Shift',
    metric: 'CLS',
    thresholds: { good: 0.1, warning: 0.25, critical: 0.5 },
    unit: '',
    enabled: true,
  },
  {
    name: 'First Contentful Paint',
    metric: 'FCP',
    thresholds: { good: 1800, warning: 3000, critical: 4500 },
    unit: 'ms',
    enabled: true,
  },
  {
    name: 'Time to First Byte',
    metric: 'TTFB',
    thresholds: { good: 800, warning: 1800, critical: 3000 },
    unit: 'ms',
    enabled: true,
  },
  
  // API Performance
  {
    name: 'API Response Time',
    metric: 'api_response_time',
    thresholds: { good: 200, warning: 500, critical: 1000 },
    unit: 'ms',
    enabled: true,
  },
  
  // Custom Construction App Metrics
  {
    name: 'Daily Report Load Time',
    metric: 'daily_report_load_time',
    thresholds: { good: 1000, warning: 2000, critical: 3000 },
    unit: 'ms',
    enabled: true,
  },
  {
    name: 'Image Upload Time',
    metric: 'image_upload_time',
    thresholds: { good: 5, warning: 10, critical: 20 },
    unit: 's',
    enabled: true,
  },
  {
    name: 'Offline Sync Time',
    metric: 'offline_sync_time',
    thresholds: { good: 2, warning: 5, critical: 10 },
    unit: 's',
    enabled: true,
  },
  {
    name: 'Component Render Time',
    metric: 'component_render_time',
    thresholds: { good: 16, warning: 50, critical: 100 },
    unit: 'ms',
    enabled: true,
  },
  
  // User Experience Metrics
  {
    name: 'Session Error Rate',
    metric: 'session_error_rate',
    thresholds: { good: 1, warning: 5, critical: 10 },
    unit: '%',
    enabled: true,
  },
  {
    name: 'Page Load Error Rate',
    metric: 'page_load_error_rate',
    thresholds: { good: 0.5, warning: 2, critical: 5 },
    unit: '%',
    enabled: true,
  },
]

// Performance alert severity levels
export type AlertSeverity = 'good' | 'warning' | 'critical'

// Performance alert interface
export interface PerformanceAlert {
  id: string
  budget: PerformanceBudget
  value: number
  severity: AlertSeverity
  timestamp: Date
  metadata?: Record<string, unknown>
}

class PerformanceBudgetManager {
  private budgets: Map<string, PerformanceBudget> = new Map()
  private alerts: PerformanceAlert[] = []
  private alertCallbacks: ((alert: PerformanceAlert) => void)[] = []

  constructor() {
    // Initialize with default budgets
    this.loadDefaultBudgets()
  }

  // Load default performance budgets
  private loadDefaultBudgets() {
    DEFAULT_PERFORMANCE_BUDGETS.forEach(budget => {
      this.budgets.set(budget.metric, budget)
    })
  }

  // Get all performance budgets
  getBudgets(): PerformanceBudget[] {
    return Array.from(this.budgets.values())
  }

  // Get a specific budget by metric
  getBudget(metric: string): PerformanceBudget | undefined {
    return this.budgets.get(metric)
  }

  // Update a performance budget
  updateBudget(metric: string, budget: Partial<PerformanceBudget>) {
    const existing = this.budgets.get(metric)
    if (existing) {
      this.budgets.set(metric, { ...existing, ...budget })
    }
  }

  // Add a custom performance budget
  addCustomBudget(budget: PerformanceBudget) {
    this.budgets.set(budget.metric, budget)
  }

  // Remove a performance budget
  removeBudget(metric: string) {
    this.budgets.delete(metric)
  }

  // Check if a metric value violates the performance budget
  checkBudget(metric: string, value: number, metadata?: Record<string, unknown>): PerformanceAlert | null {
    const budget = this.budgets.get(metric)
    if (!budget || !budget.enabled) {
      return null
    }

    let severity: AlertSeverity = 'good'
    
    if (value > budget.thresholds.critical) {
      severity = 'critical'
    } else if (value > budget.thresholds.warning) {
      severity = 'warning'
    } else if (value <= budget.thresholds.good) {
      severity = 'good'
    }

    // Only create alerts for warning and critical violations
    if (severity === 'good') {
      return null
    }

    const alert: PerformanceAlert = {
      id: `${metric}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      budget,
      value,
      severity,
      timestamp: new Date(),
      metadata,
    }

    // Store the alert
    this.alerts.push(alert)
    
    // Keep only last 1000 alerts to prevent memory issues
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000)
    }

    // Trigger alert callbacks
    this.triggerAlertCallbacks(alert)

    // Send to Sentry
    this.sendToSentry(alert)

    // Send to analytics
    this.sendToAnalytics(alert)

    return alert
  }

  // Register an alert callback
  onAlert(callback: (alert: PerformanceAlert) => void) {
    this.alertCallbacks.push(callback)
  }

  // Remove an alert callback
  offAlert(callback: (alert: PerformanceAlert) => void) {
    const index = this.alertCallbacks.indexOf(callback)
    if (index > -1) {
      this.alertCallbacks.splice(index, 1)
    }
  }

  // Trigger all alert callbacks
  private triggerAlertCallbacks(alert: PerformanceAlert) {
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert)
      } catch (error) {
        console.error('Error in alert callback:', error)
      }
    })
  }

  // Send alert to Sentry
  private sendToSentry(alert: PerformanceAlert) {
    try {
      const message = `Performance budget violation: ${alert.budget.name} (${alert.value}${alert.budget.unit})`
      
      if (alert.severity === 'critical') {
        Sentry.captureMessage(message, 'error')
      } else {
        Sentry.captureMessage(message, 'warning')
      }

      // Add context
      Sentry.setContext('performance_alert', {
        metric: alert.budget.metric,
        value: alert.value,
        threshold_warning: alert.budget.thresholds.warning,
        threshold_critical: alert.budget.thresholds.critical,
        severity: alert.severity,
        unit: alert.budget.unit,
      })

      // Add breadcrumb
      Sentry.addBreadcrumb({
        category: 'performance.budget',
        message,
        level: alert.severity === 'critical' ? 'error' : 'warning',
        data: {
          metric: alert.budget.metric,
          value: alert.value,
          severity: alert.severity,
          ...alert.metadata,
        },
      })
    } catch (error) {
      console.error('Error sending alert to Sentry:', error)
    }
  }

  // Send alert to analytics
  private async sendToAnalytics(alert: PerformanceAlert) {
    try {
      if (typeof window !== 'undefined') {
        await fetch('/api/analytics/realtime', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'performance_alert',
            eventData: {
              metric: alert.budget.metric,
              value: alert.value,
              severity: alert.severity,
              threshold_warning: alert.budget.thresholds.warning,
              threshold_critical: alert.budget.thresholds.critical,
              unit: alert.budget.unit,
              timestamp: alert.timestamp.toISOString(),
              ...alert.metadata,
            },
          }),
        })
      }
    } catch (error) {
      // Ignore analytics errors
    }
  }

  // Get recent alerts
  getRecentAlerts(limit = 50): PerformanceAlert[] {
    return this.alerts
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  // Get alerts by severity
  getAlertsBySeverity(severity: AlertSeverity): PerformanceAlert[] {
    return this.alerts.filter(alert => alert.severity === severity)
  }

  // Clear all alerts
  clearAlerts() {
    this.alerts = []
  }

  // Get performance budget status summary
  getBudgetStatus(): {
    total: number
    enabled: number
    disabled: number
    metrics: string[]
  } {
    const budgets = this.getBudgets()
    return {
      total: budgets.length,
      enabled: budgets.filter(b => b.enabled).length,
      disabled: budgets.filter(b => !b.enabled).length,
      metrics: budgets.map(b => b.metric),
    }
  }

  // Export configuration
  exportConfig(): PerformanceBudget[] {
    return this.getBudgets()
  }

  // Import configuration
  importConfig(budgets: PerformanceBudget[]) {
    this.budgets.clear()
    budgets.forEach(budget => {
      this.budgets.set(budget.metric, budget)
    })
  }
}

// Singleton instance
export const performanceBudgetManager = new PerformanceBudgetManager()

// Helper function to check and alert on performance metrics
export function checkPerformanceBudget(
  metric: string, 
  value: number, 
  metadata?: Record<string, unknown>
): PerformanceAlert | null {
  return performanceBudgetManager.checkBudget(metric, value, metadata)
}

// Helper to register alert handlers
export function onPerformanceAlert(callback: (alert: PerformanceAlert) => void) {
  performanceBudgetManager.onAlert(callback)
}

// Helper to get performance budget status
export function getPerformanceBudgetStatus() {
  return performanceBudgetManager.getBudgetStatus()
}