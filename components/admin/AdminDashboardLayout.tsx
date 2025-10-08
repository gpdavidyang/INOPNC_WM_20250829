'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Home,
  Layout,
  BarChart3,
  Building2,
  FileText,
  Package,
  UserPlus,
  Users,
  Shield,
  FolderOpen,
  Settings,
  FileCheck,
  DollarSign,
  Camera,
  Edit3,
  Bell,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useFontSize } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'
import type { Profile } from '@/lib/supabase'
import AdminHeader from './AdminHeader'
import { signOut } from '@/app/auth/actions'

interface AdminDashboardLayoutProps {
  children: React.ReactNode
  profile?: Profile | null
}

// 카테고리별로 그룹핑된 메뉴 구조
const menuCategories = [
  {
    id: 'main',
    label: null, // 첫 번째 카테고리는 라벨 없음
    collapsible: false,
    items: [
      {
        id: 'home',
        label: '홈',
        icon: Home,
        href: '/dashboard/admin',
      },
      {
        id: 'integrated',
        label: '통합 관리 대시보드',
        icon: Layout,
        href: '/dashboard/admin/integrated',
        hidden: true,
      },
    ],
  },
  {
    id: 'analytics',
    label: '현장작업 관리',
    collapsible: true,
    items: [
      {
        id: 'analytics',
        label: '분석 대시보드',
        icon: BarChart3,
        href: '/dashboard/admin/analytics',
        hidden: true, // 현재 필요 없음
      },
      {
        id: 'sites',
        label: '현장 관리',
        icon: Building2,
        href: '/dashboard/admin/sites',
      },
      {
        id: 'daily-reports',
        label: '작업일지 관리',
        icon: FileText,
        href: '/dashboard/admin/daily-reports',
      },
      {
        id: 'invoice-documents',
        label: '기성청구 관리',
        icon: FileText,
        href: '/dashboard/admin/documents/invoice',
      },
      {
        id: 'materials',
        label: '자재 관리',
        icon: Package,
        href: '/dashboard/admin/materials',
      },
      {
        id: 'photo-grid-tool',
        label: '사진대지 관리',
        icon: Camera,
        href: '/dashboard/admin/tools/photo-grid',
      },
      {
        id: 'markup-tool',
        label: '도면마킹 관리',
        icon: Edit3,
        href: '/dashboard/admin/tools/markup',
      },
    ],
  },
  {
    id: 'accounts',
    label: '사용자 및 소속 관리',
    collapsible: true,
    items: [
      {
        id: 'signup-requests',
        label: '가입 요청 관리',
        icon: UserPlus,
        href: '/dashboard/admin/signup-requests',
      },
      {
        id: 'users',
        label: '사용자 관리',
        icon: Users,
        href: '/dashboard/admin/users',
      },
      {
        id: 'salary',
        label: '급여관리 도구',
        icon: DollarSign,
        href: '/dashboard/admin/salary',
      },
      {
        id: 'document-required',
        label: '필수서류 관리',
        icon: FileCheck,
        href: '/dashboard/admin/documents/required',
      },
      {
        id: 'organizations',
        label: '소속(시공사) 관리',
        icon: Shield,
        href: '/dashboard/admin/organizations',
      },
      // 공급업체 관리는 UI에서 노출하지 않음 (혼선 방지)
    ],
  },

  {
    id: 'communication',
    label: '소통',
    collapsible: true,
    items: [
      {
        id: 'notifications',
        label: '알림 관리',
        icon: Bell,
        href: '/dashboard/admin/notifications',
      },
      {
        id: 'communication',
        label: '커뮤니케이션',
        icon: MessageSquare,
        href: '/dashboard/admin/communication',
      },
    ],
  },
]

// 시스템 카테고리 (admin/system_admin만 접근 가능)
const systemCategory = {
  id: 'system',
  label: '시스템',
  collapsible: true,
  items: [
    {
      id: 'system',
      label: '시스템 설정',
      icon: Settings,
      href: '/dashboard/admin/system',
    },
    {
      id: 'work-options',
      label: '작업 옵션 관리',
      icon: Settings,
      href: '/dashboard/admin/work-options',
    },
    {
      id: 'audit-logs',
      label: '감사 로그',
      icon: FileText,
      href: '/dashboard/admin/audit-logs',
    },
    {
      id: 'documents-company',
      label: '이노피앤씨 설정',
      icon: FileText,
      href: '/dashboard/admin/documents/company',
    },
  ],
}

// Helper function to get typography class
function getTypographyClass(
  type: string,
  size: string = 'base',
  isLargeFont: boolean = false
): string {
  return getFullTypographyClass(type, size, isLargeFont)
}

