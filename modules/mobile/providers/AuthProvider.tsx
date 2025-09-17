'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: any | null
  loading: boolean
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  refreshSession: async () => {},
})

export const useAuth = () => useContext(AuthContext)

interface AuthProviderProps {
  children: React.ReactNode
  initialSession?: Session | null
  initialProfile?: any | null
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  initialSession,
  initialProfile,
}) => {
  // CRITICAL FIX: Trust initial server data and start ready if provided
  const [user, setUser] = useState<User | null>(initialSession?.user || null)
  const [session, setSession] = useState<Session | null>(initialSession || null)
  const [profile, setProfile] = useState<any | null>(initialProfile || null)
  const [loading, setLoading] = useState(!initialProfile) // Only load if no initial profile
  const router = useRouter()

  const refreshSession = useCallback(async () => {
    // CRITICAL FIX: Respect server validation - only refresh when explicitly needed
    if (initialProfile && initialSession?.user && !loading) {
      console.log('[AuthProvider] Server data already validated, skipping unnecessary refresh')
      return
    }

    const supabase = createClient()
    if (!supabase) {
      console.error('Supabase client not available')
      setLoading(false)
      return
    }

    try {
      // Simplified session refresh - avoid complex retry logic that can cause loops
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (session && session.user) {
        setSession(session)
        setUser(session.user)

        // Only fetch profile if we don't have one or user ID changed
        if (!profile || profile.id !== session.user.id) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (profileData) {
            setProfile(profileData)
          } else {
            // Fallback to user metadata if profile fetch fails
            setProfile({
              id: session.user.id,
              email: session.user.email,
              full_name:
                session.user.user_metadata?.full_name ||
                session.user.email?.split('@')[0] ||
                'User',
              role: session.user.user_metadata?.role || 'worker',
            })
          }
        }
      } else {
        // No valid session available
        setSession(null)
        setUser(null)
        setProfile(null)
      }
    } catch (error) {
      console.error('Error refreshing session:', error)
      // On error, clear state to prevent loops
      setSession(null)
      setUser(null)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [initialProfile, initialSession, profile])

  useEffect(() => {
    // CRITICAL FIX: Trust server-provided initial data completely
    if (initialProfile && initialSession?.user) {
      console.log(
        '[AuthProvider] Server validation complete, trusting initial data:',
        initialProfile.full_name
      )
      // Don't call refreshSession() - trust server validation
      setLoading(false)
      return
    }

    // Only refresh if absolutely no server data provided
    console.log('[AuthProvider] No server data, attempting client-side session refresh')
    refreshSession()

    // Set up auth state change listener (keep for sign out handling)
    const supabase = createClient()
    if (!supabase) return

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('[AuthProvider] Auth state changed:', event)

      if (event === 'SIGNED_OUT') {
        setSession(null)
        setUser(null)
        setProfile(null)
        router.push('/auth/login')
      } else if (event === 'TOKEN_REFRESHED' && newSession) {
        setSession(newSession)
        setUser(newSession.user)
        // Token refreshed successfully
      }
      // Don't handle SIGNED_IN here to avoid conflicts with server-side data
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, initialProfile, initialSession, refreshSession])

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, refreshSession }}>
      {children}
    </AuthContext.Provider>
  )
}
