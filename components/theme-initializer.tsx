'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useAuthContext } from '@/providers/auth-provider'

export function ThemeInitializer() {
  const { setTheme } = useTheme()
  const { user } = useAuthContext()

  useEffect(() => {
    // Check if user is system_admin and set light mode by default
    if (user?.email === 'davidswyang@gmail.com') {
      // Check if theme has been explicitly set by user
      const hasUserPreference = localStorage.getItem('theme-user-preference')
      
      if (!hasUserPreference) {
        // Set light mode for system_admin on first login
        setTheme('light')
        localStorage.setItem('theme-user-preference', 'auto-set')
      }
    } else {
      // For other users, use saved theme or system default
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme && savedTheme !== 'system') {
        setTheme(savedTheme)
      }
    }
  }, [user, setTheme])

  useEffect(() => {
    // Initialize theme on mount for non-authenticated state
    if (!user) {
      const savedTheme = localStorage.getItem('theme') || 'light'
      
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }, [user])

  return null
}