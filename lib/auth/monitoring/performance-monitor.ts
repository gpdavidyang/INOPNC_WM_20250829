/**
 * Auth Performance Monitor
 *
 * Tracks performance metrics for auth operations
 */

export interface PerformanceMetric {
  operation: string
  duration: number
  timestamp: number
  success: boolean
  metadata?: Record<string, any>
}

export class AuthPerformanceMonitor {
  private static instance: AuthPerformanceMonitor
  private metrics: PerformanceMetric[] = []
  private maxMetrics = 500
  private timers = new Map<string, number>()

  private constructor() {}

  static getInstance(): AuthPerformanceMonitor {
    if (!AuthPerformanceMonitor.instance) {
      AuthPerformanceMonitor.instance = new AuthPerformanceMonitor()
    }
    return AuthPerformanceMonitor.instance
  }

  startOperation(operationId: string): void {
    this.timers.set(operationId, Date.now())
  }

  endOperation(operationId: string, success: boolean, metadata?: Record<string, any>): number {
    const startTime = this.timers.get(operationId)
    if (!startTime) {
      console.warn(`No start time found for operation: ${operationId}`)
      return 0
    }

    const duration = Date.now() - startTime
    this.timers.delete(operationId)

    const metric: PerformanceMetric = {
      operation: operationId,
      duration,
      timestamp: Date.now(),
      success,
      metadata,
    }

    this.metrics.push(metric)
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift()
    }

    // Log slow operations
    if (duration > 1000) {
      console.warn(`[AUTH-PERF] Slow operation detected: ${operationId} took ${duration}ms`)
    }

    return duration
  }

  getMetrics(filter?: {
    operation?: string
    minDuration?: number
    since?: number
  }): PerformanceMetric[] {
    let filtered = [...this.metrics]

    if (filter) {
      if (filter.operation) {
        filtered = filtered.filter(m => m.operation.includes(filter.operation!))
      }
      if (filter.minDuration) {
        filtered = filtered.filter(m => m.duration >= filter.minDuration!)
      }
      if (filter.since) {
        filtered = filtered.filter(m => m.timestamp >= filter.since!)
      }
    }

    return filtered
  }

  getStatistics(): {
    averageDuration: Record<string, number>
    successRate: Record<string, number>
    slowestOperations: PerformanceMetric[]
    totalOperations: number
  } {
    const operationStats = new Map<
      string,
      { totalDuration: number; count: number; successes: number }
    >()

    this.metrics.forEach(metric => {
      const stats = operationStats.get(metric.operation) || {
        totalDuration: 0,
        count: 0,
        successes: 0,
      }

      stats.totalDuration += metric.duration
      stats.count++
      if (metric.success) stats.successes++

      operationStats.set(metric.operation, stats)
    })

    const averageDuration: Record<string, number> = {}
    const successRate: Record<string, number> = {}

    operationStats.forEach((stats, operation) => {
      averageDuration[operation] = Math.round(stats.totalDuration / stats.count)
      successRate[operation] = Math.round((stats.successes / stats.count) * 100)
    })

    const slowestOperations = [...this.metrics].sort((a, b) => b.duration - a.duration).slice(0, 10)

    return {
      averageDuration,
      successRate,
      slowestOperations,
      totalOperations: this.metrics.length,
    }
  }

  clearMetrics(): void {
    this.metrics = []
    this.timers.clear()
  }

  exportMetrics(): string {
    const stats = this.getStatistics()
    return JSON.stringify(
      {
        metrics: this.metrics,
        statistics: stats,
        timestamp: new Date().toISOString(),
      },
      null,
      2
    )
  }
}

// Export singleton instance
export const authPerformanceMonitor = AuthPerformanceMonitor.getInstance()

// Convenience function for timing operations
export function withPerformanceTracking<T>(
  operationId: string,
  operation: () => Promise<T>
): Promise<T> {
  authPerformanceMonitor.startOperation(operationId)

  return operation()
    .then(result => {
      authPerformanceMonitor.endOperation(operationId, true)
      return result
    })
    .catch(error => {
      authPerformanceMonitor.endOperation(operationId, false, { error: error.message })
      throw error
    })
}
