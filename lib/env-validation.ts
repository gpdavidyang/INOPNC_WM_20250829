/**
 * Environment variable validation for production deployments
 * This helps catch missing environment variables early
 */

interface RequiredEnvVars {
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: string
}

interface OptionalEnvVars {
  SUPABASE_SERVICE_ROLE_KEY?: string
  VAPID_PRIVATE_KEY?: string
  VAPID_SUBJECT?: string
}

export function validateEnvironmentVariables(): RequiredEnvVars & OptionalEnvVars {
  const requiredVars: (keyof RequiredEnvVars)[] = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_VAPID_PUBLIC_KEY'
  ]

  const missing: string[] = []
  const envVars: any = {}

  // Check required variables
  for (const varName of requiredVars) {
    const value = process.env[varName]
    if (!value) {
      missing.push(varName)
    } else {
      envVars[varName] = value
    }
  }

  // Add optional variables
  envVars.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  envVars.VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY
  envVars.VAPID_SUBJECT = process.env.VAPID_SUBJECT

  if (missing.length > 0) {
    const errorMessage = `Missing required environment variables: ${missing.join(', ')}`
    console.error('❌ Environment Validation Failed:', errorMessage)
    
    if (typeof window === 'undefined') {
      // Server-side: throw error to prevent startup
      throw new Error(errorMessage)
    } else {
      // Client-side: log error but don't crash
      console.error('⚠️ Client-side environment variables missing. Check Vercel deployment configuration.')
    }
  }

  console.log('✅ Environment validation passed')
  return envVars as RequiredEnvVars & OptionalEnvVars
}

// Export validated environment variables
export const env = validateEnvironmentVariables()

// Helper function to check if we're in a valid environment
export function isValidEnvironment(): boolean {
  try {
    validateEnvironmentVariables()
    return true
  } catch {
    return false
  }
}