/**
 * Comprehensive Application Monitoring Manager for INOPNC Work Management System
 * Integrates error tracking, performance monitoring, and custom metrics
 */

import * as Sentry from '@sentry/nextjs'
import { createClient } from '@/lib/supabase/client'
import { performanceTracker, PerformanceMetrics } from './performance-metrics'
import { securityManager } from '@/lib/security/production-security-manager'

// Monitoring event types for construction industry
export enum MonitoringEventType {
  // Performance Events
  SLOW_PAGE_LOAD = 'SLOW_PAGE_LOAD',
  API_TIMEOUT = 'API_TIMEOUT',
  DATABASE_SLOW_QUERY = 'DATABASE_SLOW_QUERY',
  MEMORY_USAGE_HIGH = 'MEMORY_USAGE_HIGH',
  
  // Construction-specific Events
  DAILY_REPORT_CREATION_SLOW = 'DAILY_REPORT_CREATION_SLOW',
  ATTENDANCE_SYNC_FAILED = 'ATTENDANCE_SYNC_FAILED',
  DOCUMENT_UPLOAD_FAILED = 'DOCUMENT_UPLOAD_FAILED',
  OFFLINE_DATA_SYNC_SLOW = 'OFFLINE_DATA_SYNC_SLOW',
  
  // User Experience Events
  HIGH_ERROR_RATE = 'HIGH_ERROR_RATE',
  USER_SESSION_LONG = 'USER_SESSION_LONG',
  NAVIGATION_SLOW = 'NAVIGATION_SLOW',
  
  // System Health Events
  HIGH_CPU_USAGE = 'HIGH_CPU_USAGE',
  MEMORY_LEAK_DETECTED = 'MEMORY_LEAK_DETECTED',
  API_RATE_LIMIT_APPROACHED = 'API_RATE_LIMIT_APPROACHED'
}

export enum AlertSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

interface MonitoringAlert {
  id: string
  event_type: MonitoringEventType
  severity: AlertSeverity
  message: string
  context: Record<string, any>
  timestamp: string
  resolved: boolean
  resolved_at?: string
  user_id?: string
  site_id?: string
}

interface SystemHealthMetrics {
  error_rate: number
  avg_response_time: number
  active_users: number
  database_connections: number
  memory_usage_mb: number
  cpu_usage_percent: number
  daily_reports_created_today: number
  attendance_records_today: number
  document_uploads_today: number
  offline_sync_failures: number
}

interface ConstructionMetrics {
  daily_reports: {
    created_today: number
    avg_creation_time_ms: number
    failed_today: number
  }
  attendance: {
    records_today: number
    avg_check_in_time_ms: number
    sync_failures: number
  }
  documents: {
    uploads_today: number
    avg_upload_time_ms: number
    failed_uploads: number
    storage_used_mb: number
  }
  sites: {
    active_sites: number
    users_per_site: Record<string, number>
    avg_activity_per_site: number
  }
}

export class MonitoringManager {
  private static instance: MonitoringManager
  private supabase = createClient()
  private alertQueue: MonitoringAlert[] = []
  private isMonitoring = false
  private metricsCache = new Map<string, any>()
  private intervalIds: NodeJS.Timeout[] = [] // 모든 interval ID를 저장
  
  // Performance thresholds
  private readonly THRESHOLDS = {
    PAGE_LOAD_TIME_MS: 3000,
    API_RESPONSE_TIME_MS: 1000,
    DATABASE_QUERY_TIME_MS: 500,
    ERROR_RATE_PERCENT: 5,
    MEMORY_USAGE_MB: 512,
    CPU_USAGE_PERCENT: 80,
    DAILY_REPORT_CREATION_TIME_MS: 2000,
    DOCUMENT_UPLOAD_TIME_MS: 5000,
    OFFLINE_SYNC_TIME_MS: 10000
  }

  private constructor() {}

  static getInstance(): MonitoringManager {
    if (!MonitoringManager.instance) {
      MonitoringManager.instance = new MonitoringManager()
    }
    return MonitoringManager.instance
  }

  /**
   * Initialize comprehensive monitoring system
   */
  async initialize(): Promise<void> {
    if (this.isMonitoring) return

    // console.log('🔍 Starting Comprehensive Monitoring System...')
    
    // Initialize Sentry with custom configuration
    this.initializeSentry()
    
    // Start monitoring loops
    this.startPerformanceMonitoring()
    this.startHealthChecks()
    this.startConstructionMetricsCollection()
    
    // Integrate with security monitoring
    this.integrateWithSecurityManager()
    
    this.isMonitoring = true
    // console.log('✅ Monitoring system initialized successfully')
  }

