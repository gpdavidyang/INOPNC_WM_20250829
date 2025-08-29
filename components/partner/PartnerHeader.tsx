'use client'

import Link from 'next/link'
import { Menu } from 'lucide-react'
import { NotificationDropdown } from '@/components/notifications/notification-dropdown'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { FontSizeToggle } from '@/components/ui/font-size-toggle'
import { Profile } from '@/types'

interface PartnerHeaderProps {
  profile: Profile
  onMenuClick: () => void
  isSidebarOpen?: boolean
}

export default function PartnerHeader({ profile, onMenuClick, isSidebarOpen = false }: PartnerHeaderProps) {
  const handleMenuClick = () => {
    if (onMenuClick) {
      onMenuClick()
    }
  }
  
  return (
    <header className="sticky top-0 z-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 theme-transition" role="banner">
      <div className="px-3 sm:px-4 lg:px-6">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-x-3">
            <button
              type="button"
              className="lg:hidden -m-2 inline-flex items-center justify-center rounded-lg p-2 text-toss-gray-600 dark:text-toss-gray-400 hover:text-toss-gray-800 dark:hover:text-toss-gray-200 hover:bg-toss-gray-100 dark:hover:bg-toss-gray-700 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-toss-blue-500 theme-transition touch-manipulation min-h-[44px] min-w-[44px]"
              onClick={handleMenuClick}
              aria-label="사이드바 메뉴 열기"
              aria-controls="main-navigation"
              aria-expanded={isSidebarOpen}
            >
              <Menu 
                className={`h-5 w-5 transition-transform duration-200 ${
                  isSidebarOpen ? 'rotate-180' : ''
                }`} 
                strokeWidth={1.5}
                aria-hidden="true" 
              />
            </button>

            <div className="flex items-center">
              <Link href="/partner/dashboard" className="group">
                <h1 className="text-base font-bold text-toss-gray-900 dark:text-toss-gray-100 group-hover:text-toss-blue-600 dark:group-hover:text-toss-blue-400 transition-colors duration-200 cursor-pointer">
                  INOPNC
                </h1>
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-x-2" role="group" aria-label="사용자 메뉴">
            {/* Font Size Toggle */}
            <div role="region" aria-label="글꼴 크기">
              <FontSizeToggle />
            </div>

            {/* Dark Mode Toggle */}
            <div role="region" aria-label="다크 모드">
              <ThemeToggle />
            </div>

            {/* Notifications */}
            <div role="region" aria-label="알림">
              <NotificationDropdown />
            </div>

          </div>
        </div>
      </div>
    </header>
  )
}