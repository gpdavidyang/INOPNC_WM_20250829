'use client'

import { Profile } from '@/types'
import { 
  Shield, Menu, X, Home, Users, Building2, FolderCheck, 
  DollarSign, Package, Layers, Settings, LogOut, BarChart3, Bell,
  ChevronDown, User, Key, UserPlus, FileText, MessageSquare
} from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { signOut } from '@/app/auth/actions'
import Link from 'next/link'
import { useFontSize, getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'
import GlobalSearch from '@/components/admin/GlobalSearch'

interface AdminDashboardLayoutProps {
  profile: Profile
  children: React.ReactNode
}

// 카테고리별로 그룹핑된 메뉴 구조
const menuCategories = [
  {
    id: 'main',
    label: null, // 첫 번째 카테고리는 라벨 없음
    items: [
      {
        id: 'home',
        label: '홈',
        icon: Home,
        href: '/dashboard/admin'
      }
    ]
  },
  {
    id: 'analytics',
    label: '업무 관리',
    items: [
      {
        id: 'analytics',
        label: '분석 대시보드',
        icon: BarChart3,
        href: '/dashboard/admin/analytics'
      },
      {
        id: 'sites',
        label: '현장 관리',
        icon: Building2,
        href: '/dashboard/admin/sites'
      },
      {
        id: 'daily-reports',
        label: '작업일지 관리',
        icon: FileText,
        href: '/dashboard/admin/daily-reports'
      },
      {
        id: 'notifications',
        label: '통합 알림 센터',
        icon: Bell,
        href: '/dashboard/admin/notifications'
      }
    ]
  },
  {
    id: 'hr',
    label: '인사 관리',
    items: [
      {
        id: 'users',
        label: '사용자 관리',
        icon: Users,
        href: '/dashboard/admin/users'
      },
      {
        id: 'approvals',
        label: '가입 요청 관리',
        icon: UserPlus,
        href: '/dashboard/admin/approvals'
      },
      {
        id: 'organizations',
        label: '소속(거래처) 관리',
        icon: Building2,
        href: '/dashboard/admin/organizations'
      },
      {
        id: 'partners',
        label: '파트너사 관리',
        icon: Layers,
        href: '/dashboard/admin/partners'
      },
      {
        id: 'salary',
        label: '급여 관리',
        icon: DollarSign,
        href: '/dashboard/admin/salary'
      }
    ]
  },
  {
    id: 'documents',
    label: '문서 관리',
    items: [
      {
        id: 'documents',
        label: '문서함 관리',
        icon: FolderCheck,
        href: '/dashboard/admin/documents'
      },
      {
        id: 'communication',
        label: '커뮤니케이션 관리',
        icon: MessageSquare,
        href: '/dashboard/admin/communication'
      }
    ]
  },
  {
    id: 'materials',
    label: '자재/재고',
    items: [
      {
        id: 'materials',
        label: 'NPC-1000 자재 관리',
        icon: Package,
        href: '/dashboard/admin/materials'
      }
    ]
  }
]

// 시스템 관리 카테고리 (admin과 system_admin만 접근 가능)
const systemCategory = {
  id: 'system',
  label: '시스템',
  items: [
    {
      id: 'audit-logs',
      label: '감사 로그',
      icon: FileText,
      href: '/dashboard/admin/audit-logs'
    },
    {
      id: 'system',
      label: '시스템 관리',
      icon: Settings,
      href: '/dashboard/admin/system'
    }
  ]
}

export default function AdminDashboardLayout({ profile, children }: AdminDashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()

  // Initialize theme - Always use light mode for admin
  useEffect(() => {
    // Force light mode for admin/system_admin
    setIsDarkMode(false)
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }, [])

  // Toggle theme function - Disabled for admin
  // Admin users always use light mode
  const toggleTheme = () => {
    // Do nothing - theme toggle is disabled for admin users
    return
  }

  // Handle click outside for user menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
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

  // admin과 system_admin 모두 시스템 관리 메뉴 접근 가능
  const allCategories = (profile?.role === 'admin' || profile?.role === 'system_admin')
    ? [...menuCategories, systemCategory]
    : menuCategories

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-200 ease-in-out lg:hidden ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex h-full flex-col">
          <div className={`flex items-center justify-between ${
            touchMode === 'glove' ? 'px-5 py-5' : touchMode === 'precision' ? 'px-3 py-3' : 'px-4 py-4'
          } border-b border-gray-200 dark:border-gray-700`}>
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-red-600 mr-3" />
              <span className={`${getFullTypographyClass('heading', 'lg', isLargeFont)} font-semibold text-gray-900 dark:text-gray-100`}>시스템 관리자</span>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)} 
              className={`text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 ${
                touchMode === 'glove' ? 'p-3' : touchMode === 'precision' ? 'p-1.5' : 'p-2'
              } rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <SidebarContent 
            profile={profile}
            menuCategories={allCategories}
            pathname={pathname}
            handleLogout={handleLogout}
            onItemClick={() => setIsSidebarOpen(false)}
            isLargeFont={isLargeFont}
            touchMode={touchMode}
          />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-72 lg:bg-white lg:dark:bg-gray-800 lg:shadow-lg">
        <div className="flex h-full flex-col">
          <div className={`flex items-center ${
            touchMode === 'glove' ? 'px-5 py-5' : touchMode === 'precision' ? 'px-3 py-3' : 'px-4 py-4'
          } border-b border-gray-200 dark:border-gray-700`}>
            <Shield className="h-8 w-8 text-red-600 mr-3" />
            <span className={`${getFullTypographyClass('heading', 'lg', isLargeFont)} font-semibold text-gray-900 dark:text-gray-100`}>시스템 관리자</span>
          </div>
          <SidebarContent 
            profile={profile}
            menuCategories={allCategories}
            pathname={pathname}
            handleLogout={handleLogout}
            onItemClick={() => {}}
            isLargeFont={isLargeFont}
            touchMode={touchMode}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top header */}
        <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className={`${
            touchMode === 'glove' ? 'px-5 sm:px-7 lg:px-9' : touchMode === 'precision' ? 'px-3 sm:px-5 lg:px-7' : 'px-4 sm:px-6 lg:px-8'
          }`}>
            <div className={`flex items-center justify-between ${
              touchMode === 'glove' ? 'h-20' : touchMode === 'precision' ? 'h-14' : 'h-16'
            }`}>
              <button
                onClick={() => setIsSidebarOpen(true)}
                className={`text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 lg:hidden ${
                  touchMode === 'glove' ? 'p-3' : touchMode === 'precision' ? 'p-1.5' : 'p-2'
                }`}
              >
                <Menu className="h-6 w-6" />
              </button>
              
              <div className="flex-1" />
              
              <div className="flex items-center gap-4">
                <GlobalSearch />
                
                {/* Theme Toggle Button - Hidden for admin users */}
                {/* Dark mode is disabled for admin/system_admin roles */}
                
                {/* User Menu Dropdown */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className={`flex items-center gap-2 ${
                      touchMode === 'glove' ? 'px-4 py-2' : touchMode === 'precision' ? 'px-2.5 py-1' : 'px-3 py-1.5'
                    } rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                  >
                    <div className="text-right">
                      <div className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-700 dark:text-gray-300`}>
                        {profile?.full_name}
                      </div>
                      <div className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500 dark:text-gray-400`}>
                        {profile?.role === 'system_admin' ? '시스템 관리자' : '관리자'}
                      </div>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                      <Link
                        href="/dashboard/admin/account"
                        onClick={() => setShowUserMenu(false)}
                        className={`flex items-center gap-3 ${
                          touchMode === 'glove' ? 'px-5 py-3' : touchMode === 'precision' ? 'px-3 py-2' : 'px-4 py-2.5'
                        } hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
                      >
                        <User className="h-4 w-4 text-gray-500" />
                        <span className={getFullTypographyClass('body', 'sm', isLargeFont)}>계정 설정</span>
                      </Link>
                      
                      <Link
                        href="/dashboard/admin/account"
                        onClick={() => setShowUserMenu(false)}
                        className={`flex items-center gap-3 ${
                          touchMode === 'glove' ? 'px-5 py-3' : touchMode === 'precision' ? 'px-3 py-2' : 'px-4 py-2.5'
                        } hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
                      >
                        <Key className="h-4 w-4 text-gray-500" />
                        <span className={getFullTypographyClass('body', 'sm', isLargeFont)}>비밀번호 변경</span>
                      </Link>
                      
                      <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                      
                      <button
                        onClick={() => {
                          setShowUserMenu(false)
                          handleLogout()
                        }}
                        className={`flex items-center gap-3 w-full ${
                          touchMode === 'glove' ? 'px-5 py-3' : touchMode === 'precision' ? 'px-3 py-2' : 'px-4 py-2.5'
                        } hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-red-600 dark:text-red-400`}
                      >
                        <LogOut className="h-4 w-4" />
                        <span className={getFullTypographyClass('body', 'sm', isLargeFont)}>로그아웃</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main>
          {children}
        </main>
      </div>
    </div>
  )
}

