'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCoreAuth } from './core-auth-provider'
import { isDevelopmentAuthBypass, mockProfile } from '@/lib/dev-auth'

// Unified Profile interface
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

interface ProfileContextType {
  profile: UnifiedProfile | null
  loading: boolean
  error: string | null
  refreshProfile: () => Promise<void>
  getCurrentSite: () => Promise<any>
  getUserRole: () => string | null
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

interface ProfileProviderProps {
  children: React.ReactNode
  initialProfile?: UnifiedProfile | null
}

export function ProfileProvider({ children, initialProfile = null }: ProfileProviderProps) {
  const { user } = useCoreAuth()
  const isDevBypass = isDevelopmentAuthBypass()

  // Profile state
  const [profile, setProfile] = useState<UnifiedProfile | null>(
    isDevBypass ? mockProfile : initialProfile
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Prevent duplicate requests
  const profileFetching = useRef(false)

  const supabase = createClient()

  // Profile fetching with timeout and error handling
  const fetchProfile = useCallback(
    async (userId: string): Promise<void> => {
      if (profileFetching.current) return

      try {
        profileFetching.current = true
        setLoading(true)
        console.log('[PROFILE] Fetching profile for user:', userId)

        // Increase timeout for production environment
        const fetchWithTimeout = Promise.race([
          supabase?.from('profiles').select('*').eq('id', userId).single(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Profile fetch timeout after 10 seconds')), 10000)
          ),
        ])

        const { data, error: profileError } = (await fetchWithTimeout) as any

        if (profileError) {
          console.error('[PROFILE] Profile fetch error:', profileError)
          setError(profileError.message)

          // Provide more robust fallback data even on error
          if (user) {
            const fallbackProfile: UnifiedProfile = {
              id: user.id,
              email: user.email || '',
              full_name: user.email?.split('@')[0] || 'User',
              role: 'worker' as const,
              created_at: new Date().toISOString(),
              status: 'active'
            }
            setProfile(fallbackProfile)
            console.log('[PROFILE] Using fallback profile due to fetch error')
          }
          return
        }

        console.log('[PROFILE] Profile fetched successfully:', {
          id: data?.id,
          full_name: data?.full_name,
          email: data?.email,
          role: data?.role,
        })

        setProfile(data)
        setError(null)
      } catch (err: any) {
        console.error('[PROFILE] Profile fetch exception:', err)
        setError(err?.message || 'Failed to fetch profile')

        // Fallback to basic user info if profile fetch fails
        if (user) {
          setProfile({
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            role: 'worker', // Default role
          })
        }
      } finally {
        profileFetching.current = false
        setLoading(false)
      }
    },
    [user, supabase]
  )

  // Actions
  const refreshProfile = useCallback(async (): Promise<void> => {
    if (user) {
      await fetchProfile(user.id)
    }
  }, [user, fetchProfile])

  // Mobile-specific helper functions
  const getCurrentSite = useCallback(async () => {
    if (!profile?.site_id) return null

    try {
      const { data, error } = await supabase
        .from('sites')
        .select('*')
        .eq('id', profile.site_id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('[PROFILE] Get current site error:', error)
      return null
    }
  }, [profile?.site_id, supabase])

  const getUserRole = useCallback(() => {
    return profile?.role || null
  }, [profile?.role])

  // Fetch profile when user changes
  useEffect(() => {
    // Skip if development bypass is enabled
    if (isDevBypass) {
      console.log('[PROFILE] Using mock profile')
      setLoading(false)
      return
    }

    // Skip if we already have initial profile data (mobile SSR)
    if (initialProfile) {
      console.log('[PROFILE] Using server-provided initial profile')
      setLoading(false)
      return
    }

    if (user && !profile) {
      fetchProfile(user.id)
    } else if (!user) {
      // Clear profile when user is signed out
      setProfile(null)
      setError(null)
      setLoading(false)
    }
  }, [user, profile, fetchProfile, isDevBypass, initialProfile])

  // Retry profile fetch if loading gets stuck
  useEffect(() => {
    const retryTimeout = setTimeout(() => {
      if (loading && user && !profile && !profileFetching.current) {
        console.log('[PROFILE] Retrying profile fetch after timeout...')
        fetchProfile(user.id)
      }
    }, 5000)

    return () => clearTimeout(retryTimeout)
  }, [loading, user, profile, fetchProfile])

  const contextValue: ProfileContextType = {
    profile,
    loading,
    error,
    refreshProfile,
    getCurrentSite,
    getUserRole,
  }

  return <ProfileContext.Provider value={contextValue}>{children}</ProfileContext.Provider>
}

// Hook to use the profile context
export function useProfile(): ProfileContextType {
  const context = useContext(ProfileContext)
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider')
  }
  return context
}
