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

    // PRIORITY 2 FIX: Simplified auth-first validation
    // Validate session exists BEFORE rendering any content
    const validateSession = async () => {
      try {
        if (!mounted) return

        console.log('[AUTH] Starting simple session validation')

        // Quick session check with 10 second timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Session validation timeout')), 10000)
        })

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

        // Basic user validation
        if (initialUser && session.user.id !== initialUser.id) {
          console.log('[AUTH] User ID mismatch, redirecting to login')
          window.location.replace('/auth/login')
          return
        }

        // Check if session is expired
        const now = Math.floor(Date.now() / 1000)
        if (session.expires_at && session.expires_at < now) {
          console.log('[AUTH] Session expired, redirecting to login')
          window.location.replace('/auth/login')
          return
        }

        // Session is valid
        if (mounted) {
          console.log('[AUTH] Session validation successful')
          setIsAuthenticated(true)
          setIsValidating(false)
          startSessionMonitoring()
        }
      } catch (error) {
        console.error('[AUTH] Session validation error:', error)
        if (mounted) {
          // Clear storage and redirect on any error
          try {
            localStorage.removeItem('sb-access-token')
            localStorage.removeItem('sb-refresh-token')
            localStorage.removeItem('user-role')
            sessionStorage.clear()
          } catch (e) {
            console.warn('[AUTH] Error clearing storage:', e)
          }
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
