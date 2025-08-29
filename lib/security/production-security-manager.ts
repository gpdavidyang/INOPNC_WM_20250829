/**
 * Production Security Manager for INOPNC Work Management System
 * Implements comprehensive security monitoring, threat detection, and incident response
 */

import { createClient } from '@/lib/supabase/client'
import * as Sentry from '@sentry/nextjs'

// Security threat levels
export enum ThreatLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Security event types
export enum SecurityEventType {
  FAILED_LOGIN = 'FAILED_LOGIN',
  SUSPICIOUS_IP = 'SUSPICIOUS_IP',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  DATA_EXPORT_LARGE = 'DATA_EXPORT_LARGE',
  PRIVILEGE_ESCALATION = 'PRIVILEGE_ESCALATION',
  UNUSUAL_ACTIVITY = 'UNUSUAL_ACTIVITY',
  BRUTE_FORCE_ATTACK = 'BRUTE_FORCE_ATTACK',
  SQL_INJECTION_ATTEMPT = 'SQL_INJECTION_ATTEMPT',
  XSS_ATTEMPT = 'XSS_ATTEMPT'
}

// Security configuration thresholds
const SECURITY_THRESHOLDS = {
  FAILED_LOGINS_PER_HOUR: 5,
  FAILED_LOGINS_PER_DAY: 20,
  REQUESTS_PER_MINUTE: 60,
  CONCURRENT_SESSIONS: 3,
  DATA_EXPORT_SIZE_MB: 100,
  SUSPICIOUS_IP_REQUESTS: 100,
  UNUSUAL_ACTIVITY_THRESHOLD: 50
} as const

interface SecurityAlert {
  id: string
  event_type: SecurityEventType
  threat_level: ThreatLevel
  user_id?: string
  ip_address?: string
  user_agent?: string
  details: Record<string, any>
  created_at: string
  resolved: boolean
  resolved_at?: string
  resolved_by?: string
}

interface SecurityMetrics {
  failed_logins_last_hour: number
  failed_logins_last_24h: number
  suspicious_ips: number
  active_threats: number
  resolved_threats_today: number
  avg_threat_resolution_time: number
}

export class ProductionSecurityManager {
  private static instance: ProductionSecurityManager
  private supabase = createClient()
  private alertQueue: SecurityAlert[] = []
  private isMonitoring = false

  private constructor() {}

  static getInstance(): ProductionSecurityManager {
    if (!ProductionSecurityManager.instance) {
      ProductionSecurityManager.instance = new ProductionSecurityManager()
    }
    return ProductionSecurityManager.instance
  }

  /**
   * Start continuous security monitoring
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) return

    this.isMonitoring = true
    console.log('🛡️ Production Security Manager started')

    // Monitor every 30 seconds
    setInterval(async () => {
      await this.performSecurityChecks()
    }, 30000)

    // Process alert queue every 10 seconds
    setInterval(async () => {
      await this.processAlertQueue()
    }, 10000)

    // Daily security report
    setInterval(async () => {
      await this.generateDailySecurityReport()
    }, 24 * 60 * 60 * 1000)
  }

  /**
   * Perform comprehensive security checks
   */
  private async performSecurityChecks(): Promise<void> {
    try {
      await Promise.all([
        this.checkFailedLogins(),
        this.checkSuspiciousIPs(),
        this.checkUnusualActivity(),
        this.checkLargeDataExports(),
        this.checkConcurrentSessions(),
        this.checkRateLimits()
      ])
    } catch (error) {
      console.error('Security check failed:', error)
      Sentry.captureException(error)
    }
  }

  /**
   * Check for failed login attempts
   */
  private async checkFailedLogins(): Promise<void> {
    const { data: failedLogins } = await this.supabase
      .from('activity_logs')
      .select('user_email, ip_address, created_at')
      .eq('action', 'LOGIN')
      .eq('details->success', false)
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())

    if (!failedLogins) return

