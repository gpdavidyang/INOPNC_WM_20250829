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

    // Simplified authentication - trust server validation and avoid duplicate checks
    const initializeAuth = () => {
      if (!mounted) return

      // If we have initial user from server, the middleware and server already validated the session
      // No need for additional client-side validation that can cause loops
      if (initialUser && initialProfile) {
        console.log('[AUTH] Using server-validated session data')
        setIsAuthenticated(true)
        setIsValidating(false)
        return
      }

      // If no server data, redirect to login (should not happen with proper middleware)
      console.log('[AUTH] No server session data, redirecting to login')
      window.location.replace('/auth/login')
    }

    // Initialize immediately - no complex validation needed
    initializeAuth()

    return () => {
      mounted = false
    }
  }, [initialUser, initialProfile])

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
