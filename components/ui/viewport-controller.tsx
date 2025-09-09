'use client'

import { useEffect, useState } from 'react'
import { getClientUserRole, isRoleMobileUI, isRoleDesktopUI } from '@/lib/auth/role-detection'
import { cn } from '@/lib/utils'

interface ViewportControllerProps {
  children: React.ReactNode
}

/**
 * Controls viewport and applies role-based UI classes
 * Forces mobile or desktop UI based on user role
 */
export function ViewportController({ children }: ViewportControllerProps) {
  const [uiMode, setUiMode] = useState<'mobile' | 'desktop' | null>(null)
  
  useEffect(() => {
    // Get role from cookie
    const role = getClientUserRole()
    
    // Determine UI mode based on role
    if (isRoleMobileUI(role)) {
      setUiMode('mobile')
    } else if (isRoleDesktopUI(role)) {
      setUiMode('desktop')
    } else {
      setUiMode(null)
    }
  }, [])
  
  useEffect(() => {
    if (!uiMode) return
    
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
      
      // Update viewport meta tag for desktop
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
  }, [uiMode])
  
  return (
    <div 
      className={cn(
        'min-h-screen',
        uiMode === 'mobile' && 'mobile-ui-container',
        uiMode === 'desktop' && 'desktop-ui-container'
      )}
    >
      {children}
    </div>
  )
}