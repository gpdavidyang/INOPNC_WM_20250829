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
  // Force new client for auth validation to avoid stale sessions
  const supabase = createClient({}, true)
  const [isValidating, setIsValidating] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    let mounted = true

    // PRIORITY 1 FIX: Immediate session validation with timeout
    const validateAuth = async () => {
      if (!mounted) return

      try {
        // If server passed no data, immediately redirect (don't wait)
        if (!initialUser || !initialProfile) {
          console.log('[AUTH] No server session data, redirecting immediately')
          window.location.replace('/auth/login')
          return
        }

        // Timeout-based session validation (5 seconds max)
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session validation timeout')), 5000)
        )

        const {
          data: { session },
          error,
        } = await Promise.race([sessionPromise, timeoutPromise])

        if (!mounted) return

        // Validate session exists and matches server data
        if (error || !session?.user || session.user.id !== initialUser.id) {
          console.log('[AUTH] Session validation failed, redirecting')
          window.location.replace('/auth/login')
          return
        }

        console.log('[AUTH] Session validated successfully')
        setIsAuthenticated(true)
        setIsValidating(false)
      } catch (error) {
        if (!mounted) return
        console.error('[AUTH] Validation error:', error)
        window.location.replace('/auth/login')
      }
    }

    // Add small delay to allow hydration to complete
    const timer = setTimeout(validateAuth, 100)

    return () => {
      mounted = false
      clearTimeout(timer)
    }
  }, [initialUser, initialProfile, supabase.auth])

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

  return (
    <AuthProvider initialSession={null} initialProfile={initialProfile}>
      <HomePage initialProfile={initialProfile} initialUser={initialUser} />
    </AuthProvider>
  )
}
