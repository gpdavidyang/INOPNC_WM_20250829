'use client'

import * as React from 'react'
import { Profile, UserRole } from '@/types'
import { 
  Home, FileText, FolderOpen, X, LogOut,
  Building2, Printer, User
} from 'lucide-react'
import { signOut } from '@/app/auth/actions'
import { useRouter, usePathname } from 'next/navigation'
import { useRovingTabIndex } from '@/hooks/use-keyboard-navigation'

interface PartnerSidebarProps {
  profile: Profile
  activeTab: string
  onTabChange: (tab: string) => void
  isOpen: boolean
  onClose: () => void
}

interface MenuItem {
  id: string
  label: string
  icon: any
  badge?: string
}

const menuItems: MenuItem[] = [
  { id: 'home', label: '홈', icon: Home },
  { id: 'print-status', label: '출력현황', icon: Printer },
  { id: 'work-logs', label: '작업일지', icon: FileText },
  { id: 'site-info', label: '현장정보', icon: Building2 },
  { id: 'documents', label: '문서함', icon: FolderOpen },
  { id: 'my-info', label: '내정보', icon: User },
]

export default function PartnerSidebar({
  profile,
  activeTab,
  onTabChange,
  isOpen,
  onClose
}: PartnerSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  
  const handleSignOut = async () => {
    try {
      const result = await signOut()
      if (result.success) {
        window.location.href = '/auth/login'
      } else if (result.error) {
        console.error('Logout error:', result.error)
      }
    } catch (error) {
      console.error('Logout error:', error)
      window.location.href = '/auth/login'
    }
  }
  
  return (
    <>
      {/* Mobile overlay - simplified to match working sidebar */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => {
            console.log('[PartnerSidebar] Overlay clicked')
            onClose()
          }}
        />
      )}

      {/* Mobile sidebar - aligned with working sidebar z-index */}
      <nav 
        className={`fixed inset-y-0 left-0 z-50 w-72 sm:w-64 bg-white dark:bg-gray-800 shadow-xl border-r border-gray-200 dark:border-gray-700 theme-transition transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)'
        }}
        aria-label="사이드바 네비게이션"
        {...(!isOpen && { inert: "true" })}
      >
        <div className="flex h-full flex-col relative">
          <header className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-700 bg-premium-light dark:bg-premium-dark">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center elevation-sm" role="img" aria-label="INOPNC 로고">
                <span className="text-white font-bold" aria-hidden="true">IN</span>
              </div>
              <h1 className="ml-3 text-lg font-semibold text-gray-900 dark:text-gray-100">INOPNC</h1>
            </div>
            <button 
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('[PartnerSidebar] X button clicked, calling onClose')
                // Simply call the onClose function - let React handle the state
                if (typeof onClose === 'function') {
                  onClose()
                }
              }} 
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 theme-transition focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              aria-label="사이드바 닫기"
              type="button"
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </header>
          <SidebarContent
            profile={profile}
            activeTab={activeTab}
            onTabChange={onTabChange}
            onClose={onClose}
            menuItems={menuItems}
            handleLogout={handleSignOut}
          />
        </div>
      </nav>

      {/* Desktop sidebar */}
      <nav 
        className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-64 lg:bg-white lg:dark:bg-gray-800 lg:elevation-lg theme-transition"
        aria-label="데스크톱 사이드바 네비게이션"
      >
        <div className="flex h-full flex-col">
          <header className="flex items-center px-4 py-4 border-b border-gray-200 dark:border-gray-700 bg-premium-light dark:bg-premium-dark">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center elevation-sm" role="img" aria-label="INOPNC 로고">
              <span className="text-white font-bold" aria-hidden="true">IN</span>
            </div>
            <h1 className="ml-3 text-lg font-semibold text-gray-900 dark:text-gray-100">INOPNC</h1>
          </header>
          <SidebarContent
            profile={profile}
            activeTab={activeTab}
            onTabChange={onTabChange}
            onClose={onClose}
            menuItems={menuItems}
            handleLogout={handleSignOut}
          />
        </div>
      </nav>
    </>
  )
}

function SidebarContent({ 
  profile, 
  activeTab, 
  onTabChange, 
  onClose,
  menuItems,
  handleLogout 
}: any) {
  const totalItems = menuItems.length + 1 // +1 for logout
  const { focusedIndex, getRovingProps } = useRovingTabIndex(totalItems)

  const handleMenuClick = React.useCallback((item: MenuItem) => {
    onTabChange(item.id)
    // 모바일에서만 사이드바 닫기
    // But NOT if force-desktop-ui is active
    const isForceDesktop = document.body.classList.contains('force-desktop-ui')
    if (!isForceDesktop && window.innerWidth < 1024) {
      onClose()
    }
  }, [onTabChange, onClose])

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <div className="flex-1 px-3 py-4 pb-20 md:pb-4">
        {/* User info - same style as manager */}
        <section className="mb-6 px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg mx-3 elevation-sm theme-transition" aria-labelledby="user-info-heading">
          <h2 id="user-info-heading" className="sr-only">사용자 정보</h2>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" aria-label={`사용자명: ${profile.full_name}`}>
            {profile.full_name || '파트너사'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate" aria-label={`이메일: ${profile.email}`}>
            {profile.email}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1" aria-label="역할: 파트너사">
            파트너사 관리자
          </p>
        </section>

        {/* Main menu - same style as manager */}
        <nav className="space-y-1" aria-label="주요 메뉴" role="navigation">
          <ul role="list">
            {menuItems.map((item, index) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              
              return (
                <li key={item.id} role="none">
                  <button
                    onClick={() => {
                      handleMenuClick(item)
                    }}
                    {...getRovingProps(index)}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md theme-transition touch-manipulation min-h-[48px] focus-visible:ring-2 focus-visible:ring-toss-blue-500 focus-visible:ring-offset-2 ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 elevation-sm'
                        : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    aria-current={isActive ? 'page' : false}
                    aria-label={`${item.label} 메뉴로 이동`}
                    role="menuitem"
                  >
                    <Icon className="mr-3 h-5 w-5" aria-hidden="true" />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>

      {/* Logout section - exactly same as manager */}
      <footer className="p-4 pb-20 md:pb-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <button
          onClick={handleLogout}
          {...getRovingProps(menuItems.length)}
          className="w-full flex items-center justify-center px-4 py-3 min-h-[48px] border border-gray-300 dark:border-gray-600 rounded-md elevation-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 touch-manipulation theme-transition focus-visible:ring-2 focus-visible:ring-toss-blue-500 focus-visible:ring-offset-2"
          aria-label="시스템에서 로그아웃"
          aria-describedby="logout-description"
        >
          <span>로그아웃</span>
          <span id="logout-description" className="sr-only">현재 세션을 종료하고 로그인 페이지로 이동합니다</span>
        </button>
      </footer>
    </div>
  )
}