  /**
   * Initialize Sentry with construction-specific configuration
   */
  private initializeSentry(): void {
    try {
      // Set up construction-specific tags using modern API
      Sentry.withScope((scope) => {
        scope.setTag('system', 'construction-management')
        scope.setTag('industry', 'construction')
        scope.setContext('application', {
          name: 'INOPNC Work Management',
          version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
          environment: process.env.NODE_ENV || 'development'
        })
      })

      // Set up custom metrics using available Sentry methods
      try {
        Sentry.setTag('monitoring.system', 'construction-management')
        Sentry.setTag('monitoring.status', 'started')
        Sentry.addBreadcrumb({
          category: 'monitoring.system',
          message: 'Monitoring system started',
          level: 'info',
          data: { system: 'construction-management' }
        })
      } catch (error) {
        // Ignore Sentry tagging errors
      }
    } catch (error) {
      console.warn('Failed to initialize Sentry configuration:', error)
    }
  }

  /**
   * Start performance monitoring loops
   */
  private startPerformanceMonitoring(): void {
    // Monitor every 30 seconds
    const perfInterval = setInterval(async () => {
      await this.checkPerformanceMetrics()
    }, 30000)
    this.intervalIds.push(perfInterval)

    // Detailed performance analysis every 5 minutes
    const trendsInterval = setInterval(async () => {
      await this.analyzePerformanceTrends()
    }, 5 * 60 * 1000)
    this.intervalIds.push(trendsInterval)

    // Memory usage monitoring every 2 minutes
    const memoryInterval = setInterval(async () => {
      await this.checkMemoryUsage()
    }, 2 * 60 * 1000)
    this.intervalIds.push(memoryInterval)
  }

  /**
   * Start system health checks
   */
  private startHealthChecks(): void {
    // System health check every minute
    const healthInterval = setInterval(async () => {
      await this.performHealthCheck()
    }, 60000)
    this.intervalIds.push(healthInterval)

    // Database health check every 5 minutes
    const dbHealthInterval = setInterval(async () => {
      await this.checkDatabaseHealth()
    }, 5 * 60 * 1000)
    this.intervalIds.push(dbHealthInterval)

    // API health check every 30 seconds
    const apiHealthInterval = setInterval(async () => {
      await this.checkApiHealth()
    }, 30000)
    this.intervalIds.push(apiHealthInterval)
  }

  /**
   * Start construction-specific metrics collection
   */
  private startConstructionMetricsCollection(): void {
    // Construction metrics every 2 minutes
    const constructionInterval = setInterval(async () => {
      await this.collectConstructionMetrics()
    }, 2 * 60 * 1000)
    this.intervalIds.push(constructionInterval)

    // User activity analysis every 10 minutes
    const userActivityInterval = setInterval(async () => {
      await this.analyzeUserActivity()
    }, 10 * 60 * 1000)
    this.intervalIds.push(userActivityInterval)

    // Site performance analysis every 15 minutes
    const sitePerformanceInterval = setInterval(async () => {
      await this.analyzeSitePerformance()
    }, 15 * 60 * 1000)
    this.intervalIds.push(sitePerformanceInterval)
  }

  /**
   * Integrate with existing security manager
   */
  private integrateWithSecurityManager(): void {
    // Monitor security alerts and correlate with performance
    const securityInterval = setInterval(async () => {
      await this.correlateSecurityAndPerformance()
    }, 5 * 60 * 1000)
    this.intervalIds.push(securityInterval)
  }

