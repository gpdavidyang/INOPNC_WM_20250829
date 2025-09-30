'use client'

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useLayoutEffect,
  ReactNode,
} from 'react'
import { usePathname } from 'next/navigation'

interface FontSizeContextType {
  isLargeFont: boolean
  setIsLargeFont: (large: boolean) => void
  toggleFontSize: () => void
}

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined)

interface FontSizeProviderProps {
  children: ReactNode
}

export function FontSizeProvider({ children }: FontSizeProviderProps) {
  const [isLargeFont, setIsLargeFontState] = useState(false)
  const [mobileEnabled, setMobileEnabled] = useState<boolean>(() => {
    // Derive a best-effort initial value from the current path to avoid flashes on navigation
    if (typeof window !== 'undefined') {
      try {
        const p = window.location?.pathname || ''
        if (p.startsWith('/mobile')) return true
        if (p.startsWith('/dashboard')) return false
      } catch (_) {
        void 0
      }
    }
    // Default safe: treat as desktop (disabled)
    return false
  })
  const pathname = usePathname()

  // Helper: read a cookie value on client
  const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null
    const match = document.cookie.match(
      new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)')
    )
    return match ? decodeURIComponent(match[1]) : null
  }

  // Determine whether mobile UI features should be enabled on this route
  useEffect(() => {
    try {
      // 1) Path-based detection (fast, reliable)
      if (pathname) {
        if (pathname.startsWith('/mobile')) {
          setMobileEnabled(true)
          return
        }
        if (pathname.startsWith('/dashboard')) {
          setMobileEnabled(false)
          return
        }
      }

      // 2) Cookie-based role detection
      const role = getCookie('user-role')
      if (role === 'admin' || role === 'system_admin') {
        setMobileEnabled(false)
        return
      }
      if (role && ['worker', 'site_manager', 'customer_manager', 'partner'].includes(role)) {
        setMobileEnabled(true)
        return
      }

      // 3) UI track cookie as fallback
      const uiTrack = getCookie('ui-track')
      if (uiTrack) {
        setMobileEnabled(uiTrack.includes('/mobile'))
        return
      }

      // 4) Body classes as last resort
      if (typeof document !== 'undefined') {
        const hasMobile =
          document.body.classList.contains('mobile-ui') ||
          document.body.classList.contains('field-role')
        const hasDesktop =
          document.body.classList.contains('desktop-ui') ||
          document.body.classList.contains('admin-role')
        if (hasMobile) setMobileEnabled(true)
        else if (hasDesktop) setMobileEnabled(false)
        else setMobileEnabled(false) // default safe: desktop disabled
      }
    } catch (_) {
      setMobileEnabled(false)
    }
  }, [pathname])

  // Load font size preference for MOBILE UI only
  useEffect(() => {
    try {
      if (!mobileEnabled) {
        // Ensure large-font class is cleared when switching to desktop/admin
        setIsLargeFontState(false)
        if (typeof document !== 'undefined') {
          document.documentElement.classList.remove('large-font-mode')
        }
        return
      }

      // Prefer mobile-scoped key; migrate from legacy key if present
      const MOBILE_KEY = 'inopnc-font-size-mobile'
      const LEGACY_KEY = 'inopnc-font-size'
      let saved = localStorage.getItem(MOBILE_KEY)
      if (!saved) {
        const legacy = localStorage.getItem(LEGACY_KEY)
        if (legacy) {
          // Migrate legacy value into mobile-scoped key
          localStorage.setItem(MOBILE_KEY, legacy)
          saved = legacy
        }
      }

      if (saved === 'large') {
        setIsLargeFontState(true)
      } else {
        setIsLargeFontState(false)
      }
    } catch (error) {
      console.warn('Failed to load font size preference:', error)
    }
  }, [mobileEnabled])

  // Save font size preference to localStorage
  const setIsLargeFont = (large: boolean) => {
    // Only effective on mobile UI
    if (!mobileEnabled) {
      // Defensive cleanup in case someone tries to toggle on desktop
      setIsLargeFontState(false)
      if (typeof document !== 'undefined') {
        document.documentElement.classList.remove('large-font-mode')
      }
      return
    }
    setIsLargeFontState(large)
    try {
      localStorage.setItem('inopnc-font-size-mobile', large ? 'large' : 'normal')
    } catch (error) {
      console.warn('Failed to save font size preference:', error)
    }
  }

  // Toggle font size
  const toggleFontSize = () => {
    if (!mobileEnabled) return
    setIsLargeFont(!isLargeFont)
  }

  // Apply font size class to document root
  useLayoutEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    // Use pathname for immediate route-based decision to avoid flashes on SPA navigation
    const immediateMobile = (() => {
      try {
        if (pathname?.startsWith('/mobile')) return true
        if (pathname?.startsWith('/dashboard')) return false
      } catch (_) {
        void 0
      }
      return mobileEnabled
    })()

    if (immediateMobile && isLargeFont) {
      root.classList.add('large-font-mode')
    } else {
      root.classList.remove('large-font-mode')
    }
  }, [isLargeFont, mobileEnabled, pathname])

  const value = {
    isLargeFont,
    setIsLargeFont,
    toggleFontSize,
  }

  return <FontSizeContext.Provider value={value}>{children}</FontSizeContext.Provider>
}

