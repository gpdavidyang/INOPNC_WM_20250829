'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

interface Profile {
  id: string
  user_id: string
  full_name: string | null
  email: string | null
  role: 'worker' | 'site_manager' | 'customer_manager' | 'admin' | null
  site_id: string | null
  phone: string | null
  daily_wage: number | null
  is_active: boolean
}

interface MobileAuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
  error: string | null
  isMobileRole: boolean
}

export const useMobileAuth = (): MobileAuthState => {
  const [state, setState] = useState<MobileAuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null,
    isMobileRole: false,
  })

  useEffect(() => {
    let mounted = true
    const supabase = createClient()

    const getSession = async () => {
      try {
        // Get current session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          throw sessionError
        }

        if (!session?.user) {
          if (mounted) {
            setState({
              user: null,
              profile: null,
              loading: false,
              error: null,
              isMobileRole: false,
            })
          }
          return
        }

        // Get user profile using client
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single()

        if (profileError) {
          throw profileError
        }

        if (!profile) {
          throw new Error('프로필을 찾을 수 없습니다.')
        }

        const isMobileRole = ['worker', 'site_manager', 'customer_manager'].includes(
          profile.role || ''
        )

        if (mounted) {
          setState({
            user: session.user,
            profile,
            loading: false,
            error: null,
            isMobileRole,
          })
        }
      } catch (error) {
        console.error('Auth error:', error)
        if (mounted) {
          setState({
            user: null,
            profile: null,
            loading: false,
            error: error instanceof Error ? error.message : '인증 오류가 발생했습니다.',
            isMobileRole: false,
          })
        }
      }
    }

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setState({
          user: null,
          profile: null,
          loading: false,
          error: null,
          isMobileRole: false,
        })
      } else if (event === 'SIGNED_IN' && session) {
        // Refresh profile when user signs in
        getSession()
      }
    })

    getSession()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return state
}

export const useMobileUser = () => {
  const auth = useMobileAuth()

  return {
    ...auth,
    isWorker: auth.profile?.role === 'worker',
    isSiteManager: auth.profile?.role === 'site_manager',
    isCustomerManager: auth.profile?.role === 'customer_manager',
    canAccessMobile: auth.isMobileRole,
  }
}
