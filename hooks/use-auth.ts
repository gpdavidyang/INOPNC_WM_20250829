'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { isDevelopmentAuthBypass, mockUser, mockProfile } from '@/lib/dev-auth'

export function useAuth() {
  const isDevBypass = isDevelopmentAuthBypass()
  const [user, setUser] = useState<User | null>(isDevBypass ? (mockUser as any) : null)
  const [profile, setProfile] = useState(isDevBypass ? mockProfile : null)
  const [loading, setLoading] = useState(!isDevBypass)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Skip if development bypass is enabled
    if (isDevBypass) {
      console.log('🔓 [DEV] Using mock authentication in useAuth hook')
      return
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('Error getting session:', sessionError)
        }

        setUser(session?.user ?? null)
      } catch (error) {
        console.error('Error getting session:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.email)

      if (event === 'SIGNED_IN' && session) {
        setUser(session.user)
        // Force a page refresh to ensure server components get the new auth state
        router.refresh()
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        router.push('/auth/login')
      } else if (event === 'TOKEN_REFRESHED' && session) {
        setUser(session.user)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase.auth])

  return { user, profile, loading }
}
