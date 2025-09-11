'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useOptionalNavigation } from '@/components/navigation/navigation-controller'

export interface BottomNavItem {
  label: string
  href: string
  icon: React.ReactNode
  badge?: string | number
  specialAction?: 'filter-blueprint' // 공도면 특수 동작
}

interface BottomNavigationProps extends React.HTMLAttributes<HTMLElement> {
  items: BottomNavItem[]
  currentUser?: {
    id: string
    active_site_id?: string
  }
  onTabChange?: (tabId: string) => void
  activeTab?: string
}

const BottomNavigation = React.forwardRef<HTMLElement, BottomNavigationProps>(
  ({ className, items, currentUser, onTabChange, activeTab, ...props }, ref) => {
    const pathname = usePathname()
    const router = useRouter()
    // Safe navigation hook usage with error handling
    let navigation = null
    let navigate = null
    let isNavigating = false
    
    try {
      navigation = useOptionalNavigation()
      navigate = navigation?.navigate
      isNavigating = navigation?.isNavigating || false
    } catch (error) {
      // NavigationController not available, using fallback navigation
      // Keep navigate as null, will use router.push fallback
    }

    const handleNavigation = React.useCallback((item: BottomNavItem, e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation() // Stop event bubbling
      
      // 이미 네비게이션 중이면 무시 (짧은 시간 체크)
      if (isNavigating) {
        return
      }
      
      if (item.specialAction === 'filter-blueprint') {
        // 공도면 특수 동작: 공유문서함으로 이동하며 자동 필터링
        if (currentUser?.active_site_id) {
          // 현재 사용자의 활성 현장으로 필터링 + 공도면 badge 검색
          const filterParams = new URLSearchParams({
            site: currentUser.active_site_id,
            document_type: '공도면',
            auto_filter: 'true'
          })
          if (onTabChange) {
            onTabChange('shared-documents')
          } else {
            router.push(`/dashboard/shared-documents?${filterParams.toString()}`)
          }
        } else {
          // 현장 미배정 시 안내 메시지와 함께 기본 경로로 이동
          if (onTabChange) {
            onTabChange('shared-documents')
          } else {
            router.push(`${item.href}?no_site_assigned=true`)
          }
        }
        return
      }
      
      // Special handling for documents - use URL-based navigation
      if (item.href === '#documents-unified' || item.href === '#documents' || item.href.includes('documents')) {
        // Always navigate to documents page directly
        const targetUrl = '/dashboard/documents'
        
        if (navigate) {
          navigate(targetUrl)
        } else {
          router.push(targetUrl)
        }
        return
      }
      
      // 일반 네비게이션 - 성능 최적화된 라우팅
      if (item.href.startsWith('#')) {
        // 해시 기반 탭은 onTabChange 호출
        if (onTabChange) {
          const tabId = item.href.replace('#', '')
          onTabChange(tabId)
        }
      } else {
        // 직접 경로는 통합 네비게이션 컨트롤러 사용
        console.log('[BottomNav] Navigating to:', item.href)
        
        // Include hash in comparison to ensure navigation works from hash routes
        const currentFullPath = `${pathname}${window.location.hash}`
        const targetFullPath = item.href
        
        if (currentFullPath !== targetFullPath) {
          // Clear any existing hash when navigating to a new route
          if (!item.href.includes('#') && window.location.hash) {
            console.log('[BottomNav] Clearing hash for clean navigation')
            window.location.hash = ''
            // Small delay to ensure hash is cleared before navigation
            setTimeout(() => {
              if (navigate) {
                navigate(item.href)
              } else {
                console.log('[BottomNavigation] NavigationController not available, using router.push')
                router.push(item.href)
              }
            }, 10)
          } else {
            // Normal navigation
            if (navigate) {
              navigate(item.href)
            } else {
              console.log('[BottomNavigation] NavigationController not available, using router.push')
              router.push(item.href)
            }
          }
        } else {
          console.log('[BottomNav] Already on target route, skipping navigation')
        }
      }
    }, [isNavigating, navigate, pathname, currentUser, onTabChange, router])

    return (
      <nav
        ref={ref}
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 border-t bg-white dark:bg-gray-900 md:hidden",
          // Simplified height for better positioning
          "h-16",
          "border-gray-200 dark:border-gray-700",
          "shadow-xl backdrop-blur-sm bg-white/95 dark:bg-gray-900/95",
          className
        )}
        {...props}
        role="navigation"
        aria-label="하단 메인 네비게이션"
      >
        <div className="flex h-full items-center justify-around px-1">
          {(items || []).map((item, index) => {
            
            // 활성 상태 판단 로직
            let isActive = false
            if (onTabChange && item.href.startsWith('#')) {
              // 탭 시스템에서는 현재 탭으로 판단
              const tabId = item.href.replace('#', '')
              isActive = activeTab === tabId || 
                (item.specialAction === 'filter-blueprint' && activeTab === 'shared-documents')
            } else {
              // 라우터 기반 시스템
              isActive = pathname === item.href || 
                (item.specialAction === 'filter-blueprint' && pathname.includes('/shared-documents'))
            }
            
            return (
              <button
                key={index}
                onClick={(e) => handleNavigation(item, e)}
                className={cn(
                  "relative flex flex-col items-center justify-center transition-all duration-200",
                  // Enhanced touch targets for construction site usage
                  "min-h-[60px] min-w-[60px] flex-1",
                  // Improved text size for outdoor visibility
                  "text-[11px] font-semibold gap-1",
                  // 터치 최적화
                  "active:scale-95 touch-manipulation",
                  // 포커스 표시 - UI Guidelines 색상
                  "focus-visible:outline-2 focus-visible:outline-toss-blue-500 focus-visible:outline-offset-1",
                  // UI Guidelines 색상 시스템 적용 - 활성/비활성 상태 통일
                  isActive 
                    ? "text-gray-800 dark:text-gray-200" // 활성 상태: 진한 회색
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" // 비활성 상태: 기본 회색
                )}
                aria-label={`${item.label}으로 이동`}
                aria-current={isActive ? "page" : undefined}
              >
                <div className="relative">
                  {React.isValidElement(item.icon) 
                    ? React.cloneElement(item.icon as React.ReactElement, {
                        className: "h-6 w-6", // Larger icons for better visibility (24x24px)
                        "aria-hidden": "true",
                        strokeWidth: isActive ? 2.5 : 1.5, // Enhanced stroke for outdoor visibility
                        stroke: "currentColor", // Ensure icons use current text color
                        fill: "none" // Ensure no fill color override
                      })
                    : item.icon}
                  {item.badge && (
                    <div className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[7px] font-bold text-white min-w-[12px]">
                      {typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
                    </div>
                  )}
                </div>
                <span className="truncate max-w-[48px] leading-tight">
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    )
  }
)
BottomNavigation.displayName = "BottomNavigation"

export { BottomNavigation }