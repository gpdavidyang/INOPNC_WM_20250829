'use client'

import { useEffect } from 'react'
import { getClientUserRole } from '@/lib/auth/role-detection'

/**
 * Dynamic viewport meta tag adjustment for admin roles on mobile
 */
export function AdminViewportMeta() {
  useEffect(() => {
    const role = getClientUserRole()
    
    // Only adjust viewport for admin roles
    if (role === 'admin' || role === 'system_admin') {
      const viewport = document.querySelector('meta[name="viewport"]') as HTMLMetaElement
      
      if (viewport) {
        // Check if mobile device
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
                        window.innerWidth < 768
        
        if (isMobile) {
          // Mobile admin: Start zoomed out to see more content
          viewport.content = 'width=1536, initial-scale=0.3, minimum-scale=0.1, maximum-scale=10, user-scalable=yes'
        } else {
          // Desktop admin: Normal viewport
          viewport.content = 'width=device-width, initial-scale=1, minimum-scale=0.5, maximum-scale=5, user-scalable=yes'
        }
      }
    }
  }, [])
  
  return null
}