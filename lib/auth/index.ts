/**
 * Auth Module Main Export
 *
 * Unified authentication system for the application.
 * Provides all auth-related functionality through a clean API.
 */

// Core exports
export * from './providers'
export * from './services'
export * from './context'
export * from './hooks'
export * from './components'
export * from './routing'
export * from './circuit-breaker'

// Monitoring exports (development tools)
export { authLogger, AuthEventType, LogLevel } from './monitoring/auth-logger'
export { authPerformanceMonitor, withPerformanceTracking } from './monitoring/performance-monitor'
export { authMetrics, type AuthMetric } from './monitoring/auth-metrics'
export { AuthDebugPanel } from './components/auth-debug-panel'
export { AuthErrorBoundary, withAuthErrorBoundary } from './components/auth-error-boundary'
export { AuthMonitoringDashboard } from './components/auth-monitoring-dashboard'

// Config exports
export * from '../config/env'
