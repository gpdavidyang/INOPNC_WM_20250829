'use client'

import { Profile } from '@/types'
import { 
  Shield, Menu, X, Home, Users, Building2, FolderCheck, 
  DollarSign, Package, Layers, Settings, LogOut, BarChart3, Bell,
  ChevronDown, ChevronRight, User, Key, UserPlus, FileText, MessageSquare,
  FolderOpen, FileImage, FileCheck, Camera, Edit3, Share2
} from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { signOut } from '@/app/auth/actions'
import Link from 'next/link'
import { useFontSize, getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'
import AdminHeader from '@/components/admin/AdminHeader'

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
        href: '/dashboard/admin'
      }
    ]
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
        hidden: true  // 현재 필요 없음
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
        id: 'materials',
        label: '자재 관리',
        icon: Package,
        href: '/dashboard/admin/materials'
      }
    ]
  },
  {
    id: 'accounts',
    label: '사용자 관리',
    collapsible: true,
    items: [
      {
        id: 'users',
        label: '사용자 관리',
        icon: Users,
        href: '/dashboard/admin/users'
      },
      {
        id: 'signup-requests',
        label: '가입 요청 관리',
        icon: UserPlus,
        href: '/dashboard/admin/signup-requests'
      },
      {
        id: 'salary',
        label: '급여 관리',
        icon: DollarSign,
        href: '/dashboard/admin/salary'
      },
      {
        id: 'organizations',
        label: '소속업체 관리',
        icon: Shield,
        href: '/dashboard/admin/organizations'
      },
      {
        id: 'partners',
        label: '파트너사 관리',
        icon: UserPlus,
        href: '/dashboard/admin/partners'
      }
    ]
  },
  {
    id: 'documents-tools',
    label: '문서함 및 도구',
    collapsible: true,
    items: [
      {
        id: 'documents-management',
        label: '문서함 관리',
        icon: FolderOpen,
        href: '/dashboard/admin/documents'
      },
      {
        id: 'photo-grid-tool',
        label: '사진대지 도구',
        icon: Camera,
        href: '/dashboard/admin/tools/photo-grid'
      },
      {
        id: 'markup-tool',
        label: '도면마킹 도구',
        icon: Edit3,
        href: '/dashboard/admin/tools/markup'
      }
    ]
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
        href: '/dashboard/admin/notifications'
      },
      {
        id: 'communication',
        label: '커뮤니케이션',
        icon: MessageSquare,
        href: '/dashboard/admin/communication'
      }
    ]
  }
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
      href: '/dashboard/admin/system'
    },
    {
      id: 'account',
      label: '계정 설정',
      icon: Key,
      href: '/dashboard/admin/account'
    },
    {
      id: 'monitoring',
      label: '시스템 모니터링',
      icon: Shield,
      href: '/dashboard/admin/monitoring'
    },
    {
      id: 'audit-logs',
      label: '감사 로그',
      icon: FileText,
      href: '/dashboard/admin/audit-logs'
    },
    {
      id: 'backup',
      label: '백업 관리',
      icon: Shield,
      href: '/dashboard/admin/backup'
    },
    {
      id: 'signup-requests',
      label: '가입 요청 관리',
      icon: UserPlus,
      href: '/dashboard/admin/signup-requests'
    }
  ]
}

// Helper function to get typography class
function getTypographyClass(type: string, size: string = 'base', isLargeFont: boolean = false): string {
  return getFullTypographyClass(type, size, isLargeFont)
}

// Sidebar component
function Sidebar({ profile, pathname, onItemClick }: {
  profile?: Profile | null
  pathname: string
  onItemClick?: () => void
}) {
  const router = useRouter()
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  
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
  const allCategories = (profile?.role === 'admin' || profile?.role === 'system_admin')
    ? [...menuCategories, systemCategory]
    : menuCategories

  return (
    <div className="flex flex-col h-full bg-white shadow-xl">
      {/* Logo and user info */}
      <div className={`${
        touchMode === 'glove' ? 'p-5' : touchMode === 'precision' ? 'p-3' : 'p-4'
      } border-b border-gray-200`}>
        <div className="flex items-center mb-4">
          <Shield className="h-8 w-8 text-red-600 mr-3" />
          <div>
            <h2 className={`${getTypographyClass('header', 'sm', isLargeFont)} font-bold text-gray-900`}>
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
            <p className={`${getTypographyClass('body', 'sm', isLargeFont)} font-medium text-gray-900`}>
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
          {allCategories.map((category: any, categoryIndex: number) => {
            const isCollapsed = collapsedCategories.has(category.id)
            const hasActiveItem = category.items.some((item: any) => pathname === item.href)
            
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
                    <h3 className={`${getTypographyClass('overline', 'xs', isLargeFont)} font-semibold text-gray-500 uppercase tracking-wider`}>
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
                    {category.items.filter((item: any) => !item.hidden).map((item: any) => {
                      const Icon = item.icon
                      const isActive = pathname === item.href
                      
                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          onClick={onItemClick}
                          className={`flex items-center ${
                            touchMode === 'glove' ? 'px-5 py-3' : touchMode === 'precision' ? 'px-3 py-1.5' : 'px-4 py-2'
                          } ${getTypographyClass('body', 'sm', isLargeFont)} font-medium rounded-md transition-colors ${
                            isActive
                              ? 'bg-red-50 text-red-700'
                              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                        >
                          <Icon className="mr-3 h-5 w-5" />
                          {item.label}
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
      <div className={`${
        touchMode === 'glove' ? 'p-5' : touchMode === 'precision' ? 'p-3' : 'p-4'
      } border-t border-gray-200`}>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center justify-center ${
            touchMode === 'glove' ? 'px-5 py-4' : touchMode === 'precision' ? 'px-3 py-2' : 'px-4 py-3'
          } border border-gray-300 rounded-md shadow-sm ${getTypographyClass('button', 'base', isLargeFont)} font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors`}
        >
          <LogOut className="mr-2 h-4 w-4" />
          로그아웃
        </button>
      </div>
    </div>
  )
}

export default function AdminDashboardLayout({ children, profile: propProfile }: AdminDashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(propProfile || null)
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Admin Header with integrated search */}
      <AdminHeader 
        profile={profile}
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />
      
      {/* Mobile sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-200 ease-in-out lg:hidden ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`} style={{ top: '64px' }}>
        <Sidebar 
          profile={profile} 
          pathname={pathname} 
          onItemClick={() => setIsSidebarOpen(false)} 
        />
      </div>

      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          style={{ top: '64px' }}
        />
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-72 lg:flex-col" style={{ top: '64px', height: 'calc(100vh - 64px)' }}>
        <Sidebar profile={profile} pathname={pathname} />
      </div>

      {/* Main content area - lg:pl-72로 사이드바 너비만큼 패딩 */}
      <div className="lg:pl-72" style={{ paddingTop: '64px' }}>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-none px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}