  /**
   * Check performance metrics and create alerts
   */
  private async checkPerformanceMetrics(): Promise<void> {
    try {
      const metrics = performanceTracker.getPerformanceSummary()
      
      // Check API response times
      if (metrics.apiResponseTime?.p95 > this.THRESHOLDS.API_RESPONSE_TIME_MS) {
        await this.createAlert({
          event_type: MonitoringEventType.API_TIMEOUT,
          severity: AlertSeverity.WARNING,
          message: `API response time P95 is ${metrics.apiResponseTime.p95}ms (threshold: ${this.THRESHOLDS.API_RESPONSE_TIME_MS}ms)`,
          context: { metrics: metrics.apiResponseTime }
        })
      }

      // Check daily report creation time
      if (metrics.dailyReportLoadTime?.p95 > this.THRESHOLDS.DAILY_REPORT_CREATION_TIME_MS) {
        await this.createAlert({
          event_type: MonitoringEventType.DAILY_REPORT_CREATION_SLOW,
          severity: AlertSeverity.WARNING,
          message: `Daily report creation is slow: ${metrics.dailyReportLoadTime.p95}ms`,
          context: { metrics: metrics.dailyReportLoadTime }
        })
      }

      // Check image upload performance
      if (metrics.imageUploadTime?.p95 > this.THRESHOLDS.DOCUMENT_UPLOAD_TIME_MS) {
        await this.createAlert({
          event_type: MonitoringEventType.DOCUMENT_UPLOAD_FAILED,
          severity: AlertSeverity.WARNING,
          message: `Document upload is slow: ${metrics.imageUploadTime.p95}ms`,
          context: { metrics: metrics.imageUploadTime }
        })
      }

      // Send metrics to Sentry using alternative methods
      try {
        Sentry.setTag('performance.api_response_time_p95', String(metrics.apiResponseTime?.p95 || 0))
        Sentry.setTag('performance.daily_report_time_p95', String(metrics.dailyReportLoadTime?.p95 || 0))
        Sentry.setTag('performance.document_upload_time_p95', String(metrics.imageUploadTime?.p95 || 0))
        Sentry.setMeasurement('api.response_time.p95', metrics.apiResponseTime?.p95 || 0)
        Sentry.setMeasurement('daily_report.creation_time.p95', metrics.dailyReportLoadTime?.p95 || 0)
        Sentry.setMeasurement('document.upload_time.p95', metrics.imageUploadTime?.p95 || 0)
      } catch (error) {
        // Ignore Sentry tagging errors
      }

    } catch (error) {
      console.error('Failed to check performance metrics:', error)
      Sentry.captureException(error)
    }
  }

  /**
   * Analyze performance trends over time
   */
  private async analyzePerformanceTrends(): Promise<void> {
    try {
      // Get historical performance data
      const { data: recentMetrics } = await this.supabase
        .from('analytics_events')
        .select('*')
        .eq('event_type', 'performance_metric')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })

      if (!recentMetrics || recentMetrics.length === 0) return

      // Analyze trends
      const trends = this.calculatePerformanceTrends(recentMetrics)
      
      // Alert on negative trends
      if (trends.api_response_time.trend === 'degrading' && trends.api_response_time.change > 50) {
        await this.createAlert({
          event_type: MonitoringEventType.API_TIMEOUT,
          severity: AlertSeverity.ERROR,
          message: `API performance is degrading: ${trends.api_response_time.change}% increase over 24h`,
          context: { trends }
        })
      }

