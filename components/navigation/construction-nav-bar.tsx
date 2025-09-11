'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"
import { useNavigation } from "./navigation-controller"

export interface ConstructionNavItem {
  id: string
  label: string
  href: string
  icon: React.ReactNode
  badge?: string | number
  priority?: 'high' | 'normal' | 'low'
  touchMode?: 'normal' | 'glove' | 'precision'
}

interface ConstructionNavBarProps extends React.HTMLAttributes<HTMLElement> {
  items: ConstructionNavItem[]
  currentUser?: {
    id: string
    active_site_id?: string
  }
}

const ConstructionNavBar = React.forwardRef<HTMLElement, ConstructionNavBarProps>(
  ({ className, items, currentUser, ...props }, ref) => {
    const pathname = usePathname()
    const { navigate, isNavigating } = useNavigation()
    
    // 터치 모드 자동 감지 (향후 확장)
    const [touchMode, setTouchMode] = React.useState<'normal' | 'glove' | 'precision'>('normal')
    
    const handleNavigation = React.useCallback((item: ConstructionNavItem, e: React.MouseEvent) => {
      e.preventDefault()
      
      // 이미 네비게이션 중이면 무시
      if (isNavigating) {
        return
      }
      
      // 현재 경로와 같으면 무시
      if (pathname === item.href) {
        return
      }
      
      // 통합 네비게이션 컨트롤러 사용
      navigate(item.href)
    }, [navigate, pathname, isNavigating])

    // 터치 모드별 크기 계산
    const getTouchTargetSize = () => {
      switch (touchMode) {
        case 'glove': return 'min-h-[64px] min-w-[64px]'
        case 'precision': return 'min-h-[48px] min-w-[48px]'
        default: return 'min-h-[60px] min-w-[60px]'
      }
    }

    return (
      <nav
        ref={ref}
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 border-t bg-white dark:bg-gray-900 md:hidden",
          // 건설 현장 특화 UI
          "h-[72px] supports-[height:env(safe-area-inset-bottom)]:h-[76px]",
          "border-orange-200 dark:border-orange-700", // 건설 테마 컬러
          "shadow-2xl backdrop-blur-md bg-white/98 dark:bg-gray-900/98",
          // 내구성 있는 디자인
          "before:absolute before:inset-0 before:bg-gradient-to-t before:from-orange-50/20 before:to-transparent",
          className
        )}
        {...props}
        role="navigation"
        aria-label="건설 현장 하단 네비게이션"
      >

        <div className="flex h-full items-center justify-around px-1 relative z-10">
          {items.map((item, index) => {
            const isActive = pathname === item.href || 
              (item.href === '/dashboard' && pathname === '/dashboard')
            
            return (
              <button
                key={item.id}
                onClick={(e) => handleNavigation(item, e)}
                disabled={isNavigating}
                className={cn(
                  "relative flex flex-col items-center justify-center transition-all duration-200",
                  getTouchTargetSize(),
                  "flex-1 text-[11px] font-semibold gap-1",
                  // 건설 현장 최적화
                  "active:scale-95 touch-manipulation select-none",
                  "focus-visible:outline-3 focus-visible:outline-orange-500 focus-visible:outline-offset-2",
                  // 우선순위별 색상
                  isActive
                    ? item.priority === 'high' 
                      ? "text-red-600 dark:text-red-400" 
                      : "text-orange-600 dark:text-orange-400"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200",
                  // 네비게이션 중 비활성화
                  isNavigating && "opacity-50 pointer-events-none"
                )}
                aria-label={`${item.label}으로 이동`}
                aria-current={isActive ? "page" : undefined}
                aria-disabled={isNavigating}
              >
                <div className="relative">
                  {React.isValidElement(item.icon) 
                    ? React.cloneElement(item.icon as React.ReactElement, {
                        className: cn(
                          "h-7 w-7", // 건설 현장용 더 큰 아이콘
                          touchMode === 'glove' && "h-8 w-8"
                        ),
                        "aria-hidden": "true",
                        strokeWidth: isActive ? 2.8 : 1.8 // 더 두꺼운 선
                      })
                    : <div className={cn(
                        "h-7 w-7",
                        touchMode === 'glove' && "h-8 w-8"
                      )} aria-hidden="true">{item.icon}</div>
                  }
                  
                  {/* 배지 표시 */}
                  {item.badge && (
                    <div className={cn(
                      "absolute -right-1 -top-1 flex items-center justify-center rounded-full text-[8px] font-bold text-white min-w-[14px] h-[14px]",
                      item.priority === 'high' ? "bg-red-500" : "bg-orange-500"
                    )}>
                      {typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
                    </div>
                  )}
                </div>
                
                <span className="truncate max-w-[52px] leading-tight font-medium">
                  {item.label}
                </span>
                
                {/* 활성 상태 인디케이터 - 건설 테마 */}
                {isActive && (
                  <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-5 h-0.5 bg-orange-600 dark:bg-orange-400 rounded-full opacity-90" />
                )}
              </button>
            )
          })}
          
        </div>
        
        {/* iOS Safe Area */}
        <div className="h-safe-area-inset-bottom bg-white dark:bg-gray-900" />
      </nav>
    )
  }
)

ConstructionNavBar.displayName = "ConstructionNavBar"


export { ConstructionNavBar }