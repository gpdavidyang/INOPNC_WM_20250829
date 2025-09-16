'use client'

import React, { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { HomePage } from '@/modules/mobile/components/home/HomePage'
import { AuthProvider } from '@/modules/mobile/providers/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Profile {
  id: string
  full_name?: string
  email: string
  role: string
  site_id?: string
}

interface MobileHomeWrapperProps {
  initialProfile: Profile
  initialUser: User
}

export const MobileHomeWrapper: React.FC<MobileHomeWrapperProps> = ({
  initialProfile,
  initialUser,
}) => {
  const router = useRouter()
  const supabase = createClient()
  const [isValidating, setIsValidating] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    let mounted = true
    let validationTimeout: NodeJS.Timeout
    let sessionMonitoringInterval: NodeJS.Timeout

    // Enhanced session validation with timeout and fallback
    const validateSession = async (attempt = 1) => {
      const maxAttempts = 3
      const timeoutMs = 8000 // Increased to 8 seconds for better reliability

      try {
        if (!mounted) return

        console.log(`[AUTH] Session validation attempt ${attempt}/${maxAttempts}`)

        // Create a timeout promise with more graceful handling
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Session validation timeout')), timeoutMs)
        })

        // Check if we have a valid session with timeout
        const sessionPromise = supabase.auth.getSession()

        const result = await Promise.race([sessionPromise, timeoutPromise])
        const {
          data: { session },
          error,
        } = result as any

        if (!mounted) return

        if (error || !session || !session.user) {
          console.log(`[AUTH] No valid session (attempt ${attempt})`, error?.message)

          // Only clear storage if we're certain there's no valid session
          if (attempt === maxAttempts) {
            // More selective clearing - preserve user preferences
            try {
              localStorage.removeItem('sb-access-token')
              localStorage.removeItem('sb-refresh-token')
              localStorage.removeItem('user-role')
              sessionStorage.clear()
            } catch (e) {
              console.warn('[AUTH] Error clearing storage:', e)
            }

            // Graceful redirect with current path
            const currentPath = window.location.pathname + window.location.search
            window.location.replace(`/auth/login?redirectTo=${encodeURIComponent(currentPath)}`)
          }
          return
        }

        // Enhanced user matching with additional checks
        if (initialUser) {
          if (session.user.id !== initialUser.id) {
            console.log('[AUTH] User ID mismatch, redirecting to login')
            window.location.replace('/auth/login')
            return
          }

          // Check email match as additional verification
          if (session.user.email !== initialUser.email) {
            console.log('[AUTH] Email mismatch detected, refreshing session')
            // Try to refresh once before redirecting
            try {
              const { data: refreshedSession } = await supabase.auth.refreshSession()
              if (
                !refreshedSession.session ||
                refreshedSession.session.user.email !== initialUser.email
              ) {
                window.location.replace('/auth/login')
                return
              }
            } catch (refreshError) {
              console.error('[AUTH] Session refresh failed:', refreshError)
              window.location.replace('/auth/login')
              return
            }
          }
        }

        // Enhanced token expiry check with preemptive refresh
        const now = Math.floor(Date.now() / 1000)
        const tokenExpiresAt = session.expires_at
        const refreshThreshold = 300 // 5 minutes before expiry

        if (tokenExpiresAt) {
          if (tokenExpiresAt < now) {
            console.log('[AUTH] Session expired, attempting refresh...')

            try {
              const { data: refreshedSession, error: refreshError } =
                await supabase.auth.refreshSession()

              if (refreshError || !refreshedSession.session) {
                console.log('[AUTH] Session refresh failed:', refreshError?.message)
                window.location.replace('/auth/login')
                return
              }

              console.log('[AUTH] Session refreshed successfully')
            } catch (refreshError) {
              console.error('[AUTH] Session refresh error:', refreshError)
              window.location.replace('/auth/login')
              return
            }
          } else if (tokenExpiresAt - now < refreshThreshold) {
            // Preemptive refresh if token expires soon
            console.log('[AUTH] Token expires soon, preemptively refreshing...')
            try {
              await supabase.auth.refreshSession()
              console.log('[AUTH] Preemptive refresh successful')
            } catch (refreshError) {
              console.warn('[AUTH] Preemptive refresh failed:', refreshError)
              // Don't redirect on preemptive refresh failure, just log it
            }
          }
        }

        // Validation successful
        if (mounted) {
          console.log('[AUTH] Session validation successful')
          setIsAuthenticated(true)
          setIsValidating(false)

          // Start continuous session monitoring
          startSessionMonitoring()
        }
      } catch (error) {
        console.error(`[AUTH] Session validation error (attempt ${attempt}):`, error)

        if (attempt < maxAttempts && mounted) {
          // Exponential backoff with jitter to prevent thundering herd
          const baseDelay = Math.pow(2, attempt - 1) * 1000
          const jitter = Math.random() * 500 // Add up to 500ms of jitter
          const delay = Math.min(baseDelay + jitter, 10000)

          console.log(`[AUTH] Retrying session validation in ${Math.round(delay)}ms...`)

          validationTimeout = setTimeout(() => {
            if (mounted) {
              validateSession(attempt + 1)
            }
          }, delay)
        } else {
          // Max attempts reached or component unmounted
          console.log('[AUTH] Session validation failed after all attempts')
          if (mounted) {
            // Clear auth state and redirect
            localStorage.removeItem('sb-access-token')
            localStorage.removeItem('sb-refresh-token')
            window.location.replace('/auth/login')
          }
        }
      }
    }

    // Continuous session monitoring for long-lived sessions
    const startSessionMonitoring = () => {
      if (sessionMonitoringInterval) {
        clearInterval(sessionMonitoringInterval)
      }

      sessionMonitoringInterval = setInterval(
        async () => {
          if (!mounted) return

          try {
            const {
              data: { session },
              error,
            } = await supabase.auth.getSession()

            if (error || !session) {
              console.log('[AUTH] Session lost during monitoring, redirecting to login')
              window.location.replace('/auth/login')
              return
            }

            // Check if token needs refresh (within 5 minutes of expiry)
            const now = Math.floor(Date.now() / 1000)
            const expiresAt = session.expires_at

            if (expiresAt && expiresAt - now < 300) {
              console.log('[AUTH] Token refresh needed during monitoring')
              try {
                await supabase.auth.refreshSession()
                console.log('[AUTH] Session refreshed during monitoring')
              } catch (refreshError) {
                console.error('[AUTH] Monitoring refresh failed:', refreshError)
                window.location.replace('/auth/login')
              }
            }
          } catch (monitorError) {
            console.error('[AUTH] Session monitoring error:', monitorError)
            // Don't redirect on monitoring errors, just log them
          }
        },
        2 * 60 * 1000
      ) // Check every 2 minutes
    }

    // Delay initial validation to avoid hydration issues
    const timer = setTimeout(() => {
      if (mounted) {
        validateSession()
      }
    }, 100)

    // Add visibility change listener for foreground revalidation
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && mounted) {
        validateSession()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      mounted = false
      clearTimeout(timer)
      clearTimeout(validationTimeout)
      clearInterval(sessionMonitoringInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [initialUser, router, supabase])

  // Show loading state while validating - suppressHydrationWarning to prevent flash
  if (isValidating) {
    return (
      <div className="flex items-center justify-center min-h-screen" suppressHydrationWarning>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">인증 확인 중...</p>
        </div>
      </div>
    )
  }

  // Only render if authenticated
  if (!isAuthenticated) {
    return null
  }

  // Create initial session from server data
  const initialSession = initialUser
    ? {
        access_token: '',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: '',
        user: initialUser,
      }
    : null

  return (
    <AuthProvider initialSession={initialSession} initialProfile={initialProfile}>
      <HomePage initialProfile={initialProfile} initialUser={initialUser} />
    </AuthProvider>
  )
}
