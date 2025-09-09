'use client'

import { Profile } from '@/types'
import { 
  Building2, Menu, X, Home, Users, FileText, 
  Package, LogOut, BarChart3, Bell, User, FolderOpen
} from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { signOut } from '@/app/auth/actions'
import Link from 'next/link'
import { useFontSize, getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'

interface PartnerDashboardLayoutProps {
  children: React.ReactNode
  profile: Profile & { partner_companies?: any }
}

// Partner-specific menu structure (simplified for customer_manager)
const menuItems = [
  {
    id: 'home',
    label: '홈',
    icon: Home,
    href: '/partner/dashboard'
  },
  {
    id: 'sites',
    label: '참여 현장',
    icon: Building2,
    href: '/partner/sites'
  },
  {
    id: 'workers',
    label: '소속 직원',
    icon: Users,
    href: '/partner/workers'
  },
  {
    id: 'daily-reports',
    label: '작업일지',
    icon: FileText,
    href: '/partner/daily-reports'
  },
  {
    id: 'materials',
    label: '자재 관리',
    icon: Package,
    href: '/partner/materials'
  },
  {
    id: 'documents',
    label: '문서함',
    icon: FolderOpen,
    href: '/partner/documents'
  },
  {
    id: 'notifications',
    label: '알림',
    icon: Bell,
    href: '/partner/notifications'
  }
]

export default function PartnerDashboardLayout({ children, profile }: PartnerDashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()

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

  const getTypographyClass = (type: string, size: string = 'base') => {
    return getFullTypographyClass(type, size, isLargeFont)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            {/* Logo and company name */}
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className={`${getTypographyClass('header', 'lg')} font-bold text-gray-900 dark:text-gray-100`}>
                  파트너사 대시보드
                </h1>
                {profile.partner_companies && (
                  <p className={`${getTypographyClass('caption', 'xs')} text-gray-500 dark:text-gray-400`}>
                    {profile.partner_companies.company_name}
                  </p>
                )}
              </div>
            </div>

            {/* User menu */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className={`${getTypographyClass('body', 'sm')} font-medium text-gray-900 dark:text-gray-100`}>
                  {profile.full_name || profile.email}
                </p>
                <p className={`${getTypographyClass('caption', 'xs')} text-gray-500 dark:text-gray-400`}>
                  파트너사 관리자
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
          <nav className="flex-1 px-2 py-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                    touchMode === 'glove' ? 'py-3' : touchMode === 'precision' ? 'py-1.5' : 'py-2'
                  } ${getTypographyClass('body', 'sm')} font-medium ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Company info */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className={`${getTypographyClass('caption', 'xs')} text-gray-500 dark:text-gray-400 mb-1`}>
                소속 파트너사
              </p>
              <p className={`${getTypographyClass('body', 'sm')} font-medium text-gray-900 dark:text-gray-100`}>
                {profile.partner_companies?.company_name || '파트너사 정보 없음'}
              </p>
              {profile.partner_companies?.business_number && (
                <p className={`${getTypographyClass('caption', 'xs')} text-gray-500 dark:text-gray-400 mt-1`}>
                  사업자번호: {profile.partner_companies.business_number}
                </p>
              )}
            </div>
          </div>
        </aside>

        {/* Mobile sidebar */}
        {isSidebarOpen && (
          <>
            <div 
              className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
            <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 shadow-xl lg:hidden">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-800">
                  <h2 className={`${getTypographyClass('header', 'md')} font-bold text-gray-900 dark:text-gray-100`}>
                    메뉴
                  </h2>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <nav className="flex-1 px-2 py-4 space-y-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                    
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setIsSidebarOpen(false)}
                        className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                          getTypographyClass('body', 'sm')
                        } font-medium ${
                          isActive
                            ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <Icon className="mr-3 h-5 w-5" />
                        {item.label}
                      </Link>
                    )
                  })}
                </nav>

                {/* Company info - Mobile */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    <p className={`${getTypographyClass('caption', 'xs')} text-gray-500 dark:text-gray-400 mb-1`}>
                      소속 파트너사
                    </p>
                    <p className={`${getTypographyClass('body', 'sm')} font-medium text-gray-900 dark:text-gray-100`}>
                      {profile.partner_companies?.company_name || '파트너사 정보 없음'}
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}