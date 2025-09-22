import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'
import { createLogger } from '@/lib/utils/logger'
import { getSupabaseEnv } from '@/lib/supabase/env'

const logger = createLogger('SUPABASE-SERVER')

export function createClient() {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv()
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
                sameSite: (options?.sameSite as 'lax' | 'strict' | 'none') ?? 'lax',
                secure: options?.secure ?? process.env.NODE_ENV === 'production',
                httpOnly: options?.httpOnly ?? true,
                path: options?.path ?? '/',
                maxAge: options?.maxAge ?? (name.includes('refresh') ? 60 * 60 * 24 * 30 : undefined),
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
    logger.error('Failed to create Supabase server client:', {
      message: error instanceof Error ? error.message : error,
    })
    throw error
  }
}