// Sidebar component
function Sidebar({
  profile,
  pathname,
  onItemClick,
  isCollapsed,
}: {
  profile?: Profile | null
  pathname: string
  onItemClick?: () => void
  isCollapsed?: boolean
}) {
  const router = useRouter()
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // State for managing collapsed categories
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())

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

  // Pending signup requests badge
  const [pendingSignupCount, setPendingSignupCount] = useState<number>(0)
  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = await fetch('/api/admin/signup-requests/pending-count', { cache: 'no-store' })
        const j = await res.json().catch(() => ({}))
        if (active && res.ok && j?.success) setPendingSignupCount(Number(j.count || 0))
      } catch {
        /* ignore */
      }
    })()
    return () => {
      active = false
    }
  }, [])

  // Toggle category collapse state
  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  // admin과 system_admin 모두 시스템 관리 메뉴 접근 가능
  const allCategories =
    profile?.role === 'admin' || profile?.role === 'system_admin'
      ? [...menuCategories, systemCategory]
      : menuCategories

  // If collapsed, show mini sidebar with just icons
  if (isCollapsed) {
    return (
      <div className="flex flex-col h-full bg-white shadow-xl w-16">
        {/* Mini Logo removed from collapsed sidebar */}

        {/* Mini Navigation - Icons only */}
        <div className="flex-1 overflow-y-auto py-3">
          <nav className="space-y-1 px-2">
            {allCategories.map((category: unknown) => {
              return (
                <div key={category.id}>
                  {category.items
                    .filter((item: unknown) => !item.hidden)
                    .map((item: unknown) => {
                      const Icon = item.icon
                      const isActive = pathname === item.href

                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          onClick={onItemClick}
                          className={`flex items-center justify-center p-2 rounded-md transition-colors group relative ${
                            isActive
                              ? 'bg-red-50 text-red-700'
                              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                          title={item.label}
                        >
                          {mounted ? (
                            <Icon className="h-5 w-5" />
                          ) : (
                            <span className="h-5 w-5 inline-block" />
                          )}
                          {/* Tooltip on hover */}
                          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                            {item.label}
                          </div>
                        </Link>
                      )
                    })}
                </div>
              )
            })}
          </nav>
        </div>

        {/* Mini Logout button */}
        <div className="p-3 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center p-2 border border-gray-300 rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            title="로그아웃"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  // Full sidebar (default)
  return (
    <div className="flex flex-col h-full bg-white shadow-xl">
      {/* Logo and user info */}
      <div
        className={`${
          touchMode === 'glove' ? 'p-5' : touchMode === 'precision' ? 'p-3' : 'p-4'
        } border-b border-gray-200`}
      >
        <div className="flex items-center mb-4">
          {/* Sidebar logo removed */}
          <div>
            <h2
              className={`${getTypographyClass('header', 'sm', isLargeFont)} font-bold text-gray-900`}
            >
              시스템 관리자
            </h2>
            <p className={`${getTypographyClass('caption', 'xs', isLargeFont)} text-gray-500`}>
              Admin Dashboard
            </p>
          </div>
        </div>

        {/* User info */}
        {profile && (
          <div className="bg-gray-50 rounded-lg p-3">
            <p
              className={`${getTypographyClass('body', 'sm', isLargeFont)} font-medium text-gray-900`}
            >
              {profile.name || profile.email}
            </p>
            <p className={`${getTypographyClass('caption', 'xs', isLargeFont)} text-gray-500`}>
              {profile.role === 'admin' ? '본사관리자' : '시스템관리자'}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-3">
        <nav className="space-y-3 px-2">
          {allCategories.map((category: unknown, categoryIndex: number) => {
            const isCollapsed = collapsedCategories.has(category.id)
            const hasActiveItem = category.items.some((item: unknown) => pathname === item.href)

            return (
              <div key={category.id}>
                {/* Category label with accordion button */}
                {category.label && (
                  <button
                    onClick={() => category.collapsible && toggleCategory(category.id)}
                    className={`w-full flex items-center justify-between px-3 mb-2 ${
                      category.collapsible ? 'cursor-pointer hover:bg-gray-50 rounded-md py-1' : ''
                    }`}
                  >
                    <h3
                      className={`${getTypographyClass('overline', 'xs', isLargeFont)} font-semibold text-gray-500 uppercase tracking-wider`}
                    >
                      {category.label}
                    </h3>
                    {category.collapsible && (
                      <ChevronRight
                        className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                          !isCollapsed ? 'rotate-90' : ''
                        }`}
                      />
                    )}
                  </button>
                )}

                {/* Category items - show if not collapsed or has active item */}
                {(!category.collapsible || !isCollapsed || hasActiveItem) && (
                  <div className="space-y-1">
                    {category.items
                      .filter((item: unknown) => !item.hidden)
                      .map((item: unknown) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href

                        return (
                          <Link
                            key={item.id}
                            href={item.href}
                            onClick={onItemClick}
                            className={`flex items-center ${
                              touchMode === 'glove'
                                ? 'px-5 py-3'
                                : touchMode === 'precision'
                                  ? 'px-3 py-1.5'
                                  : 'px-4 py-2'
                            } ${getTypographyClass('body', 'sm', isLargeFont)} font-medium rounded-md transition-colors ${
                              isActive
                                ? 'bg-red-50 text-red-700'
                                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                          >
                            {mounted ? (
                              <Icon className="mr-3 h-5 w-5" />
                            ) : (
                              <span className="mr-3 h-5 w-5 inline-block" />
                            )}
                            <span className="mr-2">{item.label}</span>
                            {item.id === 'signup-requests' && pendingSignupCount > 0 && (
                              <span className="inline-flex items-center justify-center min-w-[18px] h-5 px-1 rounded-full text-xs font-semibold text-white bg-red-600">
                                {pendingSignupCount > 99 ? '99+' : pendingSignupCount}
                              </span>
                            )}
                          </Link>
                        )
                      })}
                  </div>
                )}

                {/* Divider between categories (except for the last one) */}
                {categoryIndex < allCategories.length - 1 && (
                  <div className="mt-3 mb-3 border-t border-gray-200 mx-3" />
                )}
              </div>
            )
          })}
        </nav>
      </div>

      {/* Logout button */}
      <div
        className={`${
          touchMode === 'glove' ? 'p-5' : touchMode === 'precision' ? 'p-3' : 'p-4'
        } border-t border-gray-200`}
      >
        <button
          onClick={handleLogout}
          className={`w-full flex items-center justify-center ${
            touchMode === 'glove'
              ? 'px-5 py-4'
              : touchMode === 'precision'
                ? 'px-3 py-2'
                : 'px-4 py-3'
          } border border-gray-300 rounded-md shadow-sm ${getTypographyClass('button', 'base', isLargeFont)} font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors`}
        >
          <LogOut className="mr-2 h-4 w-4" />
          로그아웃
        </button>
      </div>
    </div>
  )
}

export default function AdminDashboardLayout({
  children,
  profile: propProfile,
}: AdminDashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  // Remove mobile sidebar state - desktop only
  // const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  // Initialize with a stable SSR-safe default to avoid hydration mismatch.
  // Read localStorage and viewport only after mount.
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(propProfile || null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()

  // Hydrate initial sidebar state on mount (client-only)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('admin-sidebar-collapsed')
      if (saved !== null) {
        setIsSidebarCollapsed(saved === 'true')
        return
      }
      // Default to collapsed on mobile, expanded on desktop
      const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false
      setIsSidebarCollapsed(isMobile)
    } catch (e) {
      // Fallback to default (expanded) if any error occurs
      setIsSidebarCollapsed(false)
    }
  }, [])

  // Save sidebar collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem('admin-sidebar-collapsed', isSidebarCollapsed.toString())
  }, [isSidebarCollapsed])

  // Initialize theme - Always use light mode for admin
  useEffect(() => {
    // Force light mode for admin/system_admin
    setIsDarkMode(false)
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }, [])

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/admin/profile')
        if (response.ok) {
          const data = await response.json()
          setProfile(data)
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      }
    }
    fetchProfile()
  }, [])

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

  // Toggle desktop sidebar collapse
  const toggleDesktopSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed)
  }

  // Mobile sidebar removed - desktop only layout

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Admin Header - Desktop only */}
      <AdminHeader
        profile={profile}
        onMenuClick={undefined} // Remove mobile menu
        onDesktopMenuClick={toggleDesktopSidebar}
        isSidebarOpen={false} // Always false for desktop
        isSidebarCollapsed={isSidebarCollapsed}
      />

      {/* Desktop sidebar - Always visible */}
      <div
        className={`fixed inset-y-0 left-0 z-40 flex flex-col transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'w-16' : 'w-72 lg:w-72 md:w-64 sm:w-56'
        }`}
        style={{
          top: 'var(--admin-header-h, 64px)',
          height: 'calc(100vh - var(--admin-header-h, 64px))',
        }}
      >
        <Sidebar profile={profile} pathname={pathname} isCollapsed={isSidebarCollapsed} />
      </div>

      {/* Main content area - Desktop layout */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'pl-16' : 'pl-72 lg:pl-72 md:pl-64 sm:pl-56'
        }`}
        style={{ paddingTop: 'var(--admin-header-h, 64px)', minWidth: '1536px' }}
      >
        {/* Page content */}
        <main className="py-6">
          <div className="px-8" style={{ width: '100%' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
