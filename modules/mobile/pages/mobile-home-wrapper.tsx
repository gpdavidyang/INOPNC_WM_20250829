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
    let sessionMonitoringInterval: NodeJS.Timeout

    // PRIORITY 2 FIX: Simplified auth-first validation
    // Validate session exists BEFORE rendering any content
    const validateSession = async () => {
      try {
        if (!mounted) return

        console.log('[AUTH] Starting simple session validation')

        // If we have initial user from server, trust it and skip client validation
        // Server already validated the session
        if (initialUser && initialProfile) {
          console.log('[AUTH] Using server-validated session')
          if (mounted) {
            setIsAuthenticated(true)
            setIsValidating(false)
            startSessionMonitoring()
          }
          return
        }

        // Only do client validation if no server data (should not happen)
        console.log('[AUTH] No server data, checking client session')

        // Quick session check with shorter timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Session validation timeout')), 3000)
        })

        try {
          const sessionResult = await Promise.race([supabase.auth.getSession(), timeoutPromise])

          const {
            data: { session },
            error,
          } = sessionResult as any

          if (!mounted) return

          // If no session or error, redirect immediately
          if (error || !session || !session.user) {
            console.log('[AUTH] No valid session, redirecting to login')
            const currentPath = window.location.pathname + window.location.search
            window.location.replace(`/auth/login?redirectTo=${encodeURIComponent(currentPath)}`)
            return
          }

          // Session is valid
          if (mounted) {
            console.log('[AUTH] Client session validation successful')
            setIsAuthenticated(true)
            setIsValidating(false)
            startSessionMonitoring()
          }
        } catch (timeoutError) {
          // On timeout, if we have server data, trust it
          console.log('[AUTH] Client validation timed out, using server data')
          if (initialUser && mounted) {
            setIsAuthenticated(true)
            setIsValidating(false)
            startSessionMonitoring()
          } else {
            // No server data and client timeout - redirect
            console.log('[AUTH] No session data available, redirecting')
            window.location.replace('/auth/login')
          }
        }
      } catch (error) {
        console.error('[AUTH] Session validation error:', error)
        // If we have server data, continue despite error
        if (initialUser && mounted) {
          console.log('[AUTH] Error but have server data, continuing')
          setIsAuthenticated(true)
          setIsValidating(false)
        } else if (mounted) {
          // No server data and error - redirect
          const currentPath = window.location.pathname + window.location.search
          window.location.replace(`/auth/login?redirectTo=${encodeURIComponent(currentPath)}`)
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

    // PRIORITY 2 FIX: Start auth validation immediately (no delay for auth-first approach)
    validateSession()

    // Add visibility change listener for foreground revalidation
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && mounted) {
        validateSession()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      mounted = false
      clearInterval(sessionMonitoringInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [initialUser, initialProfile, router, supabase])

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
