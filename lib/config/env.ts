/**
 * Environment Configuration with Safety Checks
 *
 * Centralized environment variable management with validation and fallbacks.
 * Prevents runtime errors from missing configuration.
 */

export class EnvConfig {
  private static validated = false
  private static errors: string[] = []

  /**
   * Get Supabase URL with validation
   */
  static get supabaseUrl(): string {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (!url) {
      const message = 'NEXT_PUBLIC_SUPABASE_URL is not configured'

      if (process.env.NODE_ENV === 'production') {
        // In production, throw error immediately
        throw new Error(message)
      }

      // In development, use fallback and log warning
      console.warn(`[EnvConfig] ${message}. Using development fallback.`)
      return 'http://localhost:54321'
    }

    return url
  }

  /**
   * Get Supabase Anon Key with validation
   */
  static get supabaseAnonKey(): string {
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!key) {
      const message = 'NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured'

      if (process.env.NODE_ENV === 'production') {
        // In production, throw error immediately
        throw new Error(message)
      }

      // In development, use fallback and log warning
      console.warn(`[EnvConfig] ${message}. Using development fallback.`)
      return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdG5wc2NubnNudmZzeXZhamt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4Mzc1NjQsImV4cCI6MjA2OTQxMzU2NH0.VNyFGFPRiYTIIRgGBvehV2_wA-Fsq1dhjlvj90yvY08'
    }

    return key
  }

  /**
   * Get Supabase Service Role Key (server-side only)
   */
  static get supabaseServiceRoleKey(): string | undefined {
    if (typeof window !== 'undefined') {
      console.error('[EnvConfig] Service role key should not be accessed from client side!')
      return undefined
    }

    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!key && process.env.NODE_ENV === 'production') {
      console.warn('[EnvConfig] SUPABASE_SERVICE_ROLE_KEY is not configured')
    }

    return key
  }

  /**
   * Get Node Environment
   */
  static get nodeEnv(): 'development' | 'production' | 'test' {
    return (process.env.NODE_ENV as any) || 'development'
  }

  /**
   * Check if running in production
   */
  static get isProduction(): boolean {
    return this.nodeEnv === 'production'
  }

  /**
   * Check if running in development
   */
  static get isDevelopment(): boolean {
    return this.nodeEnv === 'development'
  }

  /**
   * Check if running in test environment
   */
  static get isTest(): boolean {
    return this.nodeEnv === 'test'
  }

  /**
   * Get application URL
   */
  static get appUrl(): string {
    if (process.env.NEXT_PUBLIC_APP_URL) {
      return process.env.NEXT_PUBLIC_APP_URL
    }

    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`
    }

    return 'http://localhost:3000'
  }

  /**
   * Get API URL
   */
  static get apiUrl(): string {
    return `${this.appUrl}/api`
  }

  /**
   * Validate all required environment variables
   * @returns Object with validation status and any errors
   */
  static validate(): { valid: boolean; errors: string[] } {
    if (this.validated) {
      return { valid: this.errors.length === 0, errors: this.errors }
    }

    this.errors = []
    this.validated = true

    // Check required variables
    const required = [
      { name: 'NEXT_PUBLIC_SUPABASE_URL', value: process.env.NEXT_PUBLIC_SUPABASE_URL },
      { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
    ]

    // Add server-side only checks
    if (typeof window === 'undefined') {
      required.push({
        name: 'SUPABASE_SERVICE_ROLE_KEY',
        value: process.env.SUPABASE_SERVICE_ROLE_KEY,
      })
    }

    for (const { name, value } of required) {
      if (!value) {
        const message = `Missing required environment variable: ${name}`
        this.errors.push(message)

        if (this.isProduction) {
          console.error(`[EnvConfig] ${message}`)
        } else {
          console.warn(`[EnvConfig] ${message}`)
        }
      }
    }

    // Validate Supabase URL format
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
      } catch (error) {
        const message = 'NEXT_PUBLIC_SUPABASE_URL is not a valid URL'
        this.errors.push(message)
        console.error(`[EnvConfig] ${message}`)
      }
    }

    return { valid: this.errors.length === 0, errors: this.errors }
  }

  /**
   * Get all configuration as an object (for debugging)
   * Excludes sensitive values in production
   */
  static getConfig(): Record<string, any> {
    const config: Record<string, any> = {
      nodeEnv: this.nodeEnv,
      isProduction: this.isProduction,
      isDevelopment: this.isDevelopment,
      appUrl: this.appUrl,
      apiUrl: this.apiUrl,
      supabaseUrl: this.supabaseUrl,
    }

    // Only include sensitive info in development
    if (this.isDevelopment) {
      config.supabaseAnonKey = this.supabaseAnonKey
        ? '***' + this.supabaseAnonKey.slice(-4)
        : undefined
      config.supabaseServiceRoleKey = this.supabaseServiceRoleKey
        ? '***' + this.supabaseServiceRoleKey.slice(-4)
        : undefined
    }

    return config
  }

  /**
   * Log configuration status (for debugging)
   */
  static logConfig(): void {
    const validation = this.validate()

    console.group('[EnvConfig] Configuration Status')
    console.log('Environment:', this.nodeEnv)
    console.log('Valid:', validation.valid)

    if (validation.errors.length > 0) {
      console.group('Errors:')
      validation.errors.forEach(error => console.error(error))
      console.groupEnd()
    }

    if (this.isDevelopment) {
      console.group('Configuration:')
      console.table(this.getConfig())
      console.groupEnd()
    }

    console.groupEnd()
  }
}

// Auto-validate in development mode
if (typeof window === 'undefined' && EnvConfig.isDevelopment) {
  const validation = EnvConfig.validate()
  if (!validation.valid && validation.errors.length > 0) {
    console.warn(
      '[EnvConfig] Environment configuration has issues. Run EnvConfig.logConfig() for details.'
    )
  }
}
