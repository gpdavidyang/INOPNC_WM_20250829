'use client'

import { useState, useEffect, useContext } from 'react'
import { AuthContext } from '@/providers/auth-provider'
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
 */
export function useRoleBasedUI(): RoleBasedUIReturn {
  const [uiModeOverride, setUiModeOverride] = useState<UIMode>('auto')
  
  // Try to get auth context, but don't fail if not available
  const authContext = useContext(AuthContext)
  const profile = authContext?.profile
  
  // Check if the feature is enabled
  const isEnabled = process.env.NEXT_PUBLIC_ENABLE_FIXED_UI_MODE === 'true'
  
  // Define role-based UI preferences
  const mobileRoles: UserRole[] = ['worker', 'site_manager', 'customer_manager']
  const desktopRoles: UserRole[] = ['admin', 'system_admin']
  
  // Determine UI mode based on role
  const roleBasedMobileUI = isEnabled && profile?.role && mobileRoles.includes(profile.role)
  const roleBasedDesktopUI = isEnabled && profile?.role && desktopRoles.includes(profile.role)
  
  // Apply override if set
  const isMobileUI = uiModeOverride === 'mobile' || (uiModeOverride === 'auto' && roleBasedMobileUI)
  const isDesktopUI = uiModeOverride === 'desktop' || (uiModeOverride === 'auto' && roleBasedDesktopUI)
  
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
    isMobileUI: Boolean(isMobileUI),
    isDesktopUI: Boolean(isDesktopUI),
    uiMode: uiModeOverride,
    setUiModeOverride: handleSetUiModeOverride,
    isEnabled,
    userRole: profile?.role
  }
}