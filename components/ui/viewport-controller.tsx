'use client'

import { useEffect, useState } from 'react'
import { getClientUserRole, isRoleMobileUI, isRoleDesktopUI } from '@/lib/auth/role-detection'
import { cn } from '@/lib/utils'

interface ViewportControllerProps {
  children: React.ReactNode
}

// Inject critical styles immediately to prevent FOUC
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_ENABLE_FIXED_UI_MODE === 'true') {
  const role = getClientUserRole()
  if (isRoleDesktopUI(role)) {
    // Inject styles IMMEDIATELY before React hydration
    const styleId = 'force-desktop-critical-styles'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.innerHTML = `
        /* CRITICAL: Force Desktop UI Override - Applied IMMEDIATELY */
        html.force-desktop-ui,
        body.force-desktop-ui {
          min-width: 1536px !important;
          width: auto !important;
          overflow-x: auto !important;
          overflow-y: visible !important;
          position: relative !important;
          height: auto !important;
        }
        
        /* Override ALL responsive breakpoints */
        @media all {
          .force-desktop-ui * {
            /* Reset any mobile-specific transforms or positions */
            transform: none !important;
          }
          
          /* Force show desktop elements */
          .force-desktop-ui .lg\\:block,
          .force-desktop-ui .xl\\:block,
          .force-desktop-ui .2xl\\:block { display: block !important; }
          .force-desktop-ui .lg\\:flex,
          .force-desktop-ui .xl\\:flex,
          .force-desktop-ui .2xl\\:flex { display: flex !important; }
          .force-desktop-ui .lg\\:inline-block,
          .force-desktop-ui .xl\\:inline-block,
          .force-desktop-ui .2xl\\:inline-block { display: inline-block !important; }
          .force-desktop-ui .lg\\:inline-flex,
          .force-desktop-ui .xl\\:inline-flex,
          .force-desktop-ui .2xl\\:inline-flex { display: inline-flex !important; }
          .force-desktop-ui .lg\\:grid,
          .force-desktop-ui .xl\\:grid,
          .force-desktop-ui .2xl\\:grid { display: grid !important; }
          
          /* Hide mobile elements */
          .force-desktop-ui .lg\\:hidden,
          .force-desktop-ui .xl\\:hidden,
          .force-desktop-ui .2xl\\:hidden { display: none !important; }
          .force-desktop-ui .block.lg\\:hidden,
          .force-desktop-ui .flex.lg\\:hidden { display: none !important; }
          .force-desktop-ui .mobile-nav,
          .force-desktop-ui .bottom-navigation,
          .force-desktop-ui [class*="mobile-only"] { display: none !important; }
          
          /* Force desktop widths */
          .force-desktop-ui .lg\\:w-72 { width: 18rem !important; }
          .force-desktop-ui .lg\\:w-64 { width: 16rem !important; }
          .force-desktop-ui .lg\\:w-16 { width: 4rem !important; }
          .force-desktop-ui .lg\\:w-0 { width: 0 !important; }
          .force-desktop-ui .lg\\:pl-72 { padding-left: 18rem !important; }
          .force-desktop-ui .lg\\:pl-64 { padding-left: 16rem !important; }
          .force-desktop-ui .lg\\:pl-16 { padding-left: 4rem !important; }
          .force-desktop-ui .lg\\:pl-0 { padding-left: 0 !important; }
          
          /* Force desktop positions */
          .force-desktop-ui .lg\\:fixed { position: fixed !important; }
          .force-desktop-ui .lg\\:absolute { position: absolute !important; }
          .force-desktop-ui .lg\\:relative { position: relative !important; }
          .force-desktop-ui .lg\\:sticky { position: sticky !important; }
          
          /* Override all small/medium breakpoint styles */
          .force-desktop-ui .sm\\:hidden,
          .force-desktop-ui .md\\:hidden { display: initial !important; }
          .force-desktop-ui .sm\\:block,
          .force-desktop-ui .md\\:block { display: block !important; }
          
          /* Container and layout overrides */
          .force-desktop-ui .container { 
            max-width: 1536px !important;
            width: 100% !important;
            padding-left: 2rem !important;
            padding-right: 2rem !important;
          }
          
          /* Ensure content doesn't collapse */
          .force-desktop-ui main,
          .force-desktop-ui .main-content,
          .force-desktop-ui [role="main"] {
            min-width: 1536px !important;
            width: auto !important;
          }
        }
        
        /* Disable ALL mobile-specific media queries */
        @media (max-width: 1920px), (max-width: 1536px), (max-width: 1280px), 
               (max-width: 1024px), (max-width: 768px), (max-width: 640px), 
               (max-width: 480px), (max-width: 320px) {
          .force-desktop-ui,
          .force-desktop-ui body {
            min-width: 1536px !important;
          }
        }
      `
      document.head.insertBefore(style, document.head.firstChild) // Insert at the beginning for higher priority
    }
    // Apply classes immediately
    document.documentElement.classList.add('force-desktop-ui')
    document.body.classList.add('force-desktop-ui')
  }
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
      // Remove inline styles
      document.documentElement.style.minWidth = ''
      document.body.style.minWidth = ''
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
      let viewport = document.querySelector('meta[name="viewport"]')
      if (!viewport) {
        viewport = document.createElement('meta')
        viewport.setAttribute('name', 'viewport')
        document.head.appendChild(viewport)
      }
      viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes')
    } else if (uiMode === 'desktop') {
      // Apply classes
      body.classList.add('force-desktop-ui')
      body.classList.remove('force-mobile-ui')
      html.classList.add('force-desktop-ui')
      html.classList.remove('force-mobile-ui')
      
      // Force desktop viewport for admin/system_admin roles (even on mobile devices)
      let viewport = document.querySelector('meta[name="viewport"]')
      if (!viewport) {
        viewport = document.createElement('meta')
        viewport.setAttribute('name', 'viewport')
        document.head.appendChild(viewport)
      }
      
      // Detect if it's actually a mobile device
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                           window.innerWidth < 768
      
      if (isMobileDevice) {
        // For mobile devices, set a very small initial scale to show the full desktop width
        viewport.setAttribute('content', 'width=1536, initial-scale=0.25, minimum-scale=0.1, maximum-scale=10, user-scalable=yes')
      } else {
        // For desktop devices, use normal scale
        viewport.setAttribute('content', 'width=1536, initial-scale=1, minimum-scale=0.5, maximum-scale=10, user-scalable=yes')
      }
      
      // Force minimum width on html and body for better scrolling
      document.documentElement.style.minWidth = '1536px'
      document.documentElement.style.overflow = 'auto'
      document.body.style.minWidth = '1536px'
      document.body.style.overflow = 'auto'
      document.body.style.position = 'relative'
      document.body.style.height = 'auto'
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