    // Group by IP and email
    const ipAttempts = new Map<string, number>()
    const emailAttempts = new Map<string, number>()

    failedLogins.forEach(attempt => {
      if (attempt.ip_address) {
        ipAttempts.set(attempt.ip_address, (ipAttempts.get(attempt.ip_address) || 0) + 1)
      }
      if (attempt.user_email) {
        emailAttempts.set(attempt.user_email, (emailAttempts.get(attempt.user_email) || 0) + 1)
      }
    })

    // Check for brute force attempts
    for (const [ip, attempts] of ipAttempts) {
      if (attempts >= SECURITY_THRESHOLDS.FAILED_LOGINS_PER_HOUR) {
        await this.createSecurityAlert({
          event_type: SecurityEventType.BRUTE_FORCE_ATTACK,
          threat_level: attempts >= 10 ? ThreatLevel.CRITICAL : ThreatLevel.HIGH,
          ip_address: ip,
          details: {
            attempts,
            timeframe: '1_hour',
            action_required: 'IP_BLOCK'
          }
        })
      }
    }

    // Check for account compromise attempts
    for (const [email, attempts] of emailAttempts) {
      if (attempts >= SECURITY_THRESHOLDS.FAILED_LOGINS_PER_HOUR) {
        await this.createSecurityAlert({
          event_type: SecurityEventType.FAILED_LOGIN,
          threat_level: attempts >= 10 ? ThreatLevel.HIGH : ThreatLevel.MEDIUM,
          details: {
            user_email: email,
            attempts,
            timeframe: '1_hour',
            action_required: 'ACCOUNT_LOCK'
          }
        })
      }
    }
  }

  /**
   * Check for suspicious IP addresses
   */
  private async checkSuspiciousIPs(): Promise<void> {
    const { data: ipActivity } = await this.supabase
      .from('activity_logs')
      .select('ip_address, user_id, action, created_at')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    if (!ipActivity) return

    const ipStats = new Map<string, {
      unique_users: Set<string>
      total_requests: number
      suspicious_actions: number
      countries?: string[]
    }>()

    ipActivity.forEach(activity => {
      if (!activity.ip_address || activity.ip_address === '127.0.0.1') return

      const ip = activity.ip_address
      if (!ipStats.has(ip)) {
        ipStats.set(ip, {
          unique_users: new Set(),
          total_requests: 0,
          suspicious_actions: 0
        })
      }

      const stats = ipStats.get(ip)!
      if (activity.user_id) stats.unique_users.add(activity.user_id)
      stats.total_requests++

      // Count suspicious actions
      if (['DELETE', 'EXPORT', 'ROLE_CHANGE'].includes(activity.action)) {
        stats.suspicious_actions++
      }
    })

    // Analyze suspicious patterns
    for (const [ip, stats] of ipStats) {
      const uniqueUsers = stats.unique_users.size
      const totalRequests = stats.total_requests
      const suspiciousActions = stats.suspicious_actions

      // Multiple users from same IP
      if (uniqueUsers > 5) {
        await this.createSecurityAlert({
          event_type: SecurityEventType.SUSPICIOUS_IP,
          threat_level: ThreatLevel.MEDIUM,
          ip_address: ip,
          details: {
            unique_users: uniqueUsers,
            total_requests: totalRequests,
            pattern: 'MULTIPLE_USERS_SAME_IP'
          }
        })
      }

      // High request volume
      if (totalRequests > SECURITY_THRESHOLDS.SUSPICIOUS_IP_REQUESTS) {
        await this.createSecurityAlert({
          event_type: SecurityEventType.RATE_LIMIT_EXCEEDED,
          threat_level: ThreatLevel.HIGH,
          ip_address: ip,
          details: {
            total_requests: totalRequests,
            timeframe: '24_hours',
            pattern: 'HIGH_REQUEST_VOLUME'
          }
        })
      }

      // High number of suspicious actions
      if (suspiciousActions > 5) {
        await this.createSecurityAlert({
          event_type: SecurityEventType.SUSPICIOUS_IP,
          threat_level: ThreatLevel.HIGH,
          ip_address: ip,
          details: {
            suspicious_actions: suspiciousActions,
            total_requests: totalRequests,
            pattern: 'HIGH_RISK_ACTIONS'
          }
        })
      }
    }
  }

  /**
   * Check for unusual user activity patterns
   */
  private async checkUnusualActivity(): Promise<void> {
    // Get user activity patterns for the last 7 days vs last 24 hours
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const { data: historicalActivity } = await this.supabase
      .from('activity_logs')
      .select('user_id, action, created_at')
      .gte('created_at', sevenDaysAgo.toISOString())
      .lt('created_at', oneDayAgo.toISOString())

    const { data: recentActivity } = await this.supabase
      .from('activity_logs')
      .select('user_id, action, created_at')
      .gte('created_at', oneDayAgo.toISOString())

    if (!historicalActivity || !recentActivity) return

    // Calculate baseline activity per user
    const userBaselines = new Map<string, number>()
    historicalActivity.forEach(activity => {
      if (activity.user_id) {
        userBaselines.set(
          activity.user_id,
          (userBaselines.get(activity.user_id) || 0) + 1
        )
      }
    })

    // Calculate recent activity per user
    const userRecent = new Map<string, number>()
    recentActivity.forEach(activity => {
      if (activity.user_id) {
        userRecent.set(
          activity.user_id,
          (userRecent.get(activity.user_id) || 0) + 1
        )
      }
    })

    // Check for unusual spikes
    for (const [userId, recentCount] of userRecent) {
      const baseline = userBaselines.get(userId) || 0
      const dailyBaseline = baseline / 6 // Average per day over 6 days

      // If recent activity is 5x the baseline, flag as unusual
      if (recentCount > dailyBaseline * 5 && recentCount > SECURITY_THRESHOLDS.UNUSUAL_ACTIVITY_THRESHOLD) {
        await this.createSecurityAlert({
          event_type: SecurityEventType.UNUSUAL_ACTIVITY,
          threat_level: ThreatLevel.MEDIUM,
          user_id: userId,
          details: {
            recent_activity: recentCount,
            baseline_activity: Math.round(dailyBaseline),
            spike_ratio: Math.round(recentCount / Math.max(dailyBaseline, 1)),
            timeframe: '24_hours'
          }
        })
      }
    }
  }

  /**
   * Check for large data exports
   */
  private async checkLargeDataExports(): Promise<void> {
    const { data: exports } = await this.supabase
      .from('data_exports')
      .select('user_id, export_type, file_size_bytes, created_at')
      .gte('started_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .gt('file_size_bytes', SECURITY_THRESHOLDS.DATA_EXPORT_SIZE_MB * 1024 * 1024)

    if (!exports) return

    for (const exportRecord of exports) {
      const sizeMB = Math.round(exportRecord.file_size_bytes / (1024 * 1024))
      
      await this.createSecurityAlert({
        event_type: SecurityEventType.DATA_EXPORT_LARGE,
        threat_level: sizeMB > 500 ? ThreatLevel.HIGH : ThreatLevel.MEDIUM,
        user_id: exportRecord.user_id,
        details: {
          export_type: exportRecord.export_type,
          file_size_mb: sizeMB,
          threshold_mb: SECURITY_THRESHOLDS.DATA_EXPORT_SIZE_MB,
          requires_review: true
        }
      })
    }
  }

  /**
   * Check for concurrent session violations
   */
  private async checkConcurrentSessions(): Promise<void> {
    // This would require session tracking in the database
    // For now, we'll implement a simplified version based on login events
    const { data: recentLogins } = await this.supabase
      .from('activity_logs')
      .select('user_id, ip_address, user_agent, created_at')
      .eq('action', 'LOGIN')
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())

    if (!recentLogins) return

    const userSessions = new Map<string, Set<string>>()
    
    recentLogins.forEach(login => {
      if (login.user_id) {
        if (!userSessions.has(login.user_id)) {
          userSessions.set(login.user_id, new Set())
        }
        // Use IP + User Agent as session identifier
        userSessions.get(login.user_id)!.add(`${login.ip_address}:${login.user_agent}`)
      }
    })

    for (const [userId, sessions] of userSessions) {
      if (sessions.size > SECURITY_THRESHOLDS.CONCURRENT_SESSIONS) {
        await this.createSecurityAlert({
          event_type: SecurityEventType.UNUSUAL_ACTIVITY,
          threat_level: ThreatLevel.MEDIUM,
          user_id: userId,
          details: {
            concurrent_sessions: sessions.size,
            threshold: SECURITY_THRESHOLDS.CONCURRENT_SESSIONS,
            pattern: 'MULTIPLE_CONCURRENT_SESSIONS'
          }
        })
      }
    }
  }

  /**
   * Check for rate limit violations
   */
  private async checkRateLimits(): Promise<void> {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000)
    
    const { data: recentActivity } = await this.supabase
      .from('activity_logs')
      .select('user_id, ip_address, created_at')
      .gte('created_at', oneMinuteAgo.toISOString())

    if (!recentActivity) return

    const ipRequests = new Map<string, number>()
    const userRequests = new Map<string, number>()

    recentActivity.forEach(activity => {
      if (activity.ip_address) {
        ipRequests.set(activity.ip_address, (ipRequests.get(activity.ip_address) || 0) + 1)
      }
      if (activity.user_id) {
        userRequests.set(activity.user_id, (userRequests.get(activity.user_id) || 0) + 1)
      }
    })

    // Check IP-based rate limits
    for (const [ip, requests] of ipRequests) {
      if (requests > SECURITY_THRESHOLDS.REQUESTS_PER_MINUTE) {
        await this.createSecurityAlert({
          event_type: SecurityEventType.RATE_LIMIT_EXCEEDED,
          threat_level: ThreatLevel.MEDIUM,
          ip_address: ip,
          details: {
            requests_per_minute: requests,
            threshold: SECURITY_THRESHOLDS.REQUESTS_PER_MINUTE,
            timeframe: '1_minute'
          }
        })
      }
    }

    // Check user-based rate limits
    for (const [userId, requests] of userRequests) {
      if (requests > SECURITY_THRESHOLDS.REQUESTS_PER_MINUTE) {
        await this.createSecurityAlert({
          event_type: SecurityEventType.RATE_LIMIT_EXCEEDED,
          threat_level: ThreatLevel.MEDIUM,
          user_id: userId,
          details: {
            requests_per_minute: requests,
            threshold: SECURITY_THRESHOLDS.REQUESTS_PER_MINUTE,
            timeframe: '1_minute'
          }
        })
      }
    }
  }

  /**
   * Create a security alert
   */
  private async createSecurityAlert(alert: Omit<SecurityAlert, 'id' | 'created_at' | 'resolved'>): Promise<void> {
    const securityAlert: SecurityAlert = {
      id: crypto.randomUUID(),
      ...alert,
      created_at: new Date().toISOString(),
      resolved: false
    }

    // Add to queue for processing
    this.alertQueue.push(securityAlert)

    // Log to Sentry based on threat level
    const sentryLevel = this.mapThreatLevelToSentry(alert.threat_level)
    Sentry.captureMessage(
      `Security Alert: ${alert.event_type}`,
      {
        level: sentryLevel,
        tags: {
          security_event: alert.event_type,
          threat_level: alert.threat_level
        },
        extra: alert.details
      }
    )

    console.warn(`🚨 Security Alert [${alert.threat_level}]: ${alert.event_type}`, alert.details)
  }

  /**
   * Process the alert queue
   */
  private async processAlertQueue(): Promise<void> {
    if (this.alertQueue.length === 0) return

    const alertsToProcess = [...this.alertQueue]
    this.alertQueue = []

    for (const alert of alertsToProcess) {
      try {
        await this.handleSecurityAlert(alert)
      } catch (error) {
        console.error('Failed to process security alert:', error)
        // Return alert to queue for retry
        this.alertQueue.push(alert)
      }
    }
  }

  /**
   * Handle a security alert
   */
  private async handleSecurityAlert(alert: SecurityAlert): Promise<void> {
    // Store alert in database
    await this.supabase
      .from('activity_logs')
      .insert({
        entity_type: 'security_alert',
        entity_id: alert.id,
        action: 'SECURITY_ALERT',
        user_id: alert.user_id || null,
        details: {
          event_type: alert.event_type,
          threat_level: alert.threat_level,
          ip_address: alert.ip_address,
          ...alert.details
        },
        severity: this.mapThreatLevelToSeverity(alert.threat_level),
        ip_address: alert.ip_address
      })

    // Send notifications based on threat level
    if (alert.threat_level === ThreatLevel.CRITICAL || alert.threat_level === ThreatLevel.HIGH) {
      await this.sendImmediateNotification(alert)
    }

    // Automatic response actions
    await this.executeAutomaticResponse(alert)
  }

  /**
   * Send immediate notification for high-priority alerts
   */
  private async sendImmediateNotification(alert: SecurityAlert): Promise<void> {
    // In production, this would integrate with:
    // - Slack notifications
    // - SMS alerts
    // - Email notifications
    // - PagerDuty/OpsGenie

    const webhookUrl = process.env.SECURITY_WEBHOOK_URL
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨 Security Alert [${alert.threat_level}]: ${alert.event_type}`,
            attachments: [{
              color: alert.threat_level === ThreatLevel.CRITICAL ? 'danger' : 'warning',
              fields: [
                { title: 'Event Type', value: alert.event_type, short: true },
                { title: 'Threat Level', value: alert.threat_level, short: true },
                { title: 'User ID', value: alert.user_id || 'N/A', short: true },
                { title: 'IP Address', value: alert.ip_address || 'N/A', short: true },
                { title: 'Details', value: JSON.stringify(alert.details, null, 2), short: false }
              ]
            }]
          })
        })
      } catch (error) {
        console.error('Failed to send webhook notification:', error)
      }
    }
  }

  /**
   * Execute automatic response actions
   */
  private async executeAutomaticResponse(alert: SecurityAlert): Promise<void> {
    switch (alert.event_type) {
      case SecurityEventType.BRUTE_FORCE_ATTACK:
        if (alert.threat_level === ThreatLevel.CRITICAL) {
          // In production: temporarily block IP
          console.log(`🛡️ Would block IP: ${alert.ip_address}`)
        }
        break

      case SecurityEventType.DATA_EXPORT_LARGE:
        if (alert.threat_level === ThreatLevel.HIGH) {
          // In production: require additional approval
          console.log(`🛡️ Large export flagged for review: ${alert.user_id}`)
        }
        break

      case SecurityEventType.UNUSUAL_ACTIVITY:
        if (alert.threat_level === ThreatLevel.HIGH) {
          // In production: require re-authentication
          console.log(`🛡️ Would require re-auth for user: ${alert.user_id}`)
        }
        break
    }
  }

  /**
   * Get current security metrics
   */
  async getSecurityMetrics(): Promise<SecurityMetrics> {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const [
      failedLoginsHour,
      failedLogins24h,
      suspiciousIps,
      activeThreats,
      resolvedToday
    ] = await Promise.all([
      this.supabase
        .from('activity_logs')
        .select('id', { count: 'exact' })
        .eq('action', 'LOGIN')
        .eq('details->success', false)
        .gte('created_at', oneHourAgo.toISOString()),

      this.supabase
        .from('activity_logs')
        .select('id', { count: 'exact' })
        .eq('action', 'LOGIN')
        .eq('details->success', false)
        .gte('created_at', oneDayAgo.toISOString()),

      this.supabase
        .from('activity_logs')
        .select('ip_address', { count: 'exact' })
        .eq('entity_type', 'security_alert')
        .eq('details->event_type', SecurityEventType.SUSPICIOUS_IP)
        .gte('created_at', oneDayAgo.toISOString()),

      this.supabase
        .from('activity_logs')
        .select('id', { count: 'exact' })
        .eq('entity_type', 'security_alert')
        .in('severity', ['WARN', 'ERROR', 'CRITICAL'])
        .gte('created_at', oneDayAgo.toISOString()),

      this.supabase
        .from('activity_logs')
        .select('id', { count: 'exact' })
        .eq('entity_type', 'security_alert')
        .eq('action', 'RESOLVED')
        .gte('created_at', oneDayAgo.toISOString())
    ])

    return {
      failed_logins_last_hour: failedLoginsHour.count || 0,
      failed_logins_last_24h: failedLogins24h.count || 0,
      suspicious_ips: suspiciousIps.count || 0,
      active_threats: activeThreats.count || 0,
      resolved_threats_today: resolvedToday.count || 0,
      avg_threat_resolution_time: 0 // Would need additional calculation
    }
  }

  /**
   * Generate daily security report
   */
  private async generateDailySecurityReport(): Promise<void> {
    const metrics = await this.getSecurityMetrics()
    
    console.log('📊 Daily Security Report:', {
      date: new Date().toISOString().split('T')[0],
      ...metrics
    })

    // In production, this would:
    // - Send email report to security team
    // - Update security dashboard
    // - Store historical metrics
  }

  /**
   * Utility functions
   */
  private mapThreatLevelToSentry(level: ThreatLevel): 'info' | 'warning' | 'error' | 'fatal' {
    switch (level) {
      case ThreatLevel.LOW: return 'info'
      case ThreatLevel.MEDIUM: return 'warning'
      case ThreatLevel.HIGH: return 'error'
      case ThreatLevel.CRITICAL: return 'fatal'
    }
  }

  private mapThreatLevelToSeverity(level: ThreatLevel): string {
    switch (level) {
      case ThreatLevel.LOW: return 'INFO'
      case ThreatLevel.MEDIUM: return 'WARN'
      case ThreatLevel.HIGH: return 'ERROR'
      case ThreatLevel.CRITICAL: return 'CRITICAL'
    }
  }

  /**
   * Public methods for manual security operations
   */
  async resolveAlert(alertId: string, resolvedBy: string): Promise<void> {
    await this.supabase
      .from('activity_logs')
      .insert({
        entity_type: 'security_alert',
        entity_id: alertId,
        action: 'RESOLVED',
        user_id: resolvedBy,
        details: { resolved_at: new Date().toISOString() },
        severity: 'INFO'
      })
  }

  async getActiveAlerts(): Promise<SecurityAlert[]> {
    const { data } = await this.supabase
      .from('activity_logs')
      .select('*')
      .eq('entity_type', 'security_alert')
      .eq('action', 'SECURITY_ALERT')
      .in('severity', ['WARN', 'ERROR', 'CRITICAL'])
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })

    return data?.map(log => ({
      id: log.entity_id,
      event_type: log.details.event_type,
      threat_level: log.details.threat_level,
      user_id: log.user_id,
      ip_address: log.details.ip_address,
      user_agent: log.user_agent,
      details: log.details,
      created_at: log.created_at,
      resolved: false
    })) || []
  }

  async blockIP(ipAddress: string, reason: string, blockedBy: string): Promise<void> {
    // In production, this would integrate with firewall/CDN
    await this.supabase
      .from('activity_logs')
      .insert({
        entity_type: 'security_action',
        entity_id: ipAddress,
        action: 'IP_BLOCKED',
        user_id: blockedBy,
        details: { ip_address: ipAddress, reason },
        severity: 'WARN'
      })

    console.log(`🚫 IP ${ipAddress} blocked by ${blockedBy}: ${reason}`)
  }
}

// Export singleton instance
export const securityManager = ProductionSecurityManager.getInstance()