// Custom hook to use font size context
export function useFontSize() {
  const context = useContext(FontSizeContext)
  if (context === undefined) {
    throw new Error('useFontSize must be used within a FontSizeProvider')
  }
  return context
}

// Utility function to get responsive text class
export function getResponsiveTextClass(
  baseClass: string,
  largeClass: string,
  isLargeFont: boolean
): string {
  return isLargeFont ? largeClass : baseClass
}

// Utility function to get typography class from design system
export function getFullTypographyClass(
  type: 'heading' | 'body' | 'caption' | 'button',
  size: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl',
  isLargeFont: boolean
): string {
  const sizeMap = {
    xs: isLargeFont ? 'text-base' : 'text-xs',
    sm: isLargeFont ? 'text-lg' : 'text-sm',
    base: isLargeFont ? 'text-xl' : 'text-base',
    lg: isLargeFont ? 'text-2xl' : 'text-lg',
    xl: isLargeFont ? 'text-3xl' : 'text-xl',
    '2xl': isLargeFont ? 'text-4xl' : 'text-2xl',
    '3xl': isLargeFont ? 'text-5xl' : 'text-3xl',
    '4xl': isLargeFont ? 'text-6xl' : 'text-4xl',
  }

  const weightMap = {
    heading: 'font-semibold',
    body: 'font-normal',
    caption: 'font-normal',
    button: 'font-medium',
  }

  return `${sizeMap[size]} ${weightMap[type]}`
}

// Simplified typography class getter (for common use cases)
export function getTypographyClass(
  size: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'small' | 'large' | 'label',
  isLargeFont: boolean
): string {
  // Handle common aliases
  const sizeMapping: Record<string, string> = {
    small: 'sm',
    large: 'lg',
    label: 'sm',
  }

  const actualSize = sizeMapping[size] || size

  const sizeMap = {
    xs: isLargeFont ? 'text-base' : 'text-xs',
    sm: isLargeFont ? 'text-lg' : 'text-sm',
    base: isLargeFont ? 'text-xl' : 'text-base',
    lg: isLargeFont ? 'text-2xl' : 'text-lg',
    xl: isLargeFont ? 'text-3xl' : 'text-xl',
    '2xl': isLargeFont ? 'text-4xl' : 'text-2xl',
    '3xl': isLargeFont ? 'text-5xl' : 'text-3xl',
    '4xl': isLargeFont ? 'text-6xl' : 'text-4xl',
  }

  return sizeMap[actualSize as keyof typeof sizeMap] || sizeMap.base
}
