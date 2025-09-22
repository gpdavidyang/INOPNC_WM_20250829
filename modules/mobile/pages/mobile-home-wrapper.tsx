'use client'

import React from 'react'
import { User } from '@supabase/supabase-js'
import { HomePage } from '@/modules/mobile/components/home/HomePage'
import { AuthProvider } from '@/modules/mobile/providers/AuthProvider'

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
  // CRITICAL FIX: Complete server trust - eliminate all client-side validation
  // If the server passed this component valid user data, we trust it 100%

  // Early return for invalid server state (should never happen in production)
  if (!initialUser || !initialProfile) {
    console.log('[MobileHomeWrapper] No server session data, redirecting to login')
    // Use window.location for immediate redirect without React state complications
    if (typeof window !== 'undefined') {
      window.location.replace('/auth/login')
    }
    return null
  }

  // Server validation complete - render immediately without any loading states
  console.log(
    '[MobileHomeWrapper] Server validation trusted, rendering HomePage for:',
    initialProfile.full_name
  )

  return (
    <AuthProvider initialSession={{ user: initialUser }} initialProfile={initialProfile}>
      <HomePage initialProfile={initialProfile} initialUser={initialUser} />
    </AuthProvider>
  )
}
