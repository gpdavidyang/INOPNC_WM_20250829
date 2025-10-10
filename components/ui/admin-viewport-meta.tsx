'use client'

import * as React from 'react'
import { useEffect } from 'react'

/**
 * Dynamic viewport meta tag adjustment based on user role
 */
export function AdminViewportMeta() {
  useEffect(() => {
    const role = getClientUserRole()
    const viewport = document.querySelector('meta[name="viewport"]') as HTMLMetaElement

    if (!viewport) return

    // Check if mobile device
    const isMobile =
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768

    // Adjust viewport based on role
    if (role === 'admin' || role === 'system_admin') {
      // Admin roles: Desktop UI with zoom capabilities
      if (isMobile) {
        // Mobile admin: Start zoomed out to see more content
        viewport.content =
          'width=1536, initial-scale=0.3, minimum-scale=0.1, maximum-scale=10, user-scalable=yes'
      } else {
        // Desktop admin: Normal viewport
        viewport.content =
          'width=device-width, initial-scale=1, minimum-scale=0.5, maximum-scale=5, user-scalable=yes'
      }
    } else if (role === 'worker' || role === 'site_manager' || role === 'customer_manager') {
      // Field roles: Mobile optimized viewport
      if (isMobile) {
        // Mobile field workers: Normal mobile viewport for better readability
        viewport.content =
          'width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=3.0, user-scalable=yes'
      } else {
        // Desktop field workers: Standard responsive viewport
        viewport.content =
          'width=device-width, initial-scale=1.0, minimum-scale=0.8, maximum-scale=2.0, user-scalable=yes'
      }
    } else {
      // Default: Standard mobile-friendly viewport
      viewport.content =
        'width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=5.0, user-scalable=yes'
    }
  }, [])

  return null
}
