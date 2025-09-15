'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
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
  const [loading, setLoading] = useState(!initialSession)
  const router = useRouter()

  const refreshSession = async () => {
    const supabase = createClient()
    if (!supabase) {
      console.error('Supabase client not available')
      return
    }

    try {
      // First try to get the current session
      const {
        data: { session: currentSession },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (currentSession) {
        setSession(currentSession)
        setUser(currentSession.user)
        console.log('Session refreshed from cookies:', currentSession.user?.email)

        // Fetch profile if not already loaded
        if (!profile && currentSession.user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentSession.user.id)
            .single()

          if (profileData) {
            setProfile(profileData)
          }
        }
      } else {
        // Try to refresh the session if no current session
        const {
          data: { session: refreshedSession },
          error: refreshError,
        } = await supabase.auth.refreshSession()

        if (refreshedSession) {
          setSession(refreshedSession)
          setUser(refreshedSession.user)
          console.log('Session refreshed with refresh token:', refreshedSession.user?.email)

          // Fetch profile
          if (refreshedSession.user) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', refreshedSession.user.id)
              .single()

            if (profileData) {
              setProfile(profileData)
            }
          }
        } else {
          console.log('No session available, user needs to login')
          setSession(null)
          setUser(null)
          setProfile(null)
        }
      }
    } catch (error) {
      console.error('Error refreshing session:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Initial session check
    refreshSession()

    // Set up auth state change listener
    const supabase = createClient()
    if (!supabase) return

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('Auth state changed:', event, newSession?.user?.email)

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
        console.log('Token refreshed successfully')
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
