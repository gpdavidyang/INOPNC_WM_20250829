'use client'

import * as React from 'react'
import { Home, MapPin, FileText, FolderOpen, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePathname, useRouter } from 'next/navigation'

interface PartnerBottomNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
  badge?: string | number
}

const navItems: NavItem[] = [
  { id: 'home', label: '빠른메뉴', icon: <Home className="stroke-current fill-none" /> },
  { id: 'print-status', label: '출력현황', icon: <Calendar className="stroke-current fill-none" /> },
  { id: 'work-logs', label: '작업일지', icon: <FileText className="stroke-current fill-none" /> },
  { id: 'site-info', label: '현장정보', icon: <MapPin className="stroke-current fill-none" /> },
  { id: 'documents', label: '문서함', icon: <FolderOpen className="stroke-current fill-none" /> },
]

export default function PartnerBottomNavigation({
  activeTab,
  onTabChange
}: PartnerBottomNavigationProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleNavigation = React.useCallback((item: NavItem, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Tab change for partner dashboard
    onTabChange(item.id)
  }, [onTabChange])

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 border-t bg-white dark:bg-gray-900 md:hidden",
        // Enhanced for construction site usage (same as manager)
        "h-[64px] supports-[height:env(safe-area-inset-bottom)]:h-[68px]",
        "border-gray-200 dark:border-gray-700",
        "shadow-xl backdrop-blur-sm bg-white/95 dark:bg-gray-900/95"
      )}
      role="navigation"
      aria-label="하단 메인 네비게이션"
    >
      <div className="flex h-full items-center justify-around px-1">
        {navItems.map((item, index) => {
          const isActive = activeTab === item.id
          
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
                {React.cloneElement(item.icon as React.ReactElement, {
                  className: "h-6 w-6", // Larger icons for better visibility (24x24px)
                  "aria-hidden": "true",
                  strokeWidth: isActive ? 2.5 : 1.5, // Enhanced stroke for outdoor visibility
                  stroke: "currentColor", // Ensure icons use current text color
                  fill: "none" // Ensure no fill color override
                })}
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
      
      {/* iOS Safe Area - 불투명 배경 */}
      <div className="h-safe-area-inset-bottom bg-white dark:bg-gray-900" />
    </nav>
  )
}