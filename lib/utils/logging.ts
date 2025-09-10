/**
 * Logging and monitoring utilities for NPC-1000 management system
 */

import { createClient } from '@/lib/supabase/server'

export interface AuditLogData {
  tableName: string
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
  recordId?: string
  oldValues?: any
  newValues?: any
  operationType?: 'production' | 'shipment' | 'inventory' | 'request'
  description?: string
}

export interface ErrorLogData {
  errorType: string
  errorMessage: string
  errorCode?: string
  operation?: string
  tableName?: string
  recordId?: string
  stackTrace?: string
  requestData?: any
  severity?: 'low' | 'medium' | 'high' | 'critical'
}

export interface PerformanceMetric {
  metricName: string
  metricType: 'counter' | 'gauge' | 'histogram'
  value: number
  unit?: string
  tags?: Record<string, any>
  source?: string
}

/**
 * Log audit trail for material operations
 */
export async function logAuditTrail(data: AuditLogData): Promise<boolean> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase.rpc('log_material_operation', {
      p_table_name: data.tableName,
      p_operation: data.operation,
      p_record_id: data.recordId || null,
      p_old_values: data.oldValues ? JSON.stringify(data.oldValues) : null,
      p_new_values: data.newValues ? JSON.stringify(data.newValues) : null,
      p_operation_type: data.operationType || null,
      p_description: data.description || null
    })

    if (error) {
      console.error('Failed to log audit trail:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error logging audit trail:', error)
    return false
  }
}

/**
 * Log application errors
 */
export async function logError(data: ErrorLogData): Promise<string | null> {
  try {
    const supabase = await createClient()
    
    const { data: errorId, error } = await supabase.rpc('log_error', {
      p_error_type: data.errorType,
      p_error_message: data.errorMessage,
      p_error_code: data.errorCode || null,
      p_operation: data.operation || null,
      p_table_name: data.tableName || null,
      p_record_id: data.recordId || null,
      p_stack_trace: data.stackTrace || null,
      p_request_data: data.requestData ? JSON.stringify(data.requestData) : null,
      p_severity: data.severity || 'error'
    })

    if (error) {
      console.error('Failed to log error:', error)
      return null
    }

    return errorId
  } catch (error) {
    console.error('Error logging error:', error)
    return null
  }
}

/**
 * Record performance metrics
 */
export async function recordMetric(metric: PerformanceMetric): Promise<boolean> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase.rpc('record_performance_metric', {
      p_metric_name: metric.metricName,
      p_metric_type: metric.metricType,
      p_value: metric.value,
      p_unit: metric.unit || null,
      p_tags: metric.tags ? JSON.stringify(metric.tags) : '{}',
      p_source: metric.source || 'application'
    })

    if (error) {
      console.error('Failed to record metric:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error recording metric:', error)
    return false
  }
}

/**
 * Performance timer utility
 */
export class PerformanceTimer {
  private startTime: number
  private metricName: string
  private tags: Record<string, any>

  constructor(metricName: string, tags: Record<string, any> = {}) {
    this.startTime = Date.now()
    this.metricName = metricName
    this.tags = tags
  }

  /**
   * Stop timer and record metric
   */
  async stop(): Promise<number> {
    const duration = Date.now() - this.startTime
    
    await recordMetric({
      metricName: this.metricName,
      metricType: 'histogram',
      value: duration,
      unit: 'milliseconds',
      tags: this.tags
    })

    return duration
  }
}

/**
 * Decorator to automatically log function performance
 */
export function withPerformanceLogging(metricName?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value
    const finalMetricName = metricName || `${target.constructor.name}.${propertyName}`

    descriptor.value = async function (...args: any[]) {
      const timer = new PerformanceTimer(finalMetricName, {
        function: propertyName,
        class: target.constructor.name
      })

      try {
        const result = await method.apply(this, args)
        await timer.stop()
        return result
      } catch (error) {
        await timer.stop()
        
        // Log the error
        await logError({
          errorType: 'function_error',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          operation: `${target.constructor.name}.${propertyName}`,
          stackTrace: error instanceof Error ? error.stack : undefined,
          severity: 'medium'
        })
        
        throw error
      }
    }

    return descriptor
  }
}

/**
 * Log inventory changes with context
 */
