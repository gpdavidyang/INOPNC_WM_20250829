/**
 * Automated Alerting Manager for INOPNC Work Management System
 * Handles alert routing, notifications, and escalation policies
 */

import * as Sentry from '@sentry/nextjs'
import { createClient } from '@/lib/supabase/client'

export enum AlertChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  SLACK = 'SLACK',
  WEBHOOK = 'WEBHOOK',
  PUSH_NOTIFICATION = 'PUSH_NOTIFICATION',
  DASHBOARD = 'DASHBOARD'
}

export enum AlertSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

export enum AlertCategory {
  PERFORMANCE = 'PERFORMANCE',
  SECURITY = 'SECURITY',
  CONSTRUCTION = 'CONSTRUCTION',
  SYSTEM = 'SYSTEM',
  DATABASE = 'DATABASE',
  USER_EXPERIENCE = 'USER_EXPERIENCE'
}

interface AlertRule {
  id: string
  name: string
  category: AlertCategory
  severity: AlertSeverity
  condition: {
    metric: string
    operator: '>' | '<' | '>=' | '<=' | '==' | '!='
    threshold: number
    timeWindow: number // in minutes
  }
  channels: AlertChannel[]
  escalationPolicy?: {
    escalateAfter: number // minutes
    escalateTo: AlertChannel[]
  }
  enabled: boolean
  cooldownPeriod: number // minutes
}

interface Alert {
  id: string
  ruleId: string
  severity: AlertSeverity
  category: AlertCategory
  title: string
  message: string
  context: Record<string, unknown>
  timestamp: string
  resolved: boolean
  resolvedAt?: string
  escalated: boolean
  escalatedAt?: string
  acknowledgments: Array<{
    userId: string
    timestamp: string
    note?: string
  }>
  notifications: Array<{
    channel: AlertChannel
    sentAt: string
    success: boolean
    error?: string
  }>
}

interface NotificationTemplate {
  channel: AlertChannel
  severity: AlertSeverity
  template: {
    subject?: string
    body: string
    format: 'text' | 'html' | 'markdown'
  }
}

export class AlertingManager {
  private static instance: AlertingManager
  private supabase = createClient()
  private alertRules: Map<string, AlertRule> = new Map()
  private activeAlerts: Map<string, Alert> = new Map()
  private notificationTemplates: Map<string, NotificationTemplate> = new Map()
  private isInitialized = false

  private constructor() {}

  static getInstance(): AlertingManager {
    if (!AlertingManager.instance) {
      AlertingManager.instance = new AlertingManager()
    }
    return AlertingManager.instance
  }

