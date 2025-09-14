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
export { AuthDebugPanel } from './components/auth-debug-panel'

// Config exports
export * from '../config/env'
