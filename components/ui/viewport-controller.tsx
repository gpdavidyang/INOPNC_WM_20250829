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
    
    // Determine UI mode based on role only (ignore device width)
    if (isRoleMobileUI(role)) {
      // worker, site_manager, customer_manager → force mobile UI
      setUiMode('mobile')
    } else if (isRoleDesktopUI(role)) {
      // admin, system_admin → ALWAYS force desktop UI (even on mobile devices)
      setUiMode('desktop')
      
      // Inject critical CSS to override ALL media queries
      const styleId = 'force-desktop-critical-styles'
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style')
        style.id = styleId
        style.innerHTML = `
          /* CRITICAL: Force Desktop UI Override */
          @media all and (max-width: 9999px) {
            body.force-desktop-ui,
            html.force-desktop-ui body {
              min-width: 1280px !important;
              overflow-x: auto !important;
            }
            
            .force-desktop-ui .lg\\:hidden { display: none !important; }
            .force-desktop-ui .hidden.lg\\:block { display: block !important; }
            .force-desktop-ui .hidden.lg\\:flex { display: flex !important; }
            .force-desktop-ui .hidden.lg\\:inline-block { display: inline-block !important; }
            .force-desktop-ui .hidden.lg\\:inline-flex { display: inline-flex !important; }
            
            /* Hide mobile navigation */
            .force-desktop-ui [class*="mobile-menu"],
            .force-desktop-ui [class*="hamburger"],
            .force-desktop-ui .mobile-nav,
            .force-desktop-ui .bottom-navigation { 
              display: none !important; 
            }
          }
        `
        document.head.appendChild(style)
      }
    } else {
      // Other roles → use responsive design
      setUiMode(null)
    }
  }, [])
  
  useEffect(() => {
    if (!isEnabled || !uiMode) {
      // Clean up any previously applied classes
      document.body.classList.remove('force-mobile-ui', 'force-desktop-ui')
      document.documentElement.classList.remove('force-mobile-ui', 'force-desktop-ui')
      return
    }
    
    // Apply body classes for global CSS overrides
    const body = document.body
    const html = document.documentElement
    
    if (uiMode === 'mobile') {
      body.classList.add('force-mobile-ui')
      body.classList.remove('force-desktop-ui')
      html.classList.add('force-mobile-ui')
      html.classList.remove('force-desktop-ui')
      
      // Update viewport meta tag for mobile
      const viewport = document.querySelector('meta[name="viewport"]')
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes')
      }
    } else if (uiMode === 'desktop') {
      body.classList.add('force-desktop-ui')
      body.classList.remove('force-mobile-ui')
      html.classList.add('force-desktop-ui')
      html.classList.remove('force-mobile-ui')
      
      // Force desktop viewport for admin/system_admin roles (even on mobile devices)
      // Set a fixed 1280px width and allow users to zoom and scroll
      const viewport = document.querySelector('meta[name="viewport"]')
      if (viewport) {
        // Use a smaller initial scale on mobile to show more of the desktop layout
        const isMobileDevice = window.innerWidth < 768
        const initialScale = isMobileDevice ? '0.3' : '1'
        viewport.setAttribute('content', `width=1280, initial-scale=${initialScale}, minimum-scale=0.1, maximum-scale=10, user-scalable=yes`)
      }
      
      // Force minimum width on html and body for better scrolling
      document.documentElement.style.minWidth = '1280px'
      document.body.style.minWidth = '1280px'
    }
    
    // Cleanup on unmount
    return () => {
      body.classList.remove('force-mobile-ui', 'force-desktop-ui')
      html.classList.remove('force-mobile-ui', 'force-desktop-ui')
      document.documentElement.style.minWidth = ''
      document.body.style.minWidth = ''
      const viewport = document.querySelector('meta[name="viewport"]')
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes')
      }
      // Remove injected styles
      const injectedStyle = document.getElementById('force-desktop-critical-styles')
      if (injectedStyle) {
        injectedStyle.remove()
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