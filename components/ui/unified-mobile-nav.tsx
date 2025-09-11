'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Home, Calendar, FileText, FolderOpen, User as UserIcon, MapPin, DollarSign } from 'lucide-react'
import Image from 'next/image'
import { useNewDesign } from '@/lib/feature-flags'

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

// Create nav items dynamically based on feature flags
const createNavItems = (newDesign: boolean): NavItem[] => [
  {
    id: "home",
    label: "빠른메뉴",
    href: "/dashboard",
    icon: newDesign ? 
      <Image src="/images/brand/memo.png" alt="홈" width={24} height={24} className="h-6 w-6" /> :
      <Home className="h-6 w-6" />,
    roles: ['worker', 'site_manager', 'customer_manager', 'admin', 'system_admin']
  },
  {
    id: "attendance",
    label: "출근현황",
    href: "/dashboard/attendance",
    icon: newDesign ? 
      <Image src="/images/brand/출력현황.png" alt="출근현황" width={24} height={24} className="h-6 w-6" /> :
      <Calendar className="h-6 w-6" />,
    roles: ['worker', 'site_manager', 'customer_manager', 'admin', 'system_admin']
  },
  {
    id: "daily-reports",
    label: "작업일지",
    href: "/dashboard/daily-reports",
    icon: newDesign ? 
      <Image src="/images/brand/작업일지.png" alt="작업일지" width={24} height={24} className="h-6 w-6" /> :
      <FileText className="h-6 w-6" />,
    roles: ['worker', 'site_manager', 'customer_manager', 'admin', 'system_admin']
  },
  {
    id: "site-info",
    label: "현장정보",
    href: "/dashboard/site-info",
    icon: newDesign ? 
      <Image src="/images/brand/현장정보.png" alt="현장정보" width={24} height={24} className="h-6 w-6" /> :
      <MapPin className="h-6 w-6" />,
    roles: ['worker', 'site_manager', 'customer_manager', 'admin', 'system_admin']
  },
  {
    id: "salary",
    label: "급여",
    href: "/dashboard/salary",
    icon: newDesign ? 
      <Image src="/images/brand/급여.png" alt="급여" width={24} height={24} className="h-6 w-6" /> :
      <DollarSign className="h-6 w-6" />,
    roles: ['worker', 'site_manager', 'admin', 'system_admin']
  }
]

export function UnifiedMobileNav({ userRole, activeTab, onTabChange }: UnifiedMobileNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const newDesign = useNewDesign()
  const [isNavigating, setIsNavigating] = React.useState(false)

  // Create nav items and filter based on user role
  const navItems = createNavItems(newDesign)
  const visibleItems = navItems.filter(item => item.roles.includes(userRole))

  const handleNavigation = React.useCallback(async (item: NavItem, e: React.MouseEvent) => {
    e.preventDefault()
    
    if (isNavigating) return
    
    setIsNavigating(true)
    
    try {
      if (item.href === pathname) {
        return // Already on this page
      }
      
      // Always use direct navigation for URL routes
      await router.push(item.href)
      
      // REMOVED: onTabChange call to prevent infinite recursion
      // The DashboardLayout already handles activeTab updates via useEffect when pathname changes
      // Calling onTabChange here creates a circular state update pattern:
      // UnifiedMobileNav -> onTabChange -> DashboardLayout setActiveTab -> re-render -> infinite loop
      
    } catch (error) {
      // Silent error handling
    } finally {
      // Reset navigation state after a short delay
      setTimeout(() => {
        setIsNavigating(false)
      }, 500)
    }
  }, [router, pathname, isNavigating]) // REMOVED: onTabChange from dependencies

  const isActive = React.useCallback((item: NavItem) => {
    if (activeTab && item.href.startsWith('#')) {
      return activeTab === item.id
    }
    return pathname === item.href || pathname.startsWith(item.href + '/')
  }, [pathname, activeTab])

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-[9999] bg-[var(--nav-bg)] dark:bg-[var(--nav-bg)] border-t border-[var(--nav-border)] dark:border-[var(--nav-border)] md:hidden shadow-lg"
      style={{ 
        position: 'fixed', 
        bottom: '0', 
        left: '0', 
        right: '0',
        height: 'var(--nav-h)',
        transform: 'translateZ(0)', // Force GPU acceleration
        backfaceVisibility: 'hidden' // Prevent flickering
      }}
    >
      <div className="flex h-16 items-center justify-around px-2" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}>
        {visibleItems && Array.isArray(visibleItems) && visibleItems.map((item) => {
          const active = isActive(item)
          
          return (
            <button
              key={item.id}
              onClick={(e) => handleNavigation(item, e)}
              disabled={isNavigating}
              className={cn(
                "flex flex-1 flex-col items-center justify-center p-2 transition-all duration-200",
                "min-h-[60px] text-xs font-medium rounded-lg mx-1",
                active
                  ? "text-[var(--nav-text-active)] bg-blue-50 dark:bg-blue-900/20 scale-105"
                  : "text-[var(--nav-text)] hover:text-[var(--nav-text-active)] hover:bg-gray-50 dark:hover:bg-gray-800/50",
                isNavigating && "opacity-50"
              )}
              aria-label={`${item.label}으로 이동`}
              aria-current={active ? "page" : undefined}
            >
              <div className="relative">
                {/* Fixed: Don't use cloneElement with Next.js Image components */}
                <div className="h-6 w-6 stroke-current">
                  {React.isValidElement(item.icon) ? item.icon : <span>{item.icon}</span>}
                </div>
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