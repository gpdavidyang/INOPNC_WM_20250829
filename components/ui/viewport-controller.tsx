'use client'

import { useEffect } from 'react'
import { getClientUserRole } from '@/lib/auth/role-detection'

interface ViewportControllerProps {
  children: React.ReactNode
}

/**
 * Simplified ViewportController that only adds role-based CSS classes
 * No DOM manipulation, no MutationObserver, no infinite loops
 */
export function ViewportController({ children }: ViewportControllerProps) {
  useEffect(() => {
    // Get user role from cookie
    const role = getClientUserRole()
    
    if (!role) return
    
    // Add role-based class to body for CSS targeting
    // This allows CSS to handle all UI adjustments without JavaScript
    const roleClass = `role-${role.replace(/_/g, '-')}`
    document.body.classList.add(roleClass)
    
    // Also add specific classes for admin roles
    if (role === 'admin' || role === 'system_admin') {
      document.body.classList.add('admin-role', 'desktop-ui')
    } else if (role === 'worker' || role === 'site_manager' || role === 'customer_manager') {
      document.body.classList.add('field-role', 'mobile-ui')
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove(roleClass, 'admin-role', 'field-role', 'desktop-ui', 'mobile-ui')
    }
  }, [])
  
  return <>{children}</>
}