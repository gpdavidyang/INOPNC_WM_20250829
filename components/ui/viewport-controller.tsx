'use client'

import { useEffect, useState, useRef } from 'react'
import { getClientUserRole, isRoleMobileUI, isRoleDesktopUI } from '@/lib/auth/role-detection'
import { cn } from '@/lib/utils'

interface ViewportControllerProps {
  children: React.ReactNode
}

// Enhanced debugging for development
const DEBUG = process.env.NODE_ENV === 'development'
function log(...args: any[]) {
  if (DEBUG && typeof console !== 'undefined') {
    console.log('[ViewportController]', new Date().toISOString(), ...args)
  }
}

// Inject critical styles immediately to prevent FOUC
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_ENABLE_FIXED_UI_MODE === 'true') {
  const role = getClientUserRole()
  log('Initial role detection:', role)
  
  if (isRoleDesktopUI(role)) {
    log('Applying immediate desktop enforcement for role:', role)
    
    // Apply classes and attributes IMMEDIATELY
    document.documentElement.classList.add('force-desktop-ui', 'desktop-enforced', 'react-controlled')
    document.documentElement.setAttribute('data-desktop-mode', 'true')
    document.documentElement.setAttribute('data-user-role', role)
    
    if (document.body) {
      document.body.classList.add('force-desktop-ui', 'desktop-enforced', 'react-controlled')
      document.body.setAttribute('data-desktop-mode', 'true')
    }
    
    // Inject styles IMMEDIATELY before React hydration
    const styleId = 'force-desktop-critical-styles'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.setAttribute('data-priority', 'maximum')
      style.innerHTML = `
        /* CRITICAL: Force Desktop UI Override - Maximum Priority */
        html.force-desktop-ui,
        body.force-desktop-ui {
          min-width: 1536px !important;
          width: max-content !important;
          overflow-x: auto !important;
          overflow-y: visible !important;
          position: relative !important;
          height: auto !important;
        }
        
        /* Disable ALL Tailwind responsive utilities */
        @media all {
          /* Force desktop layout at all screen sizes */
          .force-desktop-ui,
          .force-desktop-ui * {
            /* Remove ALL responsive prefixes */
          }
          
          /* Show desktop elements always */
          .force-desktop-ui .lg\\:block { display: block !important; }
          .force-desktop-ui .lg\\:flex { display: flex !important; }
          .force-desktop-ui .lg\\:inline-block { display: inline-block !important; }
          .force-desktop-ui .lg\\:inline-flex { display: inline-flex !important; }
          .force-desktop-ui .lg\\:grid { display: grid !important; }
          .force-desktop-ui .lg\\:table { display: table !important; }
          .force-desktop-ui .lg\\:fixed { position: fixed !important; }
          .force-desktop-ui .lg\\:absolute { position: absolute !important; }
          .force-desktop-ui .lg\\:relative { position: relative !important; }
          .force-desktop-ui .lg\\:sticky { position: sticky !important; }
          
          /* Hide mobile elements always */
          .force-desktop-ui .lg\\:hidden { display: none !important; }
          .force-desktop-ui [class*="sm\\:"], 
          .force-desktop-ui [class*="md\\:"]:not([class*="lg\\:"]) {
            /* Reset mobile-only styles */
          }
          
          /* Force specific desktop widths */
          .force-desktop-ui .lg\\:w-72 { width: 18rem !important; }
          .force-desktop-ui .lg\\:w-64 { width: 16rem !important; }
          .force-desktop-ui .lg\\:w-16 { width: 4rem !important; }
          .force-desktop-ui .lg\\:pl-72 { padding-left: 18rem !important; }
          .force-desktop-ui .lg\\:pl-64 { padding-left: 16rem !important; }
          .force-desktop-ui .lg\\:pl-16 { padding-left: 4rem !important; }
          .force-desktop-ui .lg\\:ml-72 { margin-left: 18rem !important; }
          .force-desktop-ui .lg\\:ml-64 { margin-left: 16rem !important; }
          .force-desktop-ui .lg\\:ml-16 { margin-left: 4rem !important; }
          .force-desktop-ui .lg\\:left-0 { left: 0 !important; }
          .force-desktop-ui .lg\\:inset-y-0 { top: 0 !important; bottom: 0 !important; }
          
          /* Admin specific overrides */
          .force-desktop-ui .admin-sidebar-mobile,
          .force-desktop-ui .mobile-menu-button,
          .force-desktop-ui .mobile-backdrop,
          .force-desktop-ui [class*="mobile-only"] { 
            display: none !important; 
          }
          
          /* Container overrides */
          .force-desktop-ui .container,
          .force-desktop-ui .max-w-7xl,
          .force-desktop-ui .max-w-6xl,
          .force-desktop-ui .max-w-5xl { 
            max-width: none !important;
            width: 100% !important;
          }
          
          /* Main content area */
          .force-desktop-ui main,
          .force-desktop-ui .main-content,
          .force-desktop-ui [role="main"] {
            min-width: 1536px !important;
            width: 100% !important;
          }
          
          /* Table overrides - prevent responsive tables */
          .force-desktop-ui table {
            display: table !important;
            width: 100% !important;
          }
          .force-desktop-ui thead { display: table-header-group !important; }
          .force-desktop-ui tbody { display: table-row-group !important; }
          .force-desktop-ui tr { display: table-row !important; }
          .force-desktop-ui th,
          .force-desktop-ui td { display: table-cell !important; }
          
          /* Prevent any flex wrapping on mobile */
          .force-desktop-ui .flex-wrap { flex-wrap: nowrap !important; }
          .force-desktop-ui .flex-col { flex-direction: row !important; }
        }
        
        /* Override ALL media queries - force desktop at every breakpoint */
        @media (max-width: 9999px) {
          html.force-desktop-ui,
          body.force-desktop-ui {
            min-width: 1536px !important;
          }
        }
        
        @media (max-width: 1536px), (max-width: 1280px), (max-width: 1024px), 
               (max-width: 768px), (max-width: 640px), (max-width: 480px) {
          .force-desktop-ui {
            /* Apply desktop styles at ALL breakpoints */
            min-width: 1536px !important;
          }
          
          /* Remove ALL mobile transforms */
          .force-desktop-ui .translate-x-0,
          .force-desktop-ui .-translate-x-full {
            transform: none !important;
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
  const protectionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const mutationObserverRef = useRef<MutationObserver | null>(null)
  
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
    log('ViewportController - Role detected:', role)
    
    // Determine UI mode based on role only (ignore device width)
    if (isRoleMobileUI(role)) {
      // worker, site_manager, customer_manager → force mobile UI
      setUiMode('mobile')
      log('Setting UI mode to mobile')
    } else if (isRoleDesktopUI(role)) {
      // admin, system_admin → ALWAYS force desktop UI (even on mobile devices)
      setUiMode('desktop')
      log('Setting UI mode to desktop - FORCED')
    } else {
      // Other roles → use responsive design
      setUiMode(null)
      log('No forced UI mode - using responsive')
    }
  }, [])
  
  useEffect(() => {
    if (!isEnabled || !uiMode) {
      // Clean up any previously applied classes
      document.body.classList.remove('force-mobile-ui', 'force-desktop-ui', 'desktop-enforced')
      document.documentElement.classList.remove('force-mobile-ui', 'force-desktop-ui', 'desktop-enforced')
      // Remove inline styles
      document.documentElement.style.minWidth = ''
      document.body.style.minWidth = ''
      
      // Clear protection mechanisms
      if (protectionIntervalRef.current) {
        clearInterval(protectionIntervalRef.current)
        protectionIntervalRef.current = null
      }
      if (mutationObserverRef.current) {
        mutationObserverRef.current.disconnect()
        mutationObserverRef.current = null
      }
      
      return
    }
    
    // Apply body classes for global CSS overrides
    const body = document.body
    const html = document.documentElement
    
    if (uiMode === 'mobile') {
      body.classList.add('force-mobile-ui')
      body.classList.remove('force-desktop-ui', 'desktop-enforced')
      html.classList.add('force-mobile-ui')
      html.classList.remove('force-desktop-ui', 'desktop-enforced')
      
      // Update viewport meta tag for mobile
      let viewport = document.querySelector('meta[name="viewport"]')
      if (!viewport) {
        viewport = document.createElement('meta')
        viewport.setAttribute('name', 'viewport')
        document.head.appendChild(viewport)
      }
      viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes')
    } else if (uiMode === 'desktop') {
      log('Applying desktop UI enforcement in ViewportController')
      
      // Apply multiple classes for redundancy
      body.classList.add('force-desktop-ui', 'desktop-enforced', 'react-controlled')
      body.classList.remove('force-mobile-ui')
      html.classList.add('force-desktop-ui', 'desktop-enforced', 'react-controlled')
      html.classList.remove('force-mobile-ui')
      
      // Set data attributes for additional targeting
      html.setAttribute('data-desktop-mode', 'true')
      body.setAttribute('data-desktop-mode', 'true')
      
      // Force desktop viewport for admin/system_admin roles (even on mobile devices)
      let viewport = document.querySelector('meta[name="viewport"]') as HTMLMetaElement
      if (!viewport) {
        viewport = document.createElement('meta')
        viewport.setAttribute('name', 'viewport')
        document.head.appendChild(viewport)
      }
      
      // Detect if it's actually a mobile device
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                           window.innerWidth < 768 ||
                           ('ontouchstart' in window) ||
                           (navigator.maxTouchPoints > 0)
      
      log('Is mobile device:', isMobileDevice, 'User agent:', navigator.userAgent)
      
      if (isMobileDevice) {
        // For mobile devices, set a very small initial scale to show the full desktop width
        const viewportContent = 'width=1536, initial-scale=0.2, minimum-scale=0.1, maximum-scale=10, user-scalable=yes'
        viewport.setAttribute('content', viewportContent)
        log('Mobile viewport set:', viewportContent)
      } else {
        // For desktop devices, use normal scale
        const viewportContent = 'width=1536, initial-scale=1, minimum-scale=0.5, maximum-scale=10, user-scalable=yes'
        viewport.setAttribute('content', viewportContent)
        log('Desktop viewport set:', viewportContent)
      }
      
      // Force minimum width on html and body with AGGRESSIVE inline styles
      const criticalStyles = `
        min-width: 1536px !important;
        width: auto !important;
        overflow-x: auto !important;
        overflow-y: visible !important;
        position: relative !important;
        height: auto !important;
        transform: none !important;
        -webkit-overflow-scrolling: touch !important;
      `
      
      document.documentElement.style.cssText = criticalStyles
      document.body.style.cssText = criticalStyles
      
      log('Inline styles applied')
      
      // Set up MutationObserver to protect our changes
      if (!mutationObserverRef.current) {
        mutationObserverRef.current = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'attributes') {
              const target = mutation.target as HTMLElement
              
              // Protect class changes on html/body
              if ((target === html || target === body) && mutation.attributeName === 'class') {
                if (!target.classList.contains('force-desktop-ui')) {
                  target.classList.add('force-desktop-ui', 'desktop-enforced', 'react-controlled')
                  log('MutationObserver: Re-added desktop classes to', target.tagName)
                }
              }
              
              // Protect viewport changes
              if (target.tagName === 'META' && target.getAttribute('name') === 'viewport') {
                const currentContent = target.getAttribute('content')
                if (!currentContent?.includes('width=1536')) {
                  if (isMobileDevice) {
                    target.setAttribute('content', 'width=1536, initial-scale=0.2, minimum-scale=0.1, maximum-scale=10, user-scalable=yes')
                  } else {
                    target.setAttribute('content', 'width=1536, initial-scale=1, minimum-scale=0.5, maximum-scale=10, user-scalable=yes')
                  }
                  log('MutationObserver: Viewport corrected')
                }
              }
            }
          })
        })
        
        mutationObserverRef.current.observe(document.documentElement, {
          attributes: true,
          attributeOldValue: true,
          subtree: true
        })
        
        log('MutationObserver set up for protection')
      }
      
      // Periodic enforcement DISABLED to prevent infinite loops
      // MutationObserver is sufficient for protection
      log('Periodic enforcement disabled - using MutationObserver only')
    }
    
    // Cleanup on unmount
    return () => {
      body.classList.remove('force-mobile-ui', 'force-desktop-ui', 'desktop-enforced', 'react-controlled')
      html.classList.remove('force-mobile-ui', 'force-desktop-ui', 'desktop-enforced', 'react-controlled')
      html.removeAttribute('data-desktop-mode')
      body.removeAttribute('data-desktop-mode')
      document.documentElement.style.minWidth = ''
      document.body.style.minWidth = ''
      
      // Clear protection mechanisms
      if (protectionIntervalRef.current) {
        clearInterval(protectionIntervalRef.current)
        protectionIntervalRef.current = null
      }
      if (mutationObserverRef.current) {
        mutationObserverRef.current.disconnect()
        mutationObserverRef.current = null
      }
      
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