/**
 * Monitoring System Initialization
 * Bootstraps all monitoring components for the INOPNC Work Management System
 */

import { monitoringManager } from './monitoring-manager'
import { alertingManager } from './alerting-manager'
import { securityManager } from '@/lib/security/production-security-manager'
import { initWebVitals, observePerformance } from './web-vitals'
import { initSentry } from './sentry'

let isInitialized = false

/**
 * Initialize the complete monitoring system
 */
export async function initializeMonitoring(): Promise<void> {
  if (isInitialized) {
    // console.log('🔍 Monitoring system already initialized')
    return
  }

  // console.log('🚀 Initializing INOPNC Monitoring System...')

  try {
    // Initialize Sentry for error tracking
    initSentry()
    // console.log('✅ Sentry initialized')

    // Initialize Web Vitals tracking (client-side only)
    if (typeof window !== 'undefined') {
      initWebVitals()
      observePerformance()
      // console.log('✅ Web Vitals tracking initialized')
    }

    // Initialize monitoring manager
    await monitoringManager.initialize()
    // console.log('✅ Monitoring manager initialized')

    // Initialize alerting system
    await alertingManager.initialize()
    // console.log('✅ Alerting system initialized')

    // Initialize security monitoring
    await securityManager.startMonitoring()
    // console.log('✅ Security monitoring started')

    // Set up integration between systems
    setupMonitoringIntegration()
    // console.log('✅ Monitoring integration configured')

    isInitialized = true
    // console.log('🎉 INOPNC Monitoring System fully initialized!')

    // Send initialization success metric
    if (typeof window !== 'undefined') {
      try {
        await fetch('/api/monitoring/metrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'system_event',
            data: {
              event: 'monitoring_system_initialized',
              timestamp: new Date().toISOString(),
              components: [
                'sentry',
                'web_vitals',
                'monitoring_manager',
                'alerting_manager',
                'security_manager'
              ]
            }
          })
        })
      } catch (error) {
        // Ignore errors - this is best effort
        console.warn('Failed to send initialization metric:', error)
      }
    }

  } catch (error) {
    console.error('❌ Failed to initialize monitoring system:', error)
    
    // Send error to Sentry if available
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error, {
        tags: {
          component: 'monitoring_initialization',
          system: 'inopnc-construction-management'
        }
      })
    }
    
    throw error
  }
}

/**
 * Set up integration between monitoring systems
 */
function setupMonitoringIntegration(): void {
  // Create alerts for monitoring events
  const createMonitoringAlert = async (event: any) => {
    try {
      await alertingManager.createAlert({
        ruleId: event.type,
        title: event.title,
        message: event.message,
        context: event.context,
        severity: event.severity
      })
    } catch (error) {
      console.error('Failed to create monitoring alert:', error)
    }
  }

  // Set up event listeners for cross-system integration
  if (typeof window !== 'undefined') {
    // Listen for performance budget violations
    window.addEventListener('performance-budget-violation', (event: any) => {
      createMonitoringAlert({
        type: 'performance_budget_violation',
        title: 'Performance Budget Violation',
        message: `${event.detail.metric} exceeded budget: ${event.detail.value} > ${event.detail.budget}`,
        context: event.detail,
        severity: 'WARNING'
      })
    })

    // Listen for security events
    window.addEventListener('security-event', (event: any) => {
      createMonitoringAlert({
        type: 'security_event',
        title: 'Security Event Detected',
        message: event.detail.message,
        context: event.detail,
        severity: event.detail.severity || 'WARNING'
      })
    })
  }

  // console.log('📡 Monitoring system integration configured')
}

/**
 * Get initialization status
 */
export function isMonitoringInitialized(): boolean {
  return isInitialized
}

/**
 * Shutdown monitoring system (for cleanup)
 */
export function shutdownMonitoring(): void {
  if (!isInitialized) {
    return
  }

  // console.log('🛑 Shutting down monitoring system...')
  
  // Add any cleanup logic here
  isInitialized = false
  
  // console.log('✅ Monitoring system shutdown complete')
}

/**
 * Health check for monitoring system
 */
export async function checkMonitoringHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy'
  components: Record<string, boolean>
  timestamp: string
}> {
  const components = {
    sentry: typeof window !== 'undefined' && !!window.Sentry,
    monitoring_manager: isInitialized,
    alerting_manager: isInitialized,
    security_manager: isInitialized,
    web_vitals: typeof window !== 'undefined' && 'PerformanceObserver' in window
  }

  const healthyCount = Object.values(components).filter(Boolean).length
  const totalCount = Object.keys(components).length

  let status: 'healthy' | 'degraded' | 'unhealthy'
  if (healthyCount === totalCount) {
    status = 'healthy'
  } else if (healthyCount >= totalCount * 0.7) {
    status = 'degraded'
  } else {
    status = 'unhealthy'
  }

  return {
    status,
    components,
    timestamp: new Date().toISOString()
  }
}

/**
 * Get monitoring system configuration
 */
export function getMonitoringConfig(): {
  environment: string
  features: string[]
  endpoints: string[]
  initialized: boolean
} {
  return {
    environment: process.env.NODE_ENV || 'development',
    features: [
      'error_tracking',
      'performance_monitoring',
      'security_monitoring',
      'construction_metrics',
      'real_time_alerting',
      'web_vitals',
      'api_monitoring',
      'database_monitoring'
    ],
    endpoints: [
      '/api/monitoring/metrics',
      '/api/monitoring/alerts',
      '/api/monitoring/health'
    ],
    initialized: isInitialized
  }
}