'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface Profile {
  id: string
  full_name: string | null
  role: string | null
  email: string | null
  site_id: string | null
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      
      if (session?.user) {
        // Get user profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, full_name, role, email, site_id')
          .eq('id', session.user.id)
          .single()
        
        setProfile(profileData)
      }
      
      setIsLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      
      if (session?.user) {
        // Get user profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, full_name, role, email, site_id')
          .eq('id', session.user.id)
          .single()
        
        setProfile(profileData)
      } else {
        setProfile(null)
      }
      
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  return {
    user,
    profile,
    isLoading,
    signOut,
    isAuthenticated: !!user,
    canAccessMobile: profile?.role && ['worker', 'site_manager', 'customer_manager'].includes(profile.role),
    canAccessAdmin: profile?.role && ['system_admin', 'admin'].includes(profile.role),
  }
}