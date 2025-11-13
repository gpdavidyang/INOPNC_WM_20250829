'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { isDevelopmentAuthBypass, mockUser, mockProfile } from '@/lib/dev-auth'

export function useAuth() {
  const isDevBypass = isDevelopmentAuthBypass()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    let isMounted = true

    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('Error getting session:', sessionError)
        }

        if (!isMounted) return

        if (session?.user) {
          setUser(session.user)
        } else if (isDevBypass) {
          console.log('🔓 [DEV] Using mock authentication in useAuth hook')
          setUser(mockUser as any)
          setProfile(mockProfile)
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('Error getting session:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
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

    return () => {
      isMounted = false
    }
  }, [router, supabase.auth, isDevBypass])

  return { user, profile, loading }
}
