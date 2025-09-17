'use client'

import React, { ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { MobileLayout } from './MobileLayout'

interface Profile {
  id: string
  full_name?: string
  email: string
  role: string
  site_id?: string
}

interface MobileLayoutWithAuthProps {
  children: ReactNode
  initialProfile?: Profile
  initialUser?: User
}

export const MobileLayoutWithAuth: React.FC<MobileLayoutWithAuthProps> = ({
  children,
  initialProfile,
  initialUser,
}) => {
  // UnifiedAuthProvider is now at the root level, so we just need to
  // render the MobileLayout directly. The authentication state will be
  // handled by the unified provider.
  return <MobileLayout>{children}</MobileLayout>
}
