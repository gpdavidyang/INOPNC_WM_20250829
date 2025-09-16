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

    // Enhanced session validation with timeout and fallback
    const validateSession = async (attempt = 1) => {
      const maxAttempts = 3
      const timeoutMs = 5000 // 5 second timeout per attempt

      try {
        if (!mounted) return

        console.log(`Session validation attempt ${attempt}/${maxAttempts}`)

        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Session validation timeout')), timeoutMs)
        })

        // Check if we have a valid session with timeout
        const sessionPromise = supabase.auth.getSession()

        const {
          data: { session },
          error,
        } = (await Promise.race([sessionPromise, timeoutPromise])) as any

        if (!mounted) return

        if (error || !session || !session.user) {
          console.log(`No valid session (attempt ${attempt}), redirecting to login`)

          // Clear any cached data
          localStorage.clear()
          sessionStorage.clear()

          // Force redirect to login
          window.location.replace('/auth/login')
          return
        }

        // Double-check the user matches
        if (initialUser && session.user.id !== initialUser.id) {
          console.log('User mismatch, redirecting to login')
          window.location.replace('/auth/login')
          return
        }

        // Check token expiry
        const now = Math.floor(Date.now() / 1000)
        if (session.expires_at && session.expires_at < now) {
          console.log('Session expired, attempting refresh...')

          const { data: refreshedSession, error: refreshError } =
            await supabase.auth.refreshSession()

          if (refreshError || !refreshedSession.session) {
            console.log('Session refresh failed, redirecting to login')
            window.location.replace('/auth/login')
            return
          }
        }

        // Validation successful
        if (mounted) {
          setIsAuthenticated(true)
          setIsValidating(false)
        }
      } catch (error) {
        console.error(`Session validation error (attempt ${attempt}):`, error)

        if (attempt < maxAttempts && mounted) {
          // Retry with exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
          console.log(`Retrying session validation in ${delay}ms...`)

          validationTimeout = setTimeout(() => {
            validateSession(attempt + 1)
          }, delay)
        } else {
          // Max attempts reached or component unmounted
          console.log('Session validation failed after all attempts, redirecting to login')
          if (mounted) {
            window.location.replace('/auth/login')
          }
        }
      }
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
