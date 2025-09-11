'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

interface NavigationContextType {
  activeTab: string
  setActiveTab: (tab: string) => void
  getTabFromPath: (path: string) => string
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<string>('home')

  const getTabFromPath = useCallback((path: string): string => {
    // URL-based routing only - no hash navigation
    if (path.includes('/dashboard/documents')) return 'documents'
    if (path.includes('/dashboard/daily-reports')) return 'daily-reports'
    if (path.includes('/dashboard/attendance')) return 'attendance'
    if (path.includes('/dashboard/site-info')) return 'site-info'
    if (path.includes('/dashboard/profile')) return 'profile'
    if (path === '/dashboard' || path === '/dashboard/') return 'home'
    return 'home'
  }, [])

  // Update active tab based on pathname
  useEffect(() => {
    const newTab = getTabFromPath(pathname)
    if (newTab !== activeTab) {
      setActiveTab(newTab)
    }
  }, [pathname, getTabFromPath])

  return (
    <NavigationContext.Provider value={{ activeTab, setActiveTab, getTabFromPath }}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider')
  }
  return context
}