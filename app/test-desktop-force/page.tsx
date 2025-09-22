'use client'

import { useEffect, useState } from 'react'
import { UI_TRACK_COOKIE_NAME } from '@/lib/auth/constants'

export default function TestDesktopForce() {
  const [debugInfo, setDebugInfo] = useState<unknown>({})
  const [viewportContent, setViewportContent] = useState('')
  const [cookies, setCookies] = useState('')
  
  useEffect(() => {
    // Gather all debug information
    const viewport = document.querySelector('meta[name="viewport"]')
    const role = getClientUserRole()
    
    const info = {
      // User info
      userRole: role,
      allCookies: document.cookie,
      
      // Feature flags
      featureEnabled: process.env.NEXT_PUBLIC_ENABLE_FIXED_UI_MODE,
      nodeEnv: process.env.NODE_ENV,
      
      // Classes applied
      htmlClasses: document.documentElement.className,
      bodyClasses: document.body.className,
      
      // Data attributes
      htmlDataAttrs: {
        desktopMode: document.documentElement.getAttribute('data-desktop-mode'),
        userRole: document.documentElement.getAttribute('data-user-role')
      },
      bodyDataAttrs: {
        desktopMode: document.body.getAttribute('data-desktop-mode')
      },
      
      // Styles applied
      htmlStyles: {
        minWidth: document.documentElement.style.minWidth,
        overflow: document.documentElement.style.overflow,
        width: document.documentElement.style.width
      },
      bodyStyles: {
        minWidth: document.body.style.minWidth,
        overflow: document.body.style.overflow,
        width: document.body.style.width,
        position: document.body.style.position
      },
      
      // Viewport info
      viewportContent: viewport?.getAttribute('content') || 'No viewport meta tag',
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      screenWidth: screen.width,
      screenHeight: screen.height,
      devicePixelRatio: window.devicePixelRatio,
      
      // Device detection
      userAgent: navigator.userAgent,
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      hasTouch: 'ontouchstart' in window,
      maxTouchPoints: navigator.maxTouchPoints,
      
      // Style sheets loaded
      styleSheets: Array.from(document.styleSheets).map(sheet => {
        try {
          return {
            href: sheet.href,
            ownerNode: sheet.ownerNode?.id || sheet.ownerNode?.getAttribute('data-priority')
          }
        } catch {
          return { error: 'Cannot access stylesheet' }
        }
      }),
      
      // Check for critical styles
      hasCriticalStyles: !!document.getElementById('force-desktop-critical-styles'),
      hasBulletproofStyles: !!document.getElementById('force-desktop-critical-bulletproof')
    }
    
    setDebugInfo(info)
    setViewportContent(viewport?.getAttribute('content') || 'No viewport meta tag')
    setCookies(document.cookie)
    
    // Monitor changes to viewport
    const observer = new MutationObserver(() => {
      const vp = document.querySelector('meta[name="viewport"]')
      setViewportContent(vp?.getAttribute('content') || 'No viewport meta tag')
    })
    
    if (viewport) {
      observer.observe(viewport, { attributes: true })
    }
    
    // Monitor changes to classes
    const classObserver = new MutationObserver(() => {
      setDebugInfo(prev => ({
        ...prev,
        htmlClasses: document.documentElement.className,
        bodyClasses: document.body.className
      }))
    })
    
    classObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    classObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    
    return () => {
      observer.disconnect()
      classObserver.disconnect()
    }
  }, [])
  
  const forceDesktopManually = () => {
    // Manually force desktop mode
    document.documentElement.classList.add('force-desktop-ui', 'desktop-enforced')
    document.body.classList.add('force-desktop-ui', 'desktop-enforced')
    
    const viewport = document.querySelector('meta[name="viewport"]') as HTMLMetaElement
    if (viewport) {
      viewport.content = 'width=1536, initial-scale=0.2, minimum-scale=0.1, maximum-scale=10, user-scalable=yes'
    }
    
    document.documentElement.style.minWidth = '1536px'
    document.documentElement.style.overflow = 'auto'
    document.body.style.minWidth = '1536px'
    document.body.style.overflow = 'auto'
    
    alert('Desktop mode forced manually!')
    window.location.reload()
  }
  
  const setAdminCookie = () => {
    document.cookie = 'user-role=admin; path=/; max-age=604800; SameSite=Lax'
    document.cookie = `${UI_TRACK_COOKIE_NAME}=/dashboard/admin; path=/; max-age=604800; SameSite=Lax`
    alert('Admin cookie set! Refreshing page...')
    window.location.reload()
  }

  const clearCookie = () => {
    document.cookie = 'user-role=; path=/; max-age=0; SameSite=Lax'
    document.cookie = `${UI_TRACK_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`
    alert('Cookie cleared! Refreshing page...')
    window.location.reload()
  }
  
  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Desktop Force Debug Page</h1>
      
      <div className="bg-yellow-100 border-2 border-yellow-500 p-4 mb-4 rounded">
        <h2 className="font-bold text-lg mb-2">Quick Status:</h2>
        <p className="font-mono">
          Role: <span className={debugInfo.userRole === 'admin' || debugInfo.userRole === 'system_admin' ? 'text-green-600' : 'text-red-600'}>
            {debugInfo.userRole || 'NONE'}
          </span>
        </p>
        <p className="font-mono">
          Desktop Classes: <span className={debugInfo.bodyClasses?.includes('force-desktop-ui') ? 'text-green-600' : 'text-red-600'}>
            {debugInfo.bodyClasses?.includes('force-desktop-ui') ? 'APPLIED' : 'NOT APPLIED'}
          </span>
        </p>
        <p className="font-mono">
          Viewport Width: <span className={viewportContent.includes('width=1536') ? 'text-green-600' : 'text-red-600'}>
            {viewportContent.includes('width=1536') ? '1536px (CORRECT)' : 'NOT SET'}
          </span>
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">Manual Controls:</h2>
          <div className="space-x-2">
            <button 
              onClick={setAdminCookie}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Set Admin Cookie
            </button>
            <button 
              onClick={clearCookie}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Clear Cookie
            </button>
            <button 
              onClick={forceDesktopManually}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Force Desktop Mode
            </button>
          </div>
        </div>
        
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">Cookies:</h2>
          <pre className="text-xs overflow-x-auto bg-white p-2 rounded">
            {cookies || 'No cookies'}
          </pre>
        </div>
        
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">Viewport Meta Tag:</h2>
          <pre className="text-xs overflow-x-auto bg-white p-2 rounded">
            {viewportContent}
          </pre>
        </div>
        
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">Full Debug Info:</h2>
          <pre className="text-xs overflow-x-auto bg-white p-2 rounded max-h-96">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
        
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">Responsive Test Elements:</h2>
          <div className="space-y-2">
            <div className="bg-blue-200 p-2 block lg:hidden">
              This should be HIDDEN on desktop (lg:hidden)
            </div>
            <div className="bg-green-200 p-2 hidden lg:block">
              This should be VISIBLE on desktop (lg:block)
            </div>
            <div className="bg-yellow-200 p-2">
              Window width: {debugInfo.windowWidth}px
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
