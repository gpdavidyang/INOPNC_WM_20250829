'use client'

import * as React from 'react'
import { Profile, UserRole } from '@/types'
import { 
  Home, FileText, Calendar, FolderOpen, MapPin, Share2, User, Users, 
  BarChart3, Settings, X, Bell, Building2, FolderCheck, DollarSign, 
  Package, Layers, MoreHorizontal, Activity 
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { useOptionalNavigation } from '@/components/navigation/navigation-controller'
import { signOut } from '@/app/auth/actions'
import { useRovingTabIndex } from '@/hooks/use-keyboard-navigation'

interface SidebarProps {
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
  roles: UserRole[]
  href?: string // Optional href for navigation
  isAdminPage?: boolean // Flag to indicate admin pages
}

// UI_Guidelines.md 사양에 맞는 일반 사용자 메뉴 (A.작업자, B.현장관리자, C.파트너사)
const generalUserMenuItems: MenuItem[] = [
  {
    id: 'home',
    label: '홈',
    icon: Home,
    roles: ['worker', 'site_manager', 'customer_manager'],
    href: '/dashboard'
  },
  {
    id: 'attendance',
    label: '출력현황',
    icon: Calendar,
    roles: ['worker', 'site_manager', 'customer_manager'],
    href: '/dashboard/attendance'
  },
  {
    id: 'salary',
    label: '급여정보',
    icon: DollarSign,
    roles: ['worker', 'site_manager'],
    href: '/dashboard/salary'
  },
  {
    id: 'daily-reports',
    label: '작업일지',
    icon: FileText,
    roles: ['worker', 'site_manager', 'customer_manager'],
    href: '/dashboard/daily-reports'
  },
  {
    id: 'site-info',
    label: '현장정보',
    icon: MapPin,
    roles: ['worker', 'site_manager', 'customer_manager'],
    href: '/dashboard/site-info'
  },
  {
    id: 'documents',
    label: '문서함',
    icon: FolderOpen,
    roles: ['worker', 'site_manager', 'customer_manager'],
    href: '/dashboard/documents'
  },
  {
    id: 'profile',
    label: '내정보',
    icon: User,
    roles: ['worker', 'site_manager', 'customer_manager'],
    href: '/dashboard/profile'
  }
]

// UI_Guidelines.md 사양에 맞는 본사 관리자 전용 메뉴 (D.본사 관리자)
const adminMenuItems: MenuItem[] = [
  {
    id: 'home',
    label: '홈',
    icon: Home,
    roles: ['admin', 'system_admin'],
    href: '/dashboard/admin',
    isAdminPage: true
  },
  {
    id: 'site-management',
    label: '현장 관리',
    icon: Building2,
    roles: ['admin', 'system_admin'],
    href: '/dashboard/admin/sites',
    isAdminPage: true
  },
  {
    id: 'user-management',
    label: '사용자 관리',
    icon: Users,
    roles: ['admin', 'system_admin'],
    href: '/dashboard/admin/users',
    isAdminPage: true
  },
  {
    id: 'shared-documents-management',
    label: '공유 문서함 관리',
    icon: FolderCheck,
    roles: ['admin', 'system_admin'],
    href: '/dashboard/admin/shared-documents',
    isAdminPage: true
  },
  {
    id: 'payroll-management',
    label: '급여 관리',
    icon: DollarSign,
    roles: ['admin', 'system_admin'],
    href: '/dashboard/admin/salary',
    isAdminPage: true
  },
  {
    id: 'npc1000-management',
    label: 'NPC-1000 자재 관리',
    icon: Package,
    roles: ['admin', 'system_admin'],
    href: '/dashboard/admin/materials',
    isAdminPage: true
  },
  {
    id: 'blueprint-markup-management',
    label: '도면 마킹 관리',
    icon: Layers,
    roles: ['admin', 'system_admin'],
    href: '/dashboard/admin/markup',
    isAdminPage: true
  },
  {
    id: 'analytics',
    label: '분석 및 리포트',
    icon: BarChart3,
    roles: ['admin', 'system_admin'],
    href: '/dashboard/analytics',
    isAdminPage: true
  },
  {
    id: 'performance-monitoring',
    label: '성능 모니터링',
    icon: Activity,
    roles: ['admin', 'system_admin'],
    href: '/dashboard/performance',
    isAdminPage: true
  },
  {
    id: 'profile',
    label: '내정보',
    icon: User,
    roles: ['admin', 'system_admin'],
    href: '/dashboard/profile'
  }
]

// 시스템 관리자 추가 메뉴
const systemAdminMenuItems: MenuItem[] = [
  {
    id: 'system-management',
    label: '시스템 관리',
    icon: Settings,
    roles: ['system_admin'],
    href: '/dashboard/admin/system',
    isAdminPage: true
  }
]

export default function Sidebar({ profile, activeTab, onTabChange, isOpen, onClose }: SidebarProps) {
  const router = useRouter()
  const supabase = createClient()

  // Debug logging
  React.useEffect(() => {
    // console.log('[Sidebar] Component mounted/updated, isOpen:', isOpen)
  }, [isOpen])

  const handleLogout = async () => {
    try {
      const result = await signOut()
      if (result.success) {
        // Use window.location for full page refresh to clear all auth state
        window.location.href = '/auth/login'
      } else if (result.error) {
        console.error('Logout error:', result.error)
      }
    } catch (error) {
      console.error('Logout error:', error)
      // Fallback to direct signout
      await supabase.auth.signOut()
      window.location.href = '/auth/login'
    }
  }

  // Handle null profile case
  if (!profile) {
    return null
  }

  // 사용자 역할에 따른 메뉴 구성
  const getMenuItemsForRole = () => {
    if (profile?.role === 'admin' || profile?.role === 'system_admin') {
      // 본사 관리자는 관리자 전용 메뉴를 사용 (admin = 본사관리자/시스템관리자)
      return {
        mainMenuItems: adminMenuItems.filter(item => 
          item.roles.includes(profile.role as UserRole)
        ),
        // admin도 시스템 관리 메뉴 접근 가능 (admin과 system_admin 통합)
        systemMenuItems: systemAdminMenuItems
      }
    } else {
      // 일반 사용자 (작업자, 현장관리자, 고객사)는 일반 메뉴를 사용
      return {
        mainMenuItems: generalUserMenuItems.filter(item => 
          profile?.role && item.roles.includes(profile.role as UserRole)
        ),
        systemMenuItems: []
      }
    }
  }

  const { mainMenuItems, systemMenuItems } = getMenuItemsForRole()
  

  return (
    <>
      {/* Mobile sidebar */}
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
                // console.log('[Sidebar] X button clicked, calling onClose')
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
            mainMenuItems={mainMenuItems}
            systemMenuItems={systemMenuItems}
            handleLogout={handleLogout}
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
            mainMenuItems={mainMenuItems}
            systemMenuItems={systemMenuItems}
            handleLogout={handleLogout}
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
  mainMenuItems, 
  systemMenuItems,
  handleLogout 
}: any) {
  const router = useRouter()
  const pathname = usePathname()
  
  // Safe navigation hook usage with error handling
  let navigation = null
  let navigate = null
  let isNavigating = false
  
  try {
    navigation = useOptionalNavigation()
    navigate = navigation?.navigate
    isNavigating = navigation?.isNavigating || false
  } catch (error) {
    console.warn('[Sidebar] NavigationController not available, using fallback navigation:', error)
    // Keep navigate as null, will use router.push fallback
  }
  
  // Determine active tab based on current pathname
  const getActiveTabFromPath = () => {
    // Check for hash-based navigation first
    if (window.location.hash === '#documents-unified') return 'documents'
    if (pathname === '/dashboard' || pathname === '/dashboard/') {
      // For dashboard root, check hash for active tab
      return activeTab || 'home'
    }
    if (pathname.includes('/dashboard/attendance')) return 'attendance'
    if (pathname.includes('/dashboard/salary')) return 'salary'
    if (pathname.includes('/dashboard/daily-reports')) return 'daily-reports'
    if (pathname.includes('/dashboard/site-info')) return 'site-info'
    if (pathname.includes('/dashboard/documents')) return 'documents'
    if (pathname.includes('/dashboard/profile')) return 'profile'
    if (pathname.includes('/dashboard/admin')) {
      // Check for specific admin pages
      if (pathname.includes('/dashboard/admin/sites')) return 'site-management'
      if (pathname.includes('/dashboard/admin/users')) return 'user-management'
      if (pathname.includes('/dashboard/admin/shared-documents')) return 'shared-documents-management'
      if (pathname.includes('/dashboard/admin/salary')) return 'payroll-management'
      if (pathname.includes('/dashboard/admin/materials')) return 'npc1000-management'
      if (pathname.includes('/dashboard/admin/markup')) return 'blueprint-markup-management'
      if (pathname.includes('/dashboard/admin/system')) return 'system-management'
      return 'home' // Default admin home
    }
    if (pathname.includes('/dashboard/analytics')) return 'analytics'
    if (pathname.includes('/dashboard/performance')) return 'performance-monitoring'
    return activeTab
  }
  
  const currentActiveTab = getActiveTabFromPath()
  
  // Total number of menu items for roving tabindex
  const totalItems = mainMenuItems.length + systemMenuItems.length + 1 // +1 for logout
  const { focusedIndex, getRovingProps } = useRovingTabIndex(totalItems)

  // 메뉴 클릭 시 탭 변경과 모바일에서 사이드바 닫기를 동시에 처리
  const handleMenuClick = React.useCallback((item: MenuItem) => {
    // console.log('[Sidebar] handleMenuClick called with:', {
    //   id: item.id,
    //   href: item.href,
    //   isNavigating,
    //   pathname,
    //   isMobile: window.innerWidth < 1024,
    //   onCloseType: typeof onClose,
    //   onCloseExists: !!onClose
    // })
    
    // 모바일에서는 무조건 사이드바 닫기 (React state를 통해)
    // But NOT if force-desktop-ui is active
    const isForceDesktop = document.body.classList.contains('force-desktop-ui')
    if (!isForceDesktop && window.innerWidth < 1024 && typeof onClose === 'function') {
      // console.log('[Sidebar] Mobile detected, closing sidebar via React state')
      onClose()
    }
    
    // 이미 네비게이션 중이면 무시
    if (isNavigating) {
      // console.log('[Sidebar] Navigation in progress, skipping')
      return
    }
    
    // Admin pages or items with href should navigate to separate routes
    if (item.href) {
      // Special handling for documents tab - ensure proper navigation
      if (item.id === 'documents' || item.href.includes('#documents-unified')) {
        // console.log('[Sidebar] Navigating to documents tab')
        // Navigate directly to dashboard with hash to avoid redirect loops
        const targetUrl = '/dashboard#documents-unified'
        
        if (navigate) {
          navigate(targetUrl)
        } else {
          router.push(targetUrl)
        }
        // REMOVED: onTabChange call - let the dashboard-layout handle state from pathname
        return
      }
      
      // Check if current path matches (accounting for hash)
      const currentFullPath = pathname + (window.location.hash || '')
      if (currentFullPath === item.href) {
        // console.log('[Sidebar] Same path, navigation skipped')
        return
      }
      
      // Clear any existing hash when navigating away from hash-based routes
      if (window.location.hash && !item.href.includes('#')) {
        // console.log('[Sidebar] Clearing hash for clean navigation')
        window.location.hash = ''
      }
      
      // console.log('[Sidebar] Navigating to:', item.href)
      
      // Use navigation controller if available, otherwise fallback to router
      if (navigate) {
        navigate(item.href)
      } else {
        // Fallback to router.push when NavigationController is not available
        // console.log('[Sidebar] NavigationController not available, using router.push')
        router.push(item.href)
      }
    } else {
      // console.log('[Sidebar] Tab-based navigation to:', item.id)
      // For tab-based items, only call onTabChange
      onTabChange(item.id)
    }
  }, [navigate, router, pathname, isNavigating, onTabChange, onClose])

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <div className="flex-1 px-3 py-4 pb-20 md:pb-4">
        {/* User info */}
        <section className="mb-6 px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg mx-3 elevation-sm theme-transition" aria-labelledby="user-info-heading">
          <h2 id="user-info-heading" className="sr-only">사용자 정보</h2>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" aria-label={`사용자명: ${profile.full_name}`}>
            {profile.full_name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate" aria-label={`이메일: ${profile.email}`}>
            {profile.email}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1" aria-label={`역할: ${
            profile?.role === 'worker' ? '작업자' :
            profile?.role === 'site_manager' ? '현장관리자' :
            profile?.role === 'customer_manager' ? '파트너사' :
            profile?.role === 'admin' ? '관리자' :
            profile?.role === 'system_admin' ? '시스템관리자' : profile?.role || '알 수 없음'
          }`}>
            {profile?.role === 'worker' && '작업자'}
            {profile?.role === 'site_manager' && '현장관리자'}
            {profile?.role === 'customer_manager' && '파트너사'}
            {profile?.role === 'admin' && '관리자'}
            {profile?.role === 'system_admin' && '시스템관리자'}
          </p>
        </section>

        {/* Main menu - 사용자 역할에 따라 다른 메뉴 표시 */}
        <nav className="space-y-1" aria-label="주요 메뉴" role="navigation">
          <ul role="list">
            {(mainMenuItems || []).map((item: MenuItem, index: number) => {
              const Icon = item.icon
              return (
                <li key={item.id} role="none">
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      
                      // console.log('[Sidebar] Menu item clicked:', item.id, 'href:', item.href)
                      
                      // 통합된 처리
                      handleMenuClick(item)
                    }}
                    {...getRovingProps(index)}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md theme-transition touch-manipulation min-h-[48px] focus-visible:ring-2 focus-visible:ring-toss-blue-500 focus-visible:ring-offset-2 ${
                      currentActiveTab === item.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 elevation-sm'
                        : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    aria-current={currentActiveTab === item.id ? 'page' : false}
                    aria-label={`${item.label} 메뉴로 이동`}
                    role="menuitem"
                  >
                    <Icon className="mr-3 h-5 w-5" aria-hidden="true" />
                    <span>{item.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* System Admin 추가 메뉴 - 시스템 관리자만 표시 */}
        {systemMenuItems.length > 0 && (
          <section aria-labelledby="system-menu-heading">
            <hr className="my-4 border-t border-gray-200 dark:border-gray-700" aria-hidden="true" />
            <h3 id="system-menu-heading" className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              시스템 관리
            </h3>
            <nav className="space-y-1" aria-label="시스템 관리 메뉴" role="navigation">
              <ul role="list">
                {(systemMenuItems || []).map((item: MenuItem, index: number) => {
                  const Icon = item.icon
                  const itemIndex = mainMenuItems.length + index
                  return (
                    <li key={item.id} role="none">
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          // console.log('[Sidebar] System menu item clicked:', item.id)
                          handleMenuClick(item)
                        }}
                        {...getRovingProps(itemIndex)}
                        className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md theme-transition touch-manipulation min-h-[48px] focus-visible:ring-2 focus-visible:ring-toss-blue-500 focus-visible:ring-offset-2 ${
                          currentActiveTab === item.id
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 elevation-sm'
                            : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                        aria-current={currentActiveTab === item.id ? 'page' : false}
                        aria-label={`${item.label} 메뉴로 이동`}
                        role="menuitem"
                      >
                        <Icon className="mr-3 h-5 w-5" aria-hidden="true" />
                        <span>{item.label}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </section>
        )}
      </div>

      {/* Logout section */}
      <footer className="p-4 pb-20 md:pb-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            // console.log('[Sidebar] Logout clicked')
            // 모바일에서는 먼저 사이드바 닫기 (React state를 통해)
            // But NOT if force-desktop-ui is active
            const isForceDesktop = document.body.classList.contains('force-desktop-ui')
            if (!isForceDesktop && window.innerWidth < 1024 && typeof onClose === 'function') {
              onClose()
            }
            handleLogout()
          }}
          {...getRovingProps(totalItems - 1)}
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