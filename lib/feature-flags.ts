// Feature flags for conditional system loading
export const FEATURE_FLAGS = {
  // Analytics system
  ENABLE_ANALYTICS: process.env.ENABLE_ANALYTICS === 'true',
  ENABLE_ANALYTICS_REALTIME: process.env.ENABLE_ANALYTICS_REALTIME === 'true',
  
  // Monitoring system
  ENABLE_MONITORING: process.env.ENABLE_MONITORING === 'true',
  ENABLE_PERFORMANCE_MONITORING: process.env.ENABLE_PERFORMANCE_MONITORING === 'true',
  
  // Data export system
  ENABLE_DATA_EXPORTS: process.env.ENABLE_DATA_EXPORTS === 'true',
  
  // Activity logging
  ENABLE_ACTIVITY_LOGS: process.env.ENABLE_ACTIVITY_LOGS === 'true',
  
  // Table existence checks (for development/testing)
  CHECK_TABLE_EXISTENCE: process.env.CHECK_TABLE_EXISTENCE !== 'false',
} as const

// Helper function to check if a feature is enabled
export function isFeatureEnabled(feature: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[feature] === true
}

// Database table requirements for each feature
export const FEATURE_TABLE_REQUIREMENTS = {
  ENABLE_ANALYTICS: ['analytics_events', 'analytics_metrics'],
  ENABLE_ANALYTICS_REALTIME: ['analytics_events', 'analytics_metrics'],
  ENABLE_MONITORING: ['monitoring_metrics', 'system_metrics'],
  ENABLE_PERFORMANCE_MONITORING: ['monitoring_metrics'],
  ENABLE_DATA_EXPORTS: ['data_exports'],
  ENABLE_ACTIVITY_LOGS: ['activity_logs'],
} as const

// Helper to get required tables for a feature
export function getRequiredTables(feature: keyof typeof FEATURE_TABLE_REQUIREMENTS): string[] {
  return FEATURE_TABLE_REQUIREMENTS[feature] || []
}