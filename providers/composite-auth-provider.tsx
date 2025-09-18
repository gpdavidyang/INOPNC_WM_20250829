'use client'

import React from 'react'
import { User, Session } from '@supabase/supabase-js'
import { CoreAuthProvider } from './core-auth-provider'
import { ProfileProvider } from './profile-provider'
import { RoleProvider } from './role-provider'

/**
 * CompositeAuthProvider - 모든 인증 관련 Provider를 조합
 * 책임: Provider 조합 및 계층 구조 관리
 */
interface UnifiedProfile {
  id: string
  full_name?: string
  email: string
  role?: 'worker' | 'site_manager' | 'customer_manager' | 'admin' | 'system_admin'
  site_id?: string
  phone?: string
  organization_id?: string
  created_at?: string
  status?: string
}

interface CompositeAuthProviderProps {
  children: React.ReactNode
  // Server-side initial data support
  initialUser?: User | null
  initialSession?: Session | null
  initialProfile?: UnifiedProfile | null
}

export function CompositeAuthProvider({
  children,
  initialUser = null,
  initialSession = null,
  initialProfile = null,
}: CompositeAuthProviderProps) {
  return (
    <CoreAuthProvider initialUser={initialUser} initialSession={initialSession}>
      <ProfileProvider initialProfile={initialProfile}>
        <RoleProvider>{children}</RoleProvider>
      </ProfileProvider>
    </CoreAuthProvider>
  )
}

// 기존 UnifiedAuthProvider와 호환성을 위한 alias
export const UnifiedAuthProvider = CompositeAuthProvider
