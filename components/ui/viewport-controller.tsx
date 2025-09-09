'use client'

import { useEffect } from 'react'
import { useRoleBasedUI } from '@/hooks/use-role-based-ui'
import { cn } from '@/lib/utils'

interface ViewportControllerProps {
  children: React.ReactNode
}

/**
 * Controls viewport and applies role-based UI classes
 * Forces mobile or desktop UI based on user role
 */
export function ViewportController({ children }: ViewportControllerProps) {
  const { isMobileUI, isDesktopUI, isEnabled } = useRoleBasedUI()
  
  useEffect(() => {
    if (!isEnabled) return
    
    // Apply body classes for global CSS overrides
    const body = document.body
    
    if (isMobileUI) {
      body.classList.add('force-mobile-ui')
      body.classList.remove('force-desktop-ui')
      
      // Update viewport meta tag for mobile
      const viewport = document.querySelector('meta[name="viewport"]')
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes')
      }
    } else if (isDesktopUI) {
      body.classList.add('force-desktop-ui')
      body.classList.remove('force-mobile-ui')
      
      // Update viewport meta tag for desktop
      const viewport = document.querySelector('meta[name="viewport"]')
      if (viewport) {
        viewport.setAttribute('content', 'width=1280, initial-scale=1, user-scalable=yes')
      }
    } else {
      // Remove all role-based classes for auto mode
      body.classList.remove('force-mobile-ui', 'force-desktop-ui')
      
      // Reset viewport to default
      const viewport = document.querySelector('meta[name="viewport"]')
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes')
      }
    }
    
    // Cleanup on unmount
    return () => {
      body.classList.remove('force-mobile-ui', 'force-desktop-ui')
    }
  }, [isMobileUI, isDesktopUI, isEnabled])
  
  return (
    <div 
      className={cn(
        'min-h-screen',
        isMobileUI && 'mobile-ui-container',
        isDesktopUI && 'desktop-ui-container'
      )}
    >
      {children}
    </div>
  )
}