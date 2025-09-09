'use client'

import { useEffect, useState } from 'react'
import { getClientUserRole, isRoleMobileUI, isRoleDesktopUI } from '@/lib/auth/role-detection'
import { cn } from '@/lib/utils'

interface ViewportControllerProps {
  children: React.ReactNode
}

/**
 * Controls viewport and applies role-based UI classes
 * Optionally forces mobile or desktop UI based on user role and feature flag
 */
export function ViewportController({ children }: ViewportControllerProps) {
  const [uiMode, setUiMode] = useState<'mobile' | 'desktop' | null>(null)
  const [isEnabled, setIsEnabled] = useState(false)
  
  useEffect(() => {
    // Check if feature is enabled
    const enabled = process.env.NEXT_PUBLIC_ENABLE_FIXED_UI_MODE === 'true'
    setIsEnabled(enabled)
    
    if (!enabled) {
      setUiMode(null)
      return
    }
    
    // Get role from cookie
    const role = getClientUserRole()
    
    // Check actual device width
    const isMobileDevice = window.innerWidth < 768
    
    // For admin/system_admin roles on mobile devices, 
    // don't force desktop UI to prevent layout issues
    if (isRoleDesktopUI(role) && isMobileDevice) {
      // Let responsive design handle it naturally
      setUiMode(null)
    } else if (isRoleMobileUI(role)) {
      setUiMode('mobile')
    } else if (isRoleDesktopUI(role) && !isMobileDevice) {
      setUiMode('desktop')
    } else {
      setUiMode(null)
    }
  }, [])
  
  useEffect(() => {
    if (!isEnabled || !uiMode) {
      // Clean up any previously applied classes
      document.body.classList.remove('force-mobile-ui', 'force-desktop-ui')
      return
    }
    
    // Apply body classes for global CSS overrides
    const body = document.body
    
    if (uiMode === 'mobile') {
      body.classList.add('force-mobile-ui')
      body.classList.remove('force-desktop-ui')
      
      // Update viewport meta tag for mobile
      const viewport = document.querySelector('meta[name="viewport"]')
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes')
      }
    } else if (uiMode === 'desktop') {
      body.classList.add('force-desktop-ui')
      body.classList.remove('force-mobile-ui')
      
      // Update viewport meta tag for desktop (only on actual desktop devices)
      const viewport = document.querySelector('meta[name="viewport"]')
      if (viewport) {
        viewport.setAttribute('content', 'width=1280, initial-scale=1, user-scalable=yes')
      }
    }
    
    // Cleanup on unmount
    return () => {
      body.classList.remove('force-mobile-ui', 'force-desktop-ui')
      const viewport = document.querySelector('meta[name="viewport"]')
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes')
      }
    }
  }, [uiMode, isEnabled])
  
  return (
    <div 
      className={cn(
        'min-h-screen',
        isEnabled && uiMode === 'mobile' && 'mobile-ui-container',
        isEnabled && uiMode === 'desktop' && 'desktop-ui-container'
      )}
    >
      {children}
    </div>
  )
}