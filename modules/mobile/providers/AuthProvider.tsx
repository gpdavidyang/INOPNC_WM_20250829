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
  const [user, setUser] = useState<User | null>(initialSession?.user || null)
  const [session, setSession] = useState<Session | null>(initialSession || null)
  const [profile, setProfile] = useState<any | null>(initialProfile || null)
  const [loading, setLoading] = useState(!initialProfile) // Use initialProfile instead of initialSession
  const router = useRouter()

  const refreshSession = useCallback(async () => {
    const supabase = createClient()
    if (!supabase) {
      console.error('Supabase client not available')
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
        // Try refresh token if current session is invalid
        const {
          data: { session: refreshedSession },
          error: refreshError,
        } = await supabase.auth.refreshSession()

        if (refreshedSession && refreshedSession.user) {
          setSession(refreshedSession)
          setUser(refreshedSession.user)

          // Fetch profile for refreshed session
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', refreshedSession.user.id)
            .single()

          if (profileData) {
            setProfile(profileData)
          } else {
            // Fallback to user metadata
            setProfile({
              id: refreshedSession.user.id,
              email: refreshedSession.user.email,
              full_name:
                refreshedSession.user.user_metadata?.full_name ||
                refreshedSession.user.email?.split('@')[0] ||
                'User',
              role: refreshedSession.user.user_metadata?.role || 'worker',
            })
          }
        } else {
          // No valid session available
          setSession(null)
          setUser(null)
          setProfile(null)
        }
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
  }, [])

  useEffect(() => {
    // Initial session check
    refreshSession()

    // Set up auth state change listener
    const supabase = createClient()
    if (!supabase) return

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      // Auth state changed: event, user email

      if (event === 'SIGNED_IN' && newSession) {
        setSession(newSession)
        setUser(newSession.user)

        // Fetch profile on sign in
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', newSession.user.id)
          .single()

        if (profileData) {
          setProfile(profileData)
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null)
        setUser(null)
        setProfile(null)
        router.push('/auth/login')
      } else if (event === 'TOKEN_REFRESHED' && newSession) {
        setSession(newSession)
        setUser(newSession.user)
        // Token refreshed successfully
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, refreshSession }}>
      {children}
    </AuthContext.Provider>
  )
}
