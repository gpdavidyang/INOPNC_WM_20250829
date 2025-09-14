/**
 * Auth Metrics Collection
 *
 * Collects and reports authentication metrics for monitoring and analytics
 */

export interface AuthMetric {
  timestamp: number
  type:
    | 'login_attempt'
    | 'login_success'
    | 'login_failure'
    | 'session_refresh'
    | 'redirect_loop'
    | 'auth_error'
  metadata?: Record<string, any>
}

export class AuthMetrics {
  private static instance: AuthMetrics
  private metrics: AuthMetric[] = []
  private maxMetrics = 1000

  private counters = {
    loginAttempts: 0,
    loginSuccess: 0,
    loginFailure: 0,
    sessionRefresh: 0,
    redirectLoops: 0,
    authErrors: 0,
  }

  private constructor() {
    // Load persisted metrics if available
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('auth_metrics')
      if (stored) {
        try {
          const data = JSON.parse(stored)
          this.counters = data.counters || this.counters
          this.metrics = data.metrics || []
        } catch (e) {
          console.error('Failed to load auth metrics:', e)
        }
      }
    }
  }

  static getInstance(): AuthMetrics {
    if (!AuthMetrics.instance) {
      AuthMetrics.instance = new AuthMetrics()
    }
    return AuthMetrics.instance
  }

  recordLoginAttempt(success: boolean, metadata?: Record<string, any>) {
    this.counters.loginAttempts++

    if (success) {
      this.counters.loginSuccess++
      this.addMetric('login_success', metadata)
    } else {
      this.counters.loginFailure++
      this.addMetric('login_failure', metadata)
    }

    // Send to analytics if available
    this.sendToAnalytics('login_attempt', {
      success,
      success_rate: this.getSuccessRate(),
      ...metadata,
    })

    this.persist()
  }

  recordSessionRefresh(metadata?: Record<string, any>) {
    this.counters.sessionRefresh++
    this.addMetric('session_refresh', metadata)
    this.persist()
  }

  recordRedirectLoop(path?: string) {
    this.counters.redirectLoops++
    this.addMetric('redirect_loop', { path })

    console.error('[AUTH-METRICS] Redirect loop detected!', {
      count: this.counters.redirectLoops,
      path,
      timestamp: new Date().toISOString(),
    })

    // Alert if too many loops
    if (this.counters.redirectLoops > 10) {
      this.sendAlert('Too many redirect loops detected', {
        count: this.counters.redirectLoops,
        recent_paths: this.getRecentRedirectPaths(),
      })
    }

    this.persist()
  }

  recordAuthError(error: Error, metadata?: Record<string, any>) {
    this.counters.authErrors++
    this.addMetric('auth_error', {
      error_message: error.message,
      error_stack: error.stack,
      ...metadata,
    })

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[AUTH-METRICS] Auth error:', error)
    }

    this.persist()
  }

  private addMetric(type: AuthMetric['type'], metadata?: Record<string, any>) {
    const metric: AuthMetric = {
      timestamp: Date.now(),
      type,
      metadata,
    }

    this.metrics.push(metric)

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }
  }

  getSuccessRate(): number {
    if (this.counters.loginAttempts === 0) return 0
    return Math.round((this.counters.loginSuccess / this.counters.loginAttempts) * 100)
  }

  getFailureRate(): number {
    if (this.counters.loginAttempts === 0) return 0
    return Math.round((this.counters.loginFailure / this.counters.loginAttempts) * 100)
  }

  getMetrics(since?: number): AuthMetric[] {
    if (since) {
      return this.metrics.filter(m => m.timestamp >= since)
    }
    return [...this.metrics]
  }

  getCounters() {
    return { ...this.counters }
  }

  getRecentRedirectPaths(): string[] {
    return this.metrics
      .filter(m => m.type === 'redirect_loop')
      .slice(-10)
      .map(m => m.metadata?.path || 'unknown')
  }

  getStatistics(timeRange?: { start: number; end: number }) {
    let filtered = this.metrics

    if (timeRange) {
      filtered = this.metrics.filter(
        m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      )
    }

    const stats = {
      total_metrics: filtered.length,
      login_attempts: filtered.filter(m => m.type === 'login_attempt').length,
      login_success: filtered.filter(m => m.type === 'login_success').length,
      login_failure: filtered.filter(m => m.type === 'login_failure').length,
      session_refreshes: filtered.filter(m => m.type === 'session_refresh').length,
      redirect_loops: filtered.filter(m => m.type === 'redirect_loop').length,
      auth_errors: filtered.filter(m => m.type === 'auth_error').length,
      success_rate: this.getSuccessRate(),
      failure_rate: this.getFailureRate(),
      last_error:
        filtered.filter(m => m.type === 'auth_error').slice(-1)[0]?.metadata?.error_message || null,
    }

    return stats
  }

  private sendToAnalytics(event: string, data: Record<string, any>) {
    // Google Analytics integration
    if (typeof window !== 'undefined' && (window as any).gtag) {
      ;(window as any).gtag('event', event, data)
    }

    // Custom analytics endpoint
    if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
      fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, data, timestamp: Date.now() }),
      }).catch(err => console.error('Failed to send analytics:', err))
    }
  }

  private sendAlert(message: string, data: Record<string, any>) {
    console.error(`[AUTH-ALERT] ${message}`, data)

    // Send to monitoring service (e.g., Sentry)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      ;(window as any).Sentry.captureMessage(message, {
        level: 'error',
        extra: data,
      })
    }
  }

  private persist() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          'auth_metrics',
          JSON.stringify({
            counters: this.counters,
            metrics: this.metrics.slice(-100), // Store only recent 100 metrics
          })
        )
      } catch (e) {
        console.error('Failed to persist auth metrics:', e)
      }
    }
  }

  reset() {
    this.metrics = []
    this.counters = {
      loginAttempts: 0,
      loginSuccess: 0,
      loginFailure: 0,
      sessionRefresh: 0,
      redirectLoops: 0,
      authErrors: 0,
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_metrics')
    }
  }

  exportMetrics(): string {
    return JSON.stringify(
      {
        counters: this.counters,
        metrics: this.metrics,
        statistics: this.getStatistics(),
        exported_at: new Date().toISOString(),
      },
      null,
      2
    )
  }
}

// Export singleton instance
export const authMetrics = AuthMetrics.getInstance()
