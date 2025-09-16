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
    // Delay validation to avoid hydration issues
    const timer = setTimeout(() => {
      // Immediately validate session on mount
      const validateSession = async () => {
        try {
          // Check if we have a valid session
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession()

          if (error || !session || !session.user) {
            console.log('No valid session, redirecting to login')
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

          setIsAuthenticated(true)
        } catch (error) {
          console.error('Session validation error:', error)
          window.location.replace('/auth/login')
        } finally {
          setIsValidating(false)
        }
      }

      validateSession()

      // Add visibility change listener to revalidate when app comes to foreground
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          validateSession()
        }
      }

      document.addEventListener('visibilitychange', handleVisibilityChange)

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }, 100) // Small delay to ensure hydration completes

    return () => {
      clearTimeout(timer)
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