function SidebarContent({ 
  profile, 
  menuCategories, 
  pathname,
  handleLogout,
  onItemClick,
  isLargeFont,
  touchMode
}: any) {
  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <div className="flex-1 px-3 py-4">
        {/* User info */}
        <div className={`mb-4 ${
          touchMode === 'glove' ? 'px-5 py-4' : touchMode === 'precision' ? 'px-3 py-2' : 'px-4 py-3'
        } bg-gray-50 rounded-lg mx-3`}>
          <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium text-gray-900 dark:text-gray-100 truncate`}>{profile?.full_name}</p>
          <p className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500 dark:text-gray-400 truncate`}>{profile?.email}</p>
          <p className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500 dark:text-gray-400 mt-1`}>
            {profile?.role === 'admin' ? '관리자' : '시스템 관리자'}
          </p>
        </div>

        {/* Navigation with categories */}
        <nav className="space-y-3">
          {menuCategories.map((category: any, categoryIndex: number) => (
            <div key={category.id}>
              {/* Category label */}
              {category.label && (
                <h3 className={`mx-3 mb-2 ${getFullTypographyClass('caption', 'xs', isLargeFont)} font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider`}>
                  {category.label}
                </h3>
              )}
              
              {/* Category items */}
              <div className="space-y-1">
                {category.items.map((item: any) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={onItemClick}
                      className={`flex items-center ${
                        touchMode === 'glove' ? 'px-5 py-3' : touchMode === 'precision' ? 'px-3 py-1.5' : 'px-4 py-2'
                      } ${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                          : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
              
              {/* Divider between categories (except for the last one) */}
              {categoryIndex < menuCategories.length - 1 && (
                <div className="mt-3 mb-3 border-t border-gray-200 mx-3" />
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Logout button */}
      <div className={`${
        touchMode === 'glove' ? 'p-5' : touchMode === 'precision' ? 'p-3' : 'p-4'
      } border-t border-gray-200 dark:border-gray-700`}>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center justify-center ${
            touchMode === 'glove' ? 'px-5 py-4' : touchMode === 'precision' ? 'px-3 py-2' : 'px-4 py-3'
          } border border-gray-300 dark:border-gray-600 rounded-md shadow-sm ${getFullTypographyClass('button', 'base', isLargeFont)} font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors`}
        >
          <LogOut className="mr-2 h-4 w-4" />
          로그아웃
        </button>
      </div>
    </div>
  )
}