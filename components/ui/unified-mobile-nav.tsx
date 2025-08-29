'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Home, Calendar, FileText, FolderOpen, User as UserIcon, MapPin } from 'lucide-react'

export interface NavItem {
  id: string
  label: string
  href: string
  icon: React.ReactNode
  badge?: string | number
  roles: string[] // Which roles can see this item
}

interface UnifiedMobileNavProps {
  userRole: string
  activeTab?: string
  onTabChange?: (tabId: string) => void
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "home",
    label: "빠른메뉴",
    href: "/dashboard",
    icon: <Home className="h-6 w-6" />,
    roles: ['worker', 'site_manager', 'customer_manager', 'admin', 'system_admin']
  },
  {
    id: "attendance",
    label: "출근현황",
    href: "/dashboard/attendance",
    icon: <Calendar className="h-6 w-6" />,
    roles: ['worker', 'site_manager', 'customer_manager', 'admin', 'system_admin']
  },
  {
    id: "daily-reports",
    label: "작업일지",
    href: "/dashboard/daily-reports",
    icon: <FileText className="h-6 w-6" />,
    roles: ['worker', 'site_manager', 'customer_manager', 'admin', 'system_admin']
  },
  {
    id: "site-info",
    label: "현장정보",
    href: "/dashboard/site-info",
    icon: <MapPin className="h-6 w-6" />,
    roles: ['worker', 'site_manager', 'customer_manager', 'admin', 'system_admin']
  },
  {
    id: "documents",
    label: "문서함",
    href: "/dashboard/documents",
    icon: <FolderOpen className="h-6 w-6" />,
    roles: ['worker', 'site_manager', 'customer_manager', 'admin', 'system_admin']
  }
]

export function UnifiedMobileNav({ userRole, activeTab, onTabChange }: UnifiedMobileNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isNavigating, setIsNavigating] = React.useState(false)

  // Filter items based on user role
  const visibleItems = NAV_ITEMS.filter(item => item.roles.includes(userRole))

  const handleNavigation = React.useCallback(async (item: NavItem, e: React.MouseEvent) => {
    e.preventDefault()
    
    if (isNavigating) return
    
    setIsNavigating(true)
    
    try {
      console.log('[UnifiedMobileNav] Navigation click:', item.label, 'href:', item.href, 'current:', pathname)
      
      if (item.href === pathname) {
        console.log('[UnifiedMobileNav] Already on this page, skipping navigation')
        return // Already on this page
      }
      
      // Always use direct navigation for URL routes
      console.log('[UnifiedMobileNav] Performing direct navigation to:', item.href)
      await router.push(item.href)
      
      // Call onTabChange for state management
      if (onTabChange) {
        console.log('[UnifiedMobileNav] Calling onTabChange with:', item.id)
        onTabChange(item.id)
      }
      
    } catch (error) {
      console.error('[UnifiedMobileNav] Navigation error:', error)
    } finally {
      // Reset navigation state after a short delay
      setTimeout(() => {
        setIsNavigating(false)
        console.log('[UnifiedMobileNav] Navigation state reset')
      }, 500)
    }
  }, [router, pathname, onTabChange, isNavigating])

  const isActive = React.useCallback((item: NavItem) => {
    if (activeTab && item.href.startsWith('#')) {
      return activeTab === item.id
    }
    return pathname === item.href || pathname.startsWith(item.href + '/')
  }, [pathname, activeTab])

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-[9999] bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 md:hidden shadow-lg"
      style={{ 
        position: 'fixed', 
        bottom: '0', 
        left: '0', 
        right: '0',
        transform: 'translateZ(0)', // Force GPU acceleration
        backfaceVisibility: 'hidden' // Prevent flickering
      }}
    >
      <div className="flex h-16 items-center justify-around px-2" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}>
        {visibleItems.map((item) => {
          const active = isActive(item)
          
          return (
            <button
              key={item.id}
              onClick={(e) => handleNavigation(item, e)}
              disabled={isNavigating}
              className={cn(
                "flex flex-1 flex-col items-center justify-center p-2 transition-colors",
                "min-h-[60px] text-xs font-medium",
                active
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300",
                isNavigating && "opacity-50"
              )}
              aria-label={`${item.label}으로 이동`}
              aria-current={active ? "page" : undefined}
            >
              <div className="relative">
                {React.cloneElement(item.icon as React.ReactElement, {
                  className: "h-6 w-6 stroke-current"
                })}
                {item.badge && (
                  <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {typeof item.badge === 'number' && item.badge > 9 ? '9+' : item.badge}
                  </div>
                )}
              </div>
              <span className="mt-1 truncate">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}