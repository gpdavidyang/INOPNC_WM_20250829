/**
 * Auth Provider Adapter
 *
 * Bridges the new auth system with existing components.
 * Provides both old and new auth contexts for gradual migration.
 */

'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import {
  AuthProvider as NewAuthProvider,
  useAuth as useNewAuth,
  AuthContext,
} from '../context/auth-context'
import { ensureClientSession } from '@/lib/supabase/session-bridge'
import { createClient } from '@/lib/supabase/client'

/**
 * Legacy Auth Context Type (for backward compatibility)
 */
interface LegacyAuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  refreshSession: () => Promise<void>
}

/**
 * Legacy Auth Context
 */
const LegacyAuthContext = createContext<LegacyAuthContextType>({
  user: null,
  session: null,
  loading: true,
  refreshSession: async () => {},
})

/**
 * Bridge Component
 * Maps new auth system to legacy interface
 */
function AuthBridge({ children }: { children: React.ReactNode }) {
  const newAuth = useNewAuth()
  const [legacyLoading, setLegacyLoading] = useState(true)
  const supabase = createClient()

  // Map new auth session to legacy format
  const legacySession: Session | null = newAuth.session
    ? {
        access_token: newAuth.session.accessToken,
        refresh_token: newAuth.session.refreshToken || '',
        expires_at: newAuth.session.expiresAt,
        expires_in: newAuth.session.expiresIn || 3600,
        token_type: 'bearer',
        user: {
          id: newAuth.user?.id || '',
          email: newAuth.user?.email || '',
          phone: newAuth.user?.phone || '',
          role: newAuth.user?.role,
          email_confirmed_at: newAuth.user?.metadata?.email_confirmed_at,
          phone_confirmed_at: newAuth.user?.metadata?.phone_confirmed_at,
          created_at: newAuth.user?.createdAt || '',
          updated_at: newAuth.user?.updatedAt || '',
          app_metadata: newAuth.user?.metadata?.app || {},
          user_metadata: newAuth.user?.metadata || {},
          aud: 'authenticated',
        } as User,
      }
    : null

  const legacyUser = legacySession?.user || null

  // Legacy refresh function using new auth system
  const legacyRefreshSession = async () => {
    await newAuth.refreshSession()
  }

  // Handle session bridging for SSR/CSR sync
  useEffect(() => {
    const initializeBridge = async () => {
      try {
        // Only attempt bridge if no session exists
        if (!newAuth.session && !newAuth.isLoading) {
          const currentPath = window.location.pathname
          const publicPaths = [
            '/auth/login',
            '/auth/signup',
            '/auth/signup-request',
            '/auth/reset-password',
            '/',
          ]
          const isPublicPath = publicPaths.some(path => currentPath.startsWith(path))

          if (!isPublicPath) {
            if (process.env.NODE_ENV === 'development') {
              console.log('🔄 [AUTH-BRIDGE] Attempting session bridge...')
            }

            const bridgeResult = await ensureClientSession()

            if (bridgeResult.success && bridgeResult.session) {
              if (process.env.NODE_ENV === 'development') {
                console.log('✅ [AUTH-BRIDGE] Session bridged successfully')
              }
              // Trigger auth refresh to sync with new system
              await newAuth.refreshSession()
            }
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[AUTH-BRIDGE] Bridge error:', error)
        }
      } finally {
        setLegacyLoading(false)
      }
    }

    if (!newAuth.isLoading) {
      initializeBridge()
    }
  }, [newAuth])

  // Provide legacy context
  const legacyValue: LegacyAuthContextType = {
    user: legacyUser,
    session: legacySession,
    loading: newAuth.isLoading || legacyLoading,
    refreshSession: legacyRefreshSession,
  }

  return (
    <LegacyAuthContext.Provider value={legacyValue}>
      {newAuth.isLoading || legacyLoading ? (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">로딩 중...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </LegacyAuthContext.Provider>
  )
}

/**
 * Unified Auth Provider
 * Provides both new and legacy auth contexts
 */
export function UnifiedAuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <NewAuthProvider>
      <AuthBridge>{children}</AuthBridge>
    </NewAuthProvider>
  )
}

/**
 * Legacy useAuthContext hook (for backward compatibility)
 */
export const useAuthContext = () => {
  const context = useContext(LegacyAuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider')
  }
  return context
}

/**
 * Migration helper to check which auth system is being used
 */
export function useAuthMigrationStatus() {
  let hasNewAuth = false
  let hasLegacyAuth = false

  // Check if new auth is available
  try {
    // Check if we're within the new auth context without actually calling the hook
    const context = useContext(AuthContext)
    hasNewAuth = context !== undefined
  } catch {
    hasNewAuth = false
  }

  // Check if legacy auth is available
  try {
    // Check if we're within the legacy auth context without actually calling the hook
    const context = useContext(LegacyAuthContext)
    hasLegacyAuth = context !== undefined
  } catch {
    hasLegacyAuth = false
  }

  return {
    isUsingNewAuth: hasNewAuth,
    isUsingLegacyAuth: hasLegacyAuth,
    isFullyMigrated: hasNewAuth && !hasLegacyAuth,
    isBridged: hasNewAuth && hasLegacyAuth,
  }
}