      // Send trend data to Sentry
      Sentry.addBreadcrumb({
        category: 'performance.trends',
        message: 'Performance trend analysis completed',
        data: trends,
        level: 'info'
      })

    } catch (error) {
      console.error('Failed to analyze performance trends:', error)
      Sentry.captureException(error)
    }
  }

  /**
   * Check memory usage and detect leaks
   */
  private async checkMemoryUsage(): Promise<void> {
    if (typeof window === 'undefined') return // Server-side only in production

    try {
      // @ts-ignore - performance.memory is available in Chrome
      const memoryInfo = performance.memory
      if (!memoryInfo) return

      const usedMB = memoryInfo.usedJSHeapSize / (1024 * 1024)
      const totalMB = memoryInfo.totalJSHeapSize / (1024 * 1024)
      const limitMB = memoryInfo.jsHeapSizeLimit / (1024 * 1024)

      // Check for high memory usage
      if (usedMB > this.THRESHOLDS.MEMORY_USAGE_MB) {
        await this.createAlert({
          event_type: MonitoringEventType.MEMORY_USAGE_HIGH,
          severity: usedMB > limitMB * 0.9 ? AlertSeverity.CRITICAL : AlertSeverity.WARNING,
          message: `High memory usage: ${usedMB.toFixed(2)}MB / ${limitMB.toFixed(2)}MB`,
          context: { 
            used_mb: usedMB,
            total_mb: totalMB,
            limit_mb: limitMB,
            usage_percent: (usedMB / limitMB) * 100
          }
        })
      }

      // Detect potential memory leaks
      const cachedUsage = this.metricsCache.get('memory_usage') || []
      cachedUsage.push({ timestamp: Date.now(), usage: usedMB })
      
      // Keep only last 10 measurements
      if (cachedUsage.length > 10) {
        cachedUsage.shift()
      }
      this.metricsCache.set('memory_usage', cachedUsage)

      // Check for memory leak pattern (consistent increase)
      if (cachedUsage.length >= 5) {
        const isIncreasingTrend = this.detectMemoryLeak(cachedUsage)
        if (isIncreasingTrend) {
          await this.createAlert({
            event_type: MonitoringEventType.MEMORY_LEAK_DETECTED,
            severity: AlertSeverity.ERROR,
            message: 'Potential memory leak detected: consistent memory usage increase',
            context: { memory_history: cachedUsage }
          })
        }
      }

      // Send metrics to Sentry using available methods
      try {
        Sentry.setTag('memory.used_mb', String(Math.floor(usedMB)))
        Sentry.setTag('memory.usage_percent', String(Math.floor((usedMB / limitMB) * 100)))
        Sentry.setMeasurement('memory.used_mb', usedMB)
        Sentry.setMeasurement('memory.usage_percent', (usedMB / limitMB) * 100)
      } catch (error) {
        // Ignore Sentry tagging errors
      }

    } catch (error) {
      console.error('Failed to check memory usage:', error)
      Sentry.captureException(error)
    }
  }

  /**
   * Perform comprehensive system health check
   */
  private async performHealthCheck(): Promise<SystemHealthMetrics> {
    try {
      const [
        errorRate,
        avgResponseTime,
        activeUsers,
        dailyReports,
        attendanceRecords,
        documentUploads
      ] = await Promise.all([
        this.calculateErrorRate(),
        this.calculateAverageResponseTime(),
        this.countActiveUsers(),
        this.countDailyReportsToday(),
        this.countAttendanceRecordsToday(),
        this.countDocumentUploadsToday()
      ])

      const healthMetrics: SystemHealthMetrics = {
        error_rate: errorRate,
        avg_response_time: avgResponseTime,
        active_users: activeUsers,
        database_connections: 0, // Would need monitoring setup
        memory_usage_mb: 0, // Calculated separately
        cpu_usage_percent: 0, // Would need monitoring setup
        daily_reports_created_today: dailyReports,
        attendance_records_today: attendanceRecords,
        document_uploads_today: documentUploads,
        offline_sync_failures: 0 // Would track from sync events
      }

      // Check health thresholds
      if (errorRate > this.THRESHOLDS.ERROR_RATE_PERCENT) {
        await this.createAlert({
          event_type: MonitoringEventType.HIGH_ERROR_RATE,
          severity: AlertSeverity.CRITICAL,
          message: `High error rate detected: ${errorRate}%`,
          context: { health_metrics: healthMetrics }
        })
      }

      // Send health metrics to analytics
      await this.recordHealthMetrics(healthMetrics)

      return healthMetrics

    } catch (error) {
      console.error('Health check failed:', error)
      Sentry.captureException(error)
      throw error
    }
  }

  /**
   * Collect construction-specific metrics
   */
  private async collectConstructionMetrics(): Promise<ConstructionMetrics> {
    try {
      const [dailyReportsMetrics, attendanceMetrics, documentsMetrics, sitesMetrics] = await Promise.all([
        this.getDailyReportsMetrics(),
        this.getAttendanceMetrics(),
        this.getDocumentsMetrics(),
        this.getSitesMetrics()
      ])

      const constructionMetrics: ConstructionMetrics = {
        daily_reports: dailyReportsMetrics,
        attendance: attendanceMetrics,
        documents: documentsMetrics,
        sites: sitesMetrics
      }

      // Send to Sentry for tracking
      Sentry.addBreadcrumb({
        category: 'metrics.construction',
        message: 'Construction metrics collected',
        data: constructionMetrics,
        level: 'info'
      })

      // Store in analytics
      await this.supabase
        .from('analytics_events')
        .insert({
          event_type: 'construction_metrics',
          metadata: constructionMetrics,
          created_at: new Date().toISOString()
        })

      return constructionMetrics

    } catch (error) {
      console.error('Failed to collect construction metrics:', error)
      Sentry.captureException(error)
      throw error
    }
  }

  /**
   * Create monitoring alert
   */
  private async createAlert(alertData: Omit<MonitoringAlert, 'id' | 'timestamp' | 'resolved'>): Promise<void> {
    const alert: MonitoringAlert = {
      id: crypto.randomUUID(),
      ...alertData,
      timestamp: new Date().toISOString(),
      resolved: false
    }

    // Add to processing queue
    this.alertQueue.push(alert)

    // Log to Sentry
    const sentryLevel = this.mapSeverityToSentryLevel(alert.severity)
    Sentry.captureMessage(
      `Monitoring Alert: ${alert.event_type}`,
      {
        level: sentryLevel,
        tags: {
          monitoring_event: alert.event_type,
          severity: alert.severity,
          system: 'construction-management'
        },
        extra: alert.context
      }
    )

    // Process immediately for critical alerts
    if (alert.severity === AlertSeverity.CRITICAL) {
      await this.processAlert(alert)
    }

    console.warn(`🚨 Monitoring Alert [${alert.severity}]: ${alert.event_type} - ${alert.message}`)
  }

  /**
   * Process monitoring alert
   */
  private async processAlert(alert: MonitoringAlert): Promise<void> {
    try {
      // Store in database
      await this.supabase
        .from('analytics_events')
        .insert({
          event_type: 'monitoring_alert',
          user_id: alert.user_id || null,
          site_id: alert.site_id || null,
          metadata: {
            alert_id: alert.id,
            event_type: alert.event_type,
            severity: alert.severity,
            message: alert.message,
            context: alert.context
          }
        })

      // Send notifications for critical alerts
      if (alert.severity === AlertSeverity.CRITICAL) {
        await this.sendCriticalAlertNotification(alert)
      }

      // Automatic remediation actions
      await this.executeAutomaticRemediation(alert)

    } catch (error) {
      console.error('Failed to process monitoring alert:', error)
      Sentry.captureException(error)
    }
  }

  /**
   * Integrate monitoring with security manager
   */
  private async correlateSecurityAndPerformance(): Promise<void> {
    try {
      // Get recent security alerts
      const securityAlerts = await securityManager.getActiveAlerts()
      
      // Get recent performance metrics
      const performanceMetrics = performanceTracker.getPerformanceSummary()
      
      // Look for correlations
      if (securityAlerts.length > 0 && performanceMetrics.apiResponseTime?.p95 > this.THRESHOLDS.API_RESPONSE_TIME_MS) {
        await this.createAlert({
          event_type: MonitoringEventType.API_TIMEOUT,
          severity: AlertSeverity.ERROR,
          message: 'Performance degradation detected during security events',
          context: {
            security_alerts_count: securityAlerts.length,
            performance_metrics: performanceMetrics,
            correlation: 'security_performance'
          }
        })
      }

    } catch (error) {
      console.error('Failed to correlate security and performance:', error)
      Sentry.captureException(error)
    }
  }

  /**
   * Utility methods for metrics calculation
   */
  private async calculateErrorRate(): Promise<number> {
    const { data } = await this.supabase
      .from('analytics_events')
      .select('event_type', { count: 'exact' })
      .in('event_type', ['error', 'api_error'])
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())

    const { data: totalEvents } = await this.supabase
      .from('analytics_events')
      .select('id', { count: 'exact' })
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())

    const errorCount = data?.length || 0
    const totalCount = totalEvents?.length || 0

    return totalCount > 0 ? (errorCount / totalCount) * 100 : 0
  }

  private async calculateAverageResponseTime(): Promise<number> {
    const metrics = performanceTracker.getPerformanceSummary()
    return metrics.apiResponseTime?.avg || 0
  }

  private async countActiveUsers(): Promise<number> {
    const { data } = await this.supabase
      .from('analytics_events')
      .select('user_id')
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())

    const uniqueUsers = new Set(data?.map(event => event.user_id).filter(Boolean))
    return uniqueUsers.size
  }

  private async countDailyReportsToday(): Promise<number> {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await this.supabase
      .from('daily_reports')
      .select('id', { count: 'exact' })
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`)

    return data?.length || 0
  }

  private async countAttendanceRecordsToday(): Promise<number> {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await this.supabase
      .from('attendance_records')
      .select('id', { count: 'exact' })
      .gte('check_in_time', `${today}T00:00:00.000Z`)

    return data?.length || 0
  }

  private async countDocumentUploadsToday(): Promise<number> {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await this.supabase
      .from('documents')
      .select('id', { count: 'exact' })
      .gte('created_at', `${today}T00:00:00.000Z`)

    return data?.length || 0
  }

  // Additional helper methods would go here...
  private mapSeverityToSentryLevel(severity: AlertSeverity): 'info' | 'warning' | 'error' | 'fatal' {
    switch (severity) {
      case AlertSeverity.INFO: return 'info'
      case AlertSeverity.WARNING: return 'warning'
      case AlertSeverity.ERROR: return 'error'
      case AlertSeverity.CRITICAL: return 'fatal'
    }
  }

  private calculatePerformanceTrends(metrics: any[]): any {
    // Implementation for trend calculation
    return { api_response_time: { trend: 'stable', change: 0 } }
  }

  private detectMemoryLeak(usageHistory: any[]): boolean {
    // Simple leak detection: check if memory consistently increases
    if (usageHistory.length < 5) return false
    
    let increasingCount = 0
    for (let i = 1; i < usageHistory.length; i++) {
      if (usageHistory[i].usage > usageHistory[i-1].usage) {
        increasingCount++
      }
    }
    
    return increasingCount >= usageHistory.length * 0.8 // 80% increasing
  }

  private async recordHealthMetrics(metrics: SystemHealthMetrics): Promise<void> {
    await this.supabase
      .from('analytics_events')
      .insert({
        event_type: 'system_health',
        metadata: metrics,
        created_at: new Date().toISOString()
      })
  }

  private async getDailyReportsMetrics(): Promise<any> {
    // Implementation for daily reports metrics
    return { created_today: 0, avg_creation_time_ms: 0, failed_today: 0 }
  }

  private async getAttendanceMetrics(): Promise<any> {
    // Implementation for attendance metrics
    return { records_today: 0, avg_check_in_time_ms: 0, sync_failures: 0 }
  }

  private async getDocumentsMetrics(): Promise<any> {
    // Implementation for documents metrics
    return { uploads_today: 0, avg_upload_time_ms: 0, failed_uploads: 0, storage_used_mb: 0 }
  }

  private async getSitesMetrics(): Promise<any> {
    // Implementation for sites metrics
    return { active_sites: 0, users_per_site: {}, avg_activity_per_site: 0 }
  }

  private async checkDatabaseHealth(): Promise<void> {
    // Implementation for database health check
  }

  private async checkApiHealth(): Promise<void> {
    // Implementation for API health check
  }

  private async analyzeUserActivity(): Promise<void> {
    // Implementation for user activity analysis
  }

  private async analyzeSitePerformance(): Promise<void> {
    // Implementation for site performance analysis
  }

  private async sendCriticalAlertNotification(alert: MonitoringAlert): Promise<void> {
    // Implementation for critical alert notifications
    const webhookUrl = process.env.MONITORING_WEBHOOK_URL
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨 CRITICAL Monitoring Alert: ${alert.event_type}`,
            alert: alert
          })
        })
      } catch (error) {
        console.error('Failed to send critical alert notification:', error)
      }
    }
  }

  private async executeAutomaticRemediation(alert: MonitoringAlert): Promise<void> {
    // Implementation for automatic remediation based on alert type
    switch (alert.event_type) {
      case MonitoringEventType.MEMORY_USAGE_HIGH:
        // Trigger garbage collection if possible
        if (global.gc) {
          global.gc()
        }
        break
      case MonitoringEventType.API_TIMEOUT:
        // Could implement circuit breaker pattern
        break
    }
  }

  /**
   * Public API methods
   */
  async getSystemHealth(): Promise<SystemHealthMetrics> {
    return await this.performHealthCheck()
  }

  async getConstructionMetrics(): Promise<ConstructionMetrics> {
    return await this.collectConstructionMetrics()
  }

  async getActiveAlerts(): Promise<MonitoringAlert[]> {
    return this.alertQueue.filter(alert => !alert.resolved)
  }

  async resolveAlert(alertId: string): Promise<void> {
    const alert = this.alertQueue.find(a => a.id === alertId)
    if (alert) {
      alert.resolved = true
      alert.resolved_at = new Date().toISOString()
    }
  }

  /**
   * Stop all monitoring intervals - CRITICAL for preventing memory leaks
   */
  stopMonitoring(): void {
    console.log('🛑 [MONITORING-MANAGER] Stopping all monitoring intervals...')
    this.isMonitoring = false
    
    // Clear all intervals
    this.intervalIds.forEach(intervalId => {
      clearInterval(intervalId)
    })
    this.intervalIds = []
    
    console.log('✅ [MONITORING-MANAGER] All monitoring intervals stopped')
  }
}

// Export singleton instance
export const monitoringManager = MonitoringManager.getInstance()