  /**
   * Initialize the alerting system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    // console.log('🚨 Initializing Alerting Manager...')

    await this.loadAlertRules()
    await this.loadNotificationTemplates()
    await this.loadActiveAlerts()

    // Start alert processing loop
    this.startAlertProcessor()

    // Start escalation checker
    this.startEscalationChecker()

    this.isInitialized = true
    // console.log('✅ Alerting Manager initialized successfully')
  }

  /**
   * Create a new alert
   */
  async createAlert(alertData: {
    ruleId: string
    title: string
    message: string
    context?: Record<string, unknown>
    severity?: AlertSeverity
    category?: AlertCategory
  }): Promise<Alert> {
    const rule = this.alertRules.get(alertData.ruleId)
    if (!rule || !rule.enabled) {
      throw new Error(`Alert rule ${alertData.ruleId} not found or disabled`)
    }

    // Check cooldown period
    const existingAlert = this.findExistingAlert(alertData.ruleId, alertData.context)
    if (existingAlert && this.isInCooldown(existingAlert, rule.cooldownPeriod)) {
      // console.log(`Alert ${alertData.ruleId} is in cooldown period, skipping`)
      return existingAlert
    }

    const alert: Alert = {
      id: crypto.randomUUID(),
      ruleId: alertData.ruleId,
      severity: alertData.severity || rule.severity,
      category: alertData.category || rule.category,
      title: alertData.title,
      message: alertData.message,
      context: alertData.context || {},
      timestamp: new Date().toISOString(),
      resolved: false,
      escalated: false,
      acknowledgments: [],
      notifications: []
    }

    // Store alert
    this.activeAlerts.set(alert.id, alert)
    await this.persistAlert(alert)

    // Send notifications
    await this.sendNotifications(alert, rule.channels)

    // Log to Sentry
    Sentry.captureMessage(`Alert created: ${alert.title}`, {
      level: this.mapSeverityToSentryLevel(alert.severity),
      tags: {
        alert_id: alert.id,
        rule_id: alert.ruleId,
        category: alert.category,
        severity: alert.severity
      },
      extra: {
        alert,
        rule
      }
    })

    // console.log(`🚨 Alert created: ${alert.title} [${alert.severity}]`)
    return alert
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string, resolvedBy?: string, note?: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId)
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`)
    }

    if (alert.resolved) {
      return // Already resolved
    }

    alert.resolved = true
    alert.resolvedAt = new Date().toISOString()

    if (resolvedBy) {
      alert.acknowledgments.push({
        userId: resolvedBy,
        timestamp: new Date().toISOString(),
        note: note || 'Alert resolved'
      })
    }

    await this.persistAlert(alert)

    // Send resolution notifications
    const rule = this.alertRules.get(alert.ruleId)
    if (rule) {
      await this.sendResolutionNotifications(alert, rule.channels)
    }

    // Log to Sentry
    Sentry.captureMessage(`Alert resolved: ${alert.title}`, {
      level: 'info',
      tags: {
        alert_id: alert.id,
        rule_id: alert.ruleId,
        resolved_by: resolvedBy
      }
    })

    // console.log(`✅ Alert resolved: ${alert.title}`)
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string, userId: string, note?: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId)
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`)
    }

    // Check if already acknowledged by this user
    const existingAck = alert.acknowledgments.find(ack => ack.userId === userId)
    if (existingAck) {
      return // Already acknowledged
    }

    alert.acknowledgments.push({
      userId,
      timestamp: new Date().toISOString(),
      note
    })

    await this.persistAlert(alert)

    // console.log(`👤 Alert acknowledged by ${userId}: ${alert.title}`)
  }

  /**
   * Load alert rules from configuration
   */
  private async loadAlertRules(): Promise<void> {
    // Default construction-specific alert rules
    const defaultRules: AlertRule[] = [
      {
        id: 'high_api_response_time',
        name: 'High API Response Time',
        category: AlertCategory.PERFORMANCE,
        severity: AlertSeverity.WARNING,
        condition: {
          metric: 'api_response_time_p95',
          operator: '>',
          threshold: 2000, // 2 seconds
          timeWindow: 5
        },
        channels: [AlertChannel.DASHBOARD, AlertChannel.SLACK],
        escalationPolicy: {
          escalateAfter: 15,
          escalateTo: [AlertChannel.EMAIL, AlertChannel.SMS]
        },
        enabled: true,
        cooldownPeriod: 10
      },
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        category: AlertCategory.SYSTEM,
        severity: AlertSeverity.ERROR,
        condition: {
          metric: 'error_rate',
          operator: '>',
          threshold: 5, // 5%
          timeWindow: 5
        },
        channels: [AlertChannel.DASHBOARD, AlertChannel.SLACK, AlertChannel.EMAIL],
        escalationPolicy: {
          escalateAfter: 10,
          escalateTo: [AlertChannel.SMS, AlertChannel.WEBHOOK]
        },
        enabled: true,
        cooldownPeriod: 15
      },
      {
        id: 'daily_report_creation_slow',
        name: 'Daily Report Creation Slow',
        category: AlertCategory.CONSTRUCTION,
        severity: AlertSeverity.WARNING,
        condition: {
          metric: 'daily_report_creation_time',
          operator: '>',
          threshold: 3000, // 3 seconds
          timeWindow: 10
        },
        channels: [AlertChannel.DASHBOARD],
        enabled: true,
        cooldownPeriod: 30
      },
      {
        id: 'attendance_sync_failures',
        name: 'Attendance Sync Failures',
        category: AlertCategory.CONSTRUCTION,
        severity: AlertSeverity.ERROR,
        condition: {
          metric: 'attendance_sync_failures',
          operator: '>',
          threshold: 3,
          timeWindow: 15
        },
        channels: [AlertChannel.DASHBOARD, AlertChannel.EMAIL],
        escalationPolicy: {
          escalateAfter: 30,
          escalateTo: [AlertChannel.SMS]
        },
        enabled: true,
        cooldownPeriod: 20
      },
      {
        id: 'document_upload_failures',
        name: 'Document Upload Failures',
        category: AlertCategory.CONSTRUCTION,
        severity: AlertSeverity.WARNING,
        condition: {
          metric: 'document_upload_failures',
          operator: '>',
          threshold: 5,
          timeWindow: 30
        },
        channels: [AlertChannel.DASHBOARD],
        enabled: true,
        cooldownPeriod: 45
      },
      {
        id: 'critical_security_event',
        name: 'Critical Security Event',
        category: AlertCategory.SECURITY,
        severity: AlertSeverity.CRITICAL,
        condition: {
          metric: 'security_threat_level',
          operator: '>=',
          threshold: 4, // Critical level
          timeWindow: 1
        },
        channels: [AlertChannel.DASHBOARD, AlertChannel.EMAIL, AlertChannel.SMS, AlertChannel.SLACK],
        escalationPolicy: {
          escalateAfter: 5,
          escalateTo: [AlertChannel.WEBHOOK]
        },
        enabled: true,
        cooldownPeriod: 5
      },
      {
        id: 'memory_usage_high',
        name: 'High Memory Usage',
        category: AlertCategory.SYSTEM,
        severity: AlertSeverity.WARNING,
        condition: {
          metric: 'memory_usage_percent',
          operator: '>',
          threshold: 85,
          timeWindow: 10
        },
        channels: [AlertChannel.DASHBOARD, AlertChannel.SLACK],
        escalationPolicy: {
          escalateAfter: 20,
          escalateTo: [AlertChannel.EMAIL]
        },
        enabled: true,
        cooldownPeriod: 30
      }
    ]

    // Load rules into memory
    defaultRules.forEach(rule => {
      this.alertRules.set(rule.id, rule)
    })

    // console.log(`Loaded ${defaultRules.length} alert rules`)
  }

  /**
   * Load notification templates
   */
  private async loadNotificationTemplates(): Promise<void> {
    const templates: NotificationTemplate[] = [
      {
        channel: AlertChannel.EMAIL,
        severity: AlertSeverity.CRITICAL,
        template: {
          subject: '🚨 CRITICAL Alert: {title}',
          body: `
            <h2>Critical Alert: {title}</h2>
            <p><strong>Message:</strong> {message}</p>
            <p><strong>Severity:</strong> {severity}</p>
            <p><strong>Category:</strong> {category}</p>
            <p><strong>Time:</strong> {timestamp}</p>
            <p><strong>System:</strong> INOPNC Construction Management</p>
            <hr>
            <p>This is a critical alert that requires immediate attention.</p>
            <p>Please acknowledge this alert and take appropriate action.</p>
          `,
          format: 'html'
        }
      },
      {
        channel: AlertChannel.SLACK,
        severity: AlertSeverity.WARNING,
        template: {
          body: `⚠️ *{title}*
Message: {message}
Severity: {severity}
Category: {category}
Time: {timestamp}

_INOPNC Construction Management System_`,
          format: 'markdown'
        }
      },
      {
        channel: AlertChannel.SMS,
        severity: AlertSeverity.CRITICAL,
        template: {
          body: '🚨 CRITICAL: {title} - {message} - INOPNC System at {timestamp}',
          format: 'text'
        }
      }
    ]

    templates.forEach(template => {
      const key = `${template.channel}_${template.severity}`
      this.notificationTemplates.set(key, template)
    })
  }

  /**
   * Load active alerts from storage
   */
  private async loadActiveAlerts(): Promise<void> {
    try {
      const { data: alerts } = await this.supabase
        .from('analytics_events')
        .select('*')
        .eq('event_type', 'alert_created')
        .eq('metadata->resolved', false)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      if (alerts) {
        alerts.forEach(alertRecord => {
          const alert = alertRecord.metadata as Alert
          this.activeAlerts.set(alert.id, alert)
        })
      }

      // console.log(`Loaded ${this.activeAlerts.size} active alerts`)
    } catch (error) {
      console.error('Failed to load active alerts:', error)
    }
  }

  /**
   * Start alert processing loop
   */
  private startAlertProcessor(): void {
    // Process alerts every 30 seconds
    setInterval(async () => {
      await this.processAlertQueue()
    }, 30000)
  }

  /**
   * Start escalation checker
   */
  private startEscalationChecker(): void {
    // Check for escalations every 5 minutes
    setInterval(async () => {
      await this.checkEscalations()
    }, 5 * 60 * 1000)
  }

  /**
   * Process alert queue
   */
  private async processAlertQueue(): Promise<void> {
    // This would process any queued alerts or retries
    // For now, just log active alerts count
    const activeCount = Array.from(this.activeAlerts.values()).filter(a => !a.resolved).length
    if (activeCount > 0) {
      // console.log(`📊 Active alerts: ${activeCount}`)
    }
  }

  /**
   * Check for alert escalations
   */
  private async checkEscalations(): Promise<void> {
    const now = new Date()

    for (const alert of this.activeAlerts.values()) {
      if (alert.resolved || alert.escalated) continue

      const rule = this.alertRules.get(alert.ruleId)
      if (!rule?.escalationPolicy) continue

      const alertTime = new Date(alert.timestamp)
      const minutesSinceAlert = (now.getTime() - alertTime.getTime()) / (1000 * 60)

      if (minutesSinceAlert >= rule.escalationPolicy.escalateAfter) {
        await this.escalateAlert(alert, rule.escalationPolicy.escalateTo)
      }
    }
  }

  /**
   * Escalate an alert
   */
  private async escalateAlert(alert: Alert, escalationChannels: AlertChannel[]): Promise<void> {
    alert.escalated = true
    alert.escalatedAt = new Date().toISOString()

    await this.sendNotifications(alert, escalationChannels, true)
    await this.persistAlert(alert)

    // Log escalation
    Sentry.captureMessage(`Alert escalated: ${alert.title}`, {
      level: 'warning',
      tags: {
        alert_id: alert.id,
        escalation: true
      }
    })

    // console.log(`📈 Alert escalated: ${alert.title}`)
  }

  /**
   * Send notifications for an alert
   */
  private async sendNotifications(
    alert: Alert,
    channels: AlertChannel[],
    isEscalation: boolean = false
  ): Promise<void> {
    for (const channel of channels) {
      try {
        const success = await this.sendNotification(alert, channel, isEscalation)
        
        alert.notifications.push({
          channel,
          sentAt: new Date().toISOString(),
          success
        })
      } catch (error) {
        alert.notifications.push({
          channel,
          sentAt: new Date().toISOString(),
          success: false,
          error: error.message
        })

        console.error(`Failed to send ${channel} notification:`, error)
      }
    }
  }

  /**
   * Send a single notification
   */
  private async sendNotification(
    alert: Alert,
    channel: AlertChannel,
    isEscalation: boolean = false
  ): Promise<boolean> {
    const template = this.getNotificationTemplate(channel, alert.severity)
    if (!template) {
      console.warn(`No template found for ${channel} + ${alert.severity}`)
      return false
    }

    const message = this.renderTemplate(template.template.body, alert, isEscalation)
    const subject = template.template.subject ? 
      this.renderTemplate(template.template.subject, alert, isEscalation) : undefined

    switch (channel) {
      case AlertChannel.EMAIL:
        return await this.sendEmailNotification(subject || alert.title, message)
      
      case AlertChannel.SMS:
        return await this.sendSMSNotification(message)
      
      case AlertChannel.SLACK:
        return await this.sendSlackNotification(message)
      
      case AlertChannel.WEBHOOK:
        return await this.sendWebhookNotification(alert)
      
      case AlertChannel.PUSH_NOTIFICATION:
        return await this.sendPushNotification(alert.title, message)
      
      case AlertChannel.DASHBOARD:
        // Dashboard notifications are handled in real-time through the UI
        return true
      
      default:
        console.warn(`Unsupported notification channel: ${channel}`)
        return false
    }
  }

  /**
   * Send resolution notifications
   */
  private async sendResolutionNotifications(alert: Alert, channels: AlertChannel[]): Promise<void> {
    // Only send resolution notifications for ERROR and CRITICAL alerts
    if (![AlertSeverity.ERROR, AlertSeverity.CRITICAL].includes(alert.severity)) {
      return
    }

    const resolutionMessage = `✅ RESOLVED: ${alert.title} - Alert has been resolved at ${new Date().toLocaleString()}`

    for (const channel of channels) {
      try {
        switch (channel) {
          case AlertChannel.SLACK:
            await this.sendSlackNotification(resolutionMessage)
            break
          case AlertChannel.EMAIL:
            await this.sendEmailNotification(`✅ Resolved: ${alert.title}`, resolutionMessage)
            break
        }
      } catch (error) {
        console.error(`Failed to send resolution notification:`, error)
      }
    }
  }

  /**
   * Get notification template
   */
  private getNotificationTemplate(channel: AlertChannel, severity: AlertSeverity): NotificationTemplate | undefined {
    // Try exact match first
    let key = `${channel}_${severity}`
    let template = this.notificationTemplates.get(key)
    
    if (!template) {
      // Fall back to WARNING template for INFO/WARNING
      if (severity === AlertSeverity.INFO) {
        key = `${channel}_${AlertSeverity.WARNING}`
        template = this.notificationTemplates.get(key)
      }
      // Fall back to CRITICAL template for ERROR/CRITICAL
      else if (severity === AlertSeverity.ERROR) {
        key = `${channel}_${AlertSeverity.CRITICAL}`
        template = this.notificationTemplates.get(key)
      }
    }

    return template
  }

  /**
   * Render notification template
   */
  private renderTemplate(template: string, alert: Alert, isEscalation: boolean = false): string {
    const escalationPrefix = isEscalation ? '🔺 ESCALATED: ' : ''
    
    return template
      .replace(/{title}/g, escalationPrefix + alert.title)
      .replace(/{message}/g, alert.message)
      .replace(/{severity}/g, alert.severity)
      .replace(/{category}/g, alert.category)
      .replace(/{timestamp}/g, new Date(alert.timestamp).toLocaleString())
      .replace(/{alert_id}/g, alert.id)
  }

  /**
   * Notification channel implementations
   */
  private async sendEmailNotification(subject: string, body: string): Promise<boolean> {
    // Implementation would depend on email service (SendGrid, AWS SES, etc.)
    // console.log(`📧 Email notification: ${subject}`)
    return true
  }

  private async sendSMSNotification(message: string): Promise<boolean> {
    // Implementation would depend on SMS service (Twilio, AWS SNS, etc.)
    // console.log(`📱 SMS notification: ${message}`)
    return true
  }

  private async sendSlackNotification(message: string): Promise<boolean> {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL
    if (!webhookUrl) {
      console.warn('Slack webhook URL not configured')
      return false
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message })
      })
      return response.ok
    } catch (error) {
      console.error('Failed to send Slack notification:', error)
      return false
    }
  }

  private async sendWebhookNotification(alert: Alert): Promise<boolean> {
    const webhookUrl = process.env.ALERT_WEBHOOK_URL
    if (!webhookUrl) {
      console.warn('Alert webhook URL not configured')
      return false
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert)
      })
      return response.ok
    } catch (error) {
      console.error('Failed to send webhook notification:', error)
      return false
    }
  }

  private async sendPushNotification(title: string, message: string): Promise<boolean> {
    // Implementation would depend on push service (Firebase, OneSignal, etc.)
    // console.log(`🔔 Push notification: ${title}`)
    return true
  }

  /**
   * Utility methods
   */
  private findExistingAlert(ruleId: string, context?: Record<string, unknown>): Alert | undefined {
    return Array.from(this.activeAlerts.values()).find(alert => 
      alert.ruleId === ruleId && !alert.resolved
    )
  }

  private isInCooldown(alert: Alert, cooldownMinutes: number): boolean {
    const now = new Date()
    const alertTime = new Date(alert.timestamp)
    const minutesSinceAlert = (now.getTime() - alertTime.getTime()) / (1000 * 60)
    return minutesSinceAlert < cooldownMinutes
  }

  private mapSeverityToSentryLevel(severity: AlertSeverity): 'info' | 'warning' | 'error' | 'fatal' {
    switch (severity) {
      case AlertSeverity.INFO: return 'info'
      case AlertSeverity.WARNING: return 'warning'
      case AlertSeverity.ERROR: return 'error'
      case AlertSeverity.CRITICAL: return 'fatal'
    }
  }

  private async persistAlert(alert: Alert): Promise<void> {
    try {
      await this.supabase
        .from('analytics_events')
        .upsert({
          event_type: 'alert_created',
          metadata: alert,
          created_at: alert.timestamp
        })
    } catch (error) {
      console.error('Failed to persist alert:', error)
    }
  }

  /**
   * Public API methods
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values()).filter(a => !a.resolved)
  }

  getAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values())
  }

  async updateAlertRule(ruleId: string, updates: Partial<AlertRule>): Promise<void> {
    const rule = this.alertRules.get(ruleId)
    if (!rule) {
      throw new Error(`Alert rule ${ruleId} not found`)
    }

    const updatedRule = { ...rule, ...updates }
    this.alertRules.set(ruleId, updatedRule)
    
    // console.log(`Updated alert rule: ${ruleId}`)
  }

  async enableAlertRule(ruleId: string): Promise<void> {
    await this.updateAlertRule(ruleId, { enabled: true })
  }

  async disableAlertRule(ruleId: string): Promise<void> {
    await this.updateAlertRule(ruleId, { enabled: false })
  }
}

// Export singleton instance
export const alertingManager = AlertingManager.getInstance()