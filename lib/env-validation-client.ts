// Client-side environment validation with production error handling
'use client'

import React from 'react'
import { createLogger } from '@/lib/utils/logger'

const logger = createLogger('ENV-VALIDATION-CLIENT')

export interface EnvValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  environment: string
}

export function validateClientEnvironment(): EnvValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const environment = process.env.NODE_ENV || 'unknown'
  
  // Get environment variables and clean them
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()?.replace(/\\n/g, '')
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()?.replace(/\\n/g, '')
  
  logger.debug('[ENV-VALIDATION] Checking client environment:', {
    environment,
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlLength: supabaseUrl?.length || 0,
    keyLength: supabaseAnonKey?.length || 0
  })
  
  // Validate Supabase URL
  if (!supabaseUrl) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is missing or empty')
  } else {
    try {
      const url = new URL(supabaseUrl)
      if (!url.hostname.includes('supabase.co')) {
        warnings.push(`Supabase URL does not appear to be a standard Supabase URL: ${url.hostname}`)
      }
      
      // Check for common formatting issues
      if (supabaseUrl.includes('\\n') || supabaseUrl.includes('\n')) {
        errors.push('NEXT_PUBLIC_SUPABASE_URL contains newline characters')
      }
    } catch (urlError) {
      errors.push(`NEXT_PUBLIC_SUPABASE_URL is not a valid URL: ${supabaseUrl}`)
    }
  }
  
  // Validate Supabase Anon Key
  if (!supabaseAnonKey) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or empty')
  } else if (supabaseAnonKey.length < 30) {
    errors.push(`NEXT_PUBLIC_SUPABASE_ANON_KEY appears invalid (too short: ${supabaseAnonKey.length} chars)`)
  } else {
    // Check for common formatting issues
    if (supabaseAnonKey.includes('\\n') || supabaseAnonKey.includes('\n')) {
      errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY contains newline characters')
    }
    
    // Basic JWT format validation
    if (!supabaseAnonKey.startsWith('eyJ')) {
      warnings.push('NEXT_PUBLIC_SUPABASE_ANON_KEY does not appear to be a valid JWT token')
    }
  }
  
  // Production-specific checks
  if (environment === 'production') {
    // Ensure HTTPS in production
    if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
      errors.push('Production environment must use HTTPS for Supabase URL')
    }
    
    // Check for development-specific URLs
    if (supabaseUrl && (supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1'))) {
      errors.push('Production environment cannot use localhost URLs')
    }
  }
  
  const isValid = errors.length === 0
  
  if (!isValid) {
    logger.error('[ENV-VALIDATION] Environment validation failed:', { errors, warnings })
  } else if (warnings.length > 0) {
    logger.warn('[ENV-VALIDATION] Environment validation passed with warnings:', warnings)
  } else {
    logger.debug('[ENV-VALIDATION] Environment validation passed')
  }
  
  return {
    isValid,
    errors,
    warnings,
    environment
  }
}

// Hook for React components
export function useEnvironmentValidation() {
  const [validation, setValidation] = React.useState<EnvValidationResult | null>(null)
  
  React.useEffect(() => {
    const result = validateClientEnvironment()
    setValidation(result)
  }, [])
  
  return validation
}

// Export cleaned environment variables
export function getCleanEnvironmentVars() {
  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()?.replace(/\\n/g, ''),
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()?.replace(/\\n/g, ''),
  }
}