import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'
import { createLogger } from '@/lib/utils/logger'

const logger = createLogger('SUPABASE-SERVER')

// Environment variable validation and error handling
function validateEnvironmentVars() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  
  if (!supabaseUrl || !supabaseAnonKey) {
    const missing = []
    if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL')
    if (!supabaseAnonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    
    const error = new Error(`Missing required Supabase environment variables: ${missing.join(', ')}`)
    
    // Enhanced logging for production debugging
    logger.error('Environment validation failed:', {
      missing,
      environment: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      urlLength: supabaseUrl?.length || 0,
      keyLength: supabaseAnonKey?.length || 0,
      // Safe logging - only show first/last few chars
      urlStart: supabaseUrl ? supabaseUrl.substring(0, 20) + '...' : 'undefined',
      keyStart: supabaseAnonKey ? supabaseAnonKey.substring(0, 10) + '...' : 'undefined'
    })
    throw error
  }
  
  // Validate URL format
  try {
    new URL(supabaseUrl)
  } catch {
    const error = new Error(`Invalid NEXT_PUBLIC_SUPABASE_URL format`)
    logger.error('Invalid Supabase URL format:', { 
      urlStart: supabaseUrl.substring(0, 20) + '...'
    })
    throw error
  }
  
  // Relax key length validation for production compatibility
  if (supabaseAnonKey.length < 20) {
    const error = new Error(`NEXT_PUBLIC_SUPABASE_ANON_KEY appears to be invalid (too short: ${supabaseAnonKey.length} chars)`)
    logger.error('Invalid Supabase anon key:', { keyLength: supabaseAnonKey.length })
    throw error
  }
  
  return { supabaseUrl, supabaseAnonKey }
}

export function createClient() {
  try {
    const { supabaseUrl, supabaseAnonKey } = validateEnvironmentVars()
    const cookieStore = cookies()

    const client = createServerClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            try {
              return cookieStore.getAll()
            } catch (error) {
              logger.error('Failed to get cookies:', error)
              return []
            }
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                const cookieOptions = {
                  ...options,
                  sameSite: 'lax' as const,
                  secure: process.env.NODE_ENV === 'production',
                  httpOnly: false, // CRITICAL FIX: Allow client-side access to auth cookies
                  path: '/',
                  // CRITICAL: Ensure proper max-age for refresh tokens
                  maxAge: options?.maxAge || 60 * 60 * 24 * 30 // 30 days default
                }
                cookieStore.set(name, value, cookieOptions)
              })
            } catch (error) {
              // Server Component cookie setting error is expected
              // Cookies can only be modified in Server Actions or Route Handlers
              // Only log in development for debugging
              if (process.env.NODE_ENV === 'development') {
                logger.debug('Cookie setting error (expected in Server Components):', error)
              }
            }
          },
        },
      }
    )

    // Log successful client creation only in development
    if (process.env.NODE_ENV === 'development') {
      logger.debug('✅ Supabase server client created successfully')
    }

    return client
  } catch (error) {
    logger.error('Failed to create Supabase server client:', error)
    throw error
  }
}