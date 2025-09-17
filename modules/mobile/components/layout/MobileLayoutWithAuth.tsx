'use client'

import React, { ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { MobileLayout } from './MobileLayout'
import { AuthProvider } from '@/modules/mobile/providers/AuthProvider'

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
  return (
    <AuthProvider
      initialSession={initialUser ? ({ user: initialUser } as any) : null}
      initialProfile={initialProfile || null}
    >
      <MobileLayout>{children}</MobileLayout>
    </AuthProvider>
  )
}