export async function logInventoryChange(
  operation: 'production' | 'shipment' | 'usage' | 'adjustment',
  details: {
    siteId?: string
    quantity: number
    previousStock?: number
    newStock?: number
    reason?: string
    recordId?: string
  }
): Promise<void> {
  await logAuditTrail({
    tableName: 'material_inventory',
    operation: 'UPDATE',
    recordId: details.recordId,
    oldValues: { current_stock: details.previousStock },
    newValues: { current_stock: details.newStock },
    operationType: 'inventory',
    description: `${operation}: ${details.quantity}량 변경 (${details.reason || 'No reason provided'})`
  })

  await recordMetric({
    metricName: 'inventory_change',
    metricType: 'counter',
    value: Math.abs(details.quantity),
    unit: 'units',
    tags: {
      operation,
      site_id: details.siteId,
      direction: details.quantity > 0 ? 'increase' : 'decrease'
    }
  })
}

/**
 * Monitor system health and alert on issues
 */
export async function checkSystemHealth(): Promise<{
  status: 'healthy' | 'warning' | 'critical'
  issues: string[]
  metrics: any
}> {
  try {
    const supabase = await createClient()
    
    const { data: health, error } = await supabase
      .from('system_health_summary')
      .select('*')
      .single()

    if (error) {
      return {
        status: 'critical',
        issues: ['Failed to fetch system health data'],
        metrics: null
      }
    }

    const issues: string[] = []
    let status: 'healthy' | 'warning' | 'critical' = 'healthy'

    // Check for critical errors
    if (health.critical_errors_24h > 0) {
      issues.push(`${health.critical_errors_24h} critical errors in last 24 hours`)
      status = 'critical'
    }

    // Check for low stock alerts
    if (health.low_stock_alerts > 0) {
      issues.push(`${health.low_stock_alerts} inventory items below threshold`)
      if (status === 'healthy') status = 'warning'
    }

    // Check for pending shipments
    if (health.pending_shipments > 10) {
      issues.push(`${health.pending_shipments} shipments pending (high volume)`)
      if (status === 'healthy') status = 'warning'
    }

    // Check response times
    if (health.avg_response_time_1h > 1000) {
      issues.push(`Average response time: ${health.avg_response_time_1h}ms (high)`)
      if (status === 'healthy') status = 'warning'
    }

    return {
      status,
      issues,
      metrics: health
    }
  } catch (error) {
    return {
      status: 'critical',
      issues: ['System health check failed'],
      metrics: null
    }
  }
}

/**
 * Daily cleanup of old logs (to be run via cron)
 */
export async function cleanupOldLogs(retentionDays: number = 90): Promise<{
  auditLogsDeleted: number
  errorLogsDeleted: number
  metricsDeleted: number
}> {
  try {
    const supabase = await createClient()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

    // Clean audit logs
    const { count: auditDeleted } = await supabase
      .from('audit_logs')
      .delete({ count: 'exact' })
      .lt('created_at', cutoffDate.toISOString())

    // Clean resolved error logs (keep unresolved ones longer)
    const { count: errorsDeleted } = await supabase
      .from('error_logs')
      .delete({ count: 'exact' })
      .lt('created_at', cutoffDate.toISOString())
      .in('status', ['resolved', 'closed'])

    // Clean old performance metrics (keep recent ones for trends)
    const metricsCutoffDate = new Date()
    metricsCutoffDate.setDate(metricsCutoffDate.getDate() - (retentionDays / 3)) // Keep metrics for 30 days
    
    const { count: metricsDeleted } = await supabase
      .from('performance_metrics')
      .delete({ count: 'exact' })
      .lt('created_at', metricsCutoffDate.toISOString())

    return {
      auditLogsDeleted: auditDeleted || 0,
      errorLogsDeleted: errorsDeleted || 0,
      metricsDeleted: metricsDeleted || 0
    }
  } catch (error) {
    console.error('Failed to cleanup old logs:', error)
    return {
      auditLogsDeleted: 0,
      errorLogsDeleted: 0,
      metricsDeleted: 0
    }
  }
}

// Export common metric names as constants
export const MetricNames = {
  API_RESPONSE_TIME: 'api_response_time',
  DATABASE_QUERY_TIME: 'database_query_time',
  INVENTORY_CHANGE: 'inventory_change',
  PRODUCTION_RECORD: 'production_record',
  SHIPMENT_PROCESSED: 'shipment_processed',
  USER_ACTION: 'user_action',
  SYSTEM_ERROR: 'system_error',
  LOGIN_ATTEMPT: 'login_attempt'
} as const

// Export error types as constants
export const ErrorTypes = {
  AUTHENTICATION_ERROR: 'authentication_error',
  AUTHORIZATION_ERROR: 'authorization_error',
  VALIDATION_ERROR: 'validation_error',
  DATABASE_ERROR: 'database_error',
  BUSINESS_LOGIC_ERROR: 'business_logic_error',
  EXTERNAL_SERVICE_ERROR: 'external_service_error',
  SYSTEM_ERROR: 'system_error'
} as const