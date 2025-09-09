'use client'

import { useState, useEffect } from 'react'
import { UserRole } from '@/types'

export type UIMode = 'auto' | 'mobile' | 'desktop'

interface RoleBasedUIReturn {
  isMobileUI: boolean
  isDesktopUI: boolean
  uiMode: UIMode
  setUiModeOverride: (mode: UIMode) => void
  isEnabled: boolean
  userRole: UserRole | undefined
}

/**
 * Hook for managing role-based UI modes
 * Forces mobile or desktop UI based on user role, regardless of device
 * NOTE: Currently disabled due to auth context issues in production
 */
export function useRoleBasedUI(): RoleBasedUIReturn {
  const [uiModeOverride, setUiModeOverride] = useState<UIMode>('auto')
  
  // Check if the feature is enabled
  const isEnabled = false // Temporarily disabled due to production issues
  
  // For now, return default values without auth dependency
  // This prevents errors while maintaining the API contract
  const isMobileUI = false
  const isDesktopUI = false
  
  // Load saved preference from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('ui-mode-override') as UIMode
      if (savedMode && ['auto', 'mobile', 'desktop'].includes(savedMode)) {
        setUiModeOverride(savedMode)
      }
    }
  }, [])
  
  // Save preference to localStorage
  const handleSetUiModeOverride = (mode: UIMode) => {
    setUiModeOverride(mode)
    if (typeof window !== 'undefined') {
      localStorage.setItem('ui-mode-override', mode)
    }
  }
  
  return {
    isMobileUI,
    isDesktopUI,
    uiMode: uiModeOverride,
    setUiModeOverride: handleSetUiModeOverride,
    isEnabled,
    userRole: undefined
  }
}