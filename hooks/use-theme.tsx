'use client'

import { useState, useEffect } from 'react'

type Theme = 'light' | 'dark' | 'system'

// Unified theme hook: uses data-theme attribute and 'inopnc_theme' storage key.
// Also toggles the .dark class for Tailwind compatibility.
export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const stored = (localStorage.getItem('inopnc_theme') as Theme | null) || null
      let resolved: 'light' | 'dark'
      if (stored === 'dark' || stored === 'light') {
        resolved = stored
      } else {
        const prefersDark =
          window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        resolved = prefersDark ? 'dark' : 'light'
      }
      document.documentElement.setAttribute('data-theme', resolved)
      // Keep Tailwind class-based dark variant compatible
      document.documentElement.classList.toggle('dark', resolved === 'dark')
      setTheme(resolved)
    } catch (_) {
      // Safe fallback
      document.documentElement.setAttribute('data-theme', 'light')
      document.documentElement.classList.remove('dark')
      setTheme('light')
    }
  }, [])

  const updateTheme = (newTheme: Theme) => {
    try {
      let resolved: 'light' | 'dark'
      if (newTheme === 'system') {
        const prefersDark =
          window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        resolved = prefersDark ? 'dark' : 'light'
      } else {
        resolved = newTheme
      }
      document.documentElement.setAttribute('data-theme', resolved)
      document.documentElement.classList.toggle('dark', resolved === 'dark')
      localStorage.setItem('inopnc_theme', resolved)
      setTheme(resolved)
    } catch (_) {
      // ignore
    }
  }

  return {
    theme,
    setTheme: updateTheme,
    mounted,
  }
}
