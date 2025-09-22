/**
 * Feature Flag System for Gradual Rollouts
 * 
 * Enables/disables features based on:
 * - User segments
 * - Percentage rollouts
 * - Environment settings
 * - A/B testing
 */

export interface FeatureFlag {
  key: string
  name: string
  description: string
  enabled: boolean
  rollout_percentage: number
  user_segments: string[]
  environments: string[]
  start_date?: string
  end_date?: string
  metadata: Record<string, unknown>
}

export interface FeatureFlagContext {
  user_id?: string
  user_role?: string
  organization_id?: string
  site_id?: string
  environment: string
  ip_address?: string
  user_agent?: string
  session_id?: string
}

export type FeatureFlagKey = 
  | 'new_dashboard_ui'
  | 'enhanced_analytics'
  | 'advanced_security_features'
  | 'mobile_app_integration'
  | 'ai_work_suggestions'
  | 'real_time_collaboration'
  | 'advanced_reporting'
  | 'performance_optimizations'
  | 'new_authentication_flow'
  | 'beta_markup_tools'

/**
 * Feature Flag Manager
 */
export class FeatureFlagManager {
  private flags: Map<string, FeatureFlag> = new Map()
  private cache: Map<string, { value: boolean; expiry: number }> = new Map()
  private cacheTimeout = 5 * 60 * 1000 // 5 minutes

  constructor(flags: FeatureFlag[] = []) {
    this.loadFlags(flags)
  }

  /**
   * Load feature flags from configuration
   */
  loadFlags(flags: FeatureFlag[]): void {
    this.flags.clear()
    flags.forEach(flag => {
      this.flags.set(flag.key, flag)
    })
  }

  /**
   * Check if a feature is enabled for the given context
   */
  isEnabled(flagKey: FeatureFlagKey, context: FeatureFlagContext): boolean {
    const cacheKey = this.generateCacheKey(flagKey, context)
    
    // Check cache first
    const cached = this.cache.get(cacheKey)
    if (cached && cached.expiry > Date.now()) {
      return cached.value
    }

    const result = this.evaluateFlag(flagKey, context)
    
    // Cache the result
    this.cache.set(cacheKey, {
      value: result,
      expiry: Date.now() + this.cacheTimeout
    })

    return result
  }

  /**
   * Evaluate a feature flag
   */
  private evaluateFlag(flagKey: FeatureFlagKey, context: FeatureFlagContext): boolean {
    const flag = this.flags.get(flagKey)
    
    if (!flag) {
      console.warn(`Feature flag '${flagKey}' not found`)
      return false
    }

    // Check if flag is globally disabled
    if (!flag.enabled) {
      return false
    }

    // Check environment
    if (flag.environments.length > 0 && !flag.environments.includes(context.environment)) {
      return false
    }

    // Check date range
    const now = new Date()
    if (flag.start_date && new Date(flag.start_date) > now) {
      return false
    }
    if (flag.end_date && new Date(flag.end_date) < now) {
      return false
    }

    // Check user segments
    if (flag.user_segments.length > 0) {
      const userSegment = this.getUserSegment(context)
      if (!flag.user_segments.includes(userSegment)) {
        return false
      }
    }

    // Check rollout percentage
    if (flag.rollout_percentage < 100) {
      const userHash = this.hashUser(context.user_id || context.session_id || 'anonymous')
      const userPercentile = userHash % 100
      return userPercentile < flag.rollout_percentage
    }

    return true
  }

  /**
   * Get user segment based on context
   */
  private getUserSegment(context: FeatureFlagContext): string {
    // Define segments based on user attributes
    if (context.user_role === 'admin' || context.user_role === 'system_admin') {
      return 'admin'
    }
    
    if (context.user_role === 'site_manager') {
      return 'manager'
    }
    
    if (context.user_role === 'customer_manager') {
      return 'customer'
    }

    // Beta users (could be based on opt-in preference)
    if (context.user_id && this.isBetaUser(context.user_id)) {
      return 'beta'
    }
    
    return 'general'
  }

  /**
   * Check if user is a beta user
   */
  private isBetaUser(userId: string): boolean {
    // This could check a database or user preference
    // For now, use a simple hash-based approach
    const hash = this.hashUser(userId)
    return (hash % 10) === 0 // 10% of users are beta users
  }

  /**
   * Hash user ID for consistent percentage rollouts
   */
  private hashUser(input: string): number {
    let hash = 0
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  /**
   * Generate cache key for context
   */
  private generateCacheKey(flagKey: string, context: FeatureFlagContext): string {
    const segments = [
      flagKey,
      context.user_id || 'anonymous',
      context.user_role || 'unknown',
      context.environment
    ]
    return segments.join(':')
  }

  /**
   * Get all enabled flags for context
   */
  getEnabledFlags(context: FeatureFlagContext): FeatureFlagKey[] {
    const enabled: FeatureFlagKey[] = []
    
    for (const [key] of this.flags) {
      if (this.isEnabled(key as FeatureFlagKey, context)) {
        enabled.push(key as FeatureFlagKey)
      }
    }
    
    return enabled
  }

  /**
   * Get flag configuration (for admin interface)
   */
  getFlag(flagKey: FeatureFlagKey): FeatureFlag | undefined {
    return this.flags.get(flagKey)
  }

  /**
   * Update flag configuration
   */
  updateFlag(flagKey: FeatureFlagKey, updates: Partial<FeatureFlag>): void {
    const flag = this.flags.get(flagKey)
    if (flag) {
      const updatedFlag = { ...flag, ...updates }
      this.flags.set(flagKey, updatedFlag)
      
      // Clear cache for this flag
      this.clearCacheForFlag(flagKey)
      
      console.log(`Feature flag '${flagKey}' updated:`, updates)
    }
  }

  /**
   * Clear cache for a specific flag
   */
  private clearCacheForFlag(flagKey: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => key.startsWith(flagKey + ':'))
    keysToDelete.forEach(key => this.cache.delete(key))
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    // This would require tracking hits/misses in a real implementation
    return {
      size: this.cache.size,
      hitRate: 0.8 // Placeholder
    }
  }
}

/**
 * Default feature flags configuration
 */
export const DEFAULT_FEATURE_FLAGS: FeatureFlag[] = [
  {
    key: 'new_dashboard_ui',
    name: 'New Dashboard UI',
    description: 'Updated dashboard interface with improved UX',
    enabled: true,
    rollout_percentage: 25,
    user_segments: ['beta', 'admin'],
    environments: ['production', 'staging'],
    metadata: {
      version: '2.0.0',
      team: 'frontend'
    }
  },
  {
    key: 'enhanced_analytics',
    name: 'Enhanced Analytics',
    description: 'Advanced analytics dashboard with real-time metrics',
    enabled: true,
    rollout_percentage: 50,
    user_segments: ['admin', 'manager'],
    environments: ['production', 'staging'],
    metadata: {
      version: '1.5.0',
      team: 'analytics'
    }
  },
  {
    key: 'advanced_security_features',
    name: 'Advanced Security Features',
    description: 'Enhanced security monitoring and audit logging',
    enabled: true,
    rollout_percentage: 100,
    user_segments: ['admin'],
    environments: ['production'],
    metadata: {
      version: '3.0.0',
      team: 'security'
    }
  },
  {
    key: 'mobile_app_integration',
    name: 'Mobile App Integration',
    description: 'Integration with mobile application',
    enabled: false,
    rollout_percentage: 0,
    user_segments: [],
    environments: ['staging', 'development'],
    start_date: '2025-02-01T00:00:00Z',
    metadata: {
      version: '1.0.0',
      team: 'mobile'
    }
  },
  {
    key: 'ai_work_suggestions',
    name: 'AI Work Suggestions',
    description: 'AI-powered work suggestions and automation',
    enabled: true,
    rollout_percentage: 10,
    user_segments: ['beta'],
    environments: ['staging'],
    metadata: {
      version: '0.5.0',
      team: 'ai'
    }
  },
  {
    key: 'real_time_collaboration',
    name: 'Real-time Collaboration',
    description: 'Real-time collaborative editing and updates',
    enabled: true,
    rollout_percentage: 75,
    user_segments: ['admin', 'manager', 'beta'],
    environments: ['production', 'staging'],
    metadata: {
      version: '2.1.0',
      team: 'collaboration'
    }
  },
  {
    key: 'advanced_reporting',
    name: 'Advanced Reporting',
    description: 'Enhanced reporting with custom dashboards',
    enabled: true,
    rollout_percentage: 100,
    user_segments: ['admin', 'manager'],
    environments: ['production'],
    metadata: {
      version: '1.8.0',
      team: 'reporting'
    }
  },
  {
    key: 'performance_optimizations',
    name: 'Performance Optimizations',
    description: 'Enhanced performance and caching improvements',
    enabled: true,
    rollout_percentage: 100,
    user_segments: [],
    environments: ['production', 'staging'],
    metadata: {
      version: '1.0.0',
      team: 'performance'
    }
  },
  {
    key: 'new_authentication_flow',
    name: 'New Authentication Flow',
    description: 'Improved authentication with SSO support',
    enabled: false,
    rollout_percentage: 0,
    user_segments: [],
    environments: ['development'],
    metadata: {
      version: '2.0.0',
      team: 'auth'
    }
  },
  {
    key: 'beta_markup_tools',
    name: 'Beta Markup Tools',
    description: 'New advanced markup and annotation tools',
    enabled: true,
    rollout_percentage: 30,
    user_segments: ['beta', 'admin'],
    environments: ['staging', 'production'],
    metadata: {
      version: '1.2.0',
      team: 'markup'
    }
  }
]

// Singleton instance
let featureFlagManager: FeatureFlagManager | null = null

export function getFeatureFlagManager(): FeatureFlagManager {
  if (!featureFlagManager) {
    featureFlagManager = new FeatureFlagManager(DEFAULT_FEATURE_FLAGS)
  }
  return featureFlagManager
}

/**
 * React Hook for feature flags
 */
export function useFeatureFlag(flagKey: FeatureFlagKey, context: FeatureFlagContext): boolean {
  const manager = getFeatureFlagManager()
  return manager.isEnabled(flagKey, context)
}

/**
 * Utility function to check feature flags in server components
 */
export function checkFeatureFlag(flagKey: FeatureFlagKey, context: FeatureFlagContext): boolean {
  const manager = getFeatureFlagManager()
  return manager.isEnabled(flagKey, context)
}

/**
 * A/B Testing utilities
 */
export class ABTestManager {
  private featureFlags: FeatureFlagManager

  constructor(featureFlags: FeatureFlagManager) {
    this.featureFlags = featureFlags
  }

  /**
   * Get variant for A/B test
   */
  getVariant(testName: string, context: FeatureFlagContext): 'A' | 'B' {
    const flagKey = `ab_test_${testName}` as FeatureFlagKey
    return this.featureFlags.isEnabled(flagKey, context) ? 'B' : 'A'
  }

  /**
   * Track A/B test event
   */
  trackEvent(testName: string, variant: 'A' | 'B', event: string, context: FeatureFlagContext): void {
    // This would integrate with analytics service
    console.log('A/B Test Event:', {
      test: testName,
      variant,
      event,
      user: context.user_id,
      timestamp: new Date().toISOString()
    })
  }
}

/**
 * Feature flag configuration for different environments
 */
export const FEATURE_FLAG_CONFIGS = {
  production: {
    rollout_strategy: 'conservative',
    default_rollout_percentage: 10,
    cache_timeout: 5 * 60 * 1000, // 5 minutes
    admin_override: true
  },
  staging: {
    rollout_strategy: 'aggressive',
    default_rollout_percentage: 50,
    cache_timeout: 1 * 60 * 1000, // 1 minute
    admin_override: true
  },
  development: {
    rollout_strategy: 'all_enabled',
    default_rollout_percentage: 100,
    cache_timeout: 0, // No cache
    admin_override: true
  }
}