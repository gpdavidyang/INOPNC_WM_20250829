'use client'

import React, { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { HomePage } from '@/modules/mobile/components/home/HomePage'
import { AuthProvider } from '@/modules/mobile/providers/AuthProvider'
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
  const [isValidating, setIsValidating] = useState(false) // Changed: Start as false since server already validated
  const [isAuthenticated, setIsAuthenticated] = useState(true) // Changed: Start as true since server validated

  useEffect(() => {
    let mounted = true

    // CRITICAL FIX: Trust server-side validation - only do minimal client verification
    const validateAuth = async () => {
      if (!mounted) return

      // If server passed valid data, trust it and proceed immediately
      if (initialUser && initialProfile) {
        console.log('[AUTH] Using server-validated session:', initialProfile.full_name)
        setIsAuthenticated(true)
        setIsValidating(false)
        return
      }

      // Only redirect if no server data at all
      console.log('[AUTH] No server session data, redirecting')
      window.location.replace('/auth/login')
    }

    // Immediate validation without timeout race condition
    validateAuth()

    return () => {
      mounted = false
    }
  }, [initialUser, initialProfile]) // Removed supabase.auth dependency to prevent re-validation

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

  return <HomePage initialProfile={initialProfile} initialUser={initialUser} />
}
