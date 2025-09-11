'use client'

import React, { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { Profile } from '@/types'
import { Home, Calendar, FileText, FolderOpen, User as UserIcon, MapPin } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Sidebar from './sidebar'
import Header from './header'
import HomeTab from './tabs/home-tab'
import {
  LazyWorkLogsTab,
  LazyDocumentsTabUnified,
  LazyAttendanceTab,
  preloadForRole
} from './tabs/lazy-components'
// import SiteInfoTab from './tabs/site-info-tab' // Moved to dedicated page: /dashboard/site-info
import { UnifiedMobileNav } from '@/components/ui/unified-mobile-nav'

interface DashboardLayoutProps {
  user: User
  profile: Profile
  children?: React.ReactNode
  initialActiveTab?: string
  useConstructionMode?: boolean // 건설 현장 모드 옵션
  initialCurrentSite?: any
  initialSiteHistory?: any[]
}

export default function DashboardLayout({ user, profile, children, initialActiveTab = 'home', useConstructionMode = false, initialCurrentSite, initialSiteHistory }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(initialActiveTab)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false) // 초기값은 항상 false (닫힌 상태)
  const [documentsInitialSearch, setDocumentsInitialSearch] = useState<string | undefined>()

  // Helper function to get active tab from pathname and hash
  const getCurrentActiveTabFromPath = (path: string) => {
    // Check for hash-based navigation first
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.replace('#', '')
      if (hash === 'documents-unified' || hash === 'documents') return 'documents-unified'
      if (hash === 'home') return 'home'
      if (hash === 'daily-reports') return 'daily-reports'
      if (hash === 'attendance') return 'attendance'
      if (hash === 'profile') return 'profile'
    }
    
    // Fallback to path-based navigation
    if (path.includes('/dashboard/site-info')) return 'site-info'
    if (path.includes('/dashboard/daily-reports')) return 'daily-reports'
    if (path.includes('/dashboard/attendance')) return 'attendance'
    if (path.includes('/dashboard/documents')) return 'documents-unified'
    if (path.includes('/dashboard/markup')) return 'documents-unified'
    if (path.includes('/dashboard/profile')) return 'profile'
    if (path === '/dashboard') {
      // Check if there's a hash for dashboard home page
      if (typeof window !== 'undefined' && window.location.hash) {
        const hash = window.location.hash.replace('#', '')
        if (hash && hash !== 'home') return hash
      }
      return 'home'
    }
    return 'home'
  }

  // Update activeTab based on current pathname and hash - OPTIMIZED
  useEffect(() => {
    // Performance optimization: Use single evaluation
    const newTab = getCurrentActiveTabFromPath(pathname)
    // Only update if actually changed to prevent re-renders
    if (newTab !== activeTab) {
      // console.log('[DashboardLayout] Tab change:', activeTab, '->', newTab)
      setActiveTab(newTab)
    }
  }, [pathname]) // ✅ Removed children and activeTab dependency to prevent loops

  // Listen for hash changes to support direct hash navigation
  useEffect(() => {
    const handleHashChange = () => {
      const newTab = getCurrentActiveTabFromPath(pathname)
      // Use functional update to get current activeTab without adding it to dependencies
      setActiveTab(currentTab => {
        if (newTab !== currentTab) {
          // console.log('[DashboardLayout] Hash change detected, tab change:', currentTab, '->', newTab)
          return newTab
        }
        return currentTab
      })
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [pathname]) // ✅ FIXED: Removed activeTab from dependencies to prevent infinite loop

  // 컴포넌트 프리로드 - 사용자 역할에 따라
  useEffect(() => {
    if (profile?.role) {
      // 역할별로 필요한 컴포넌트 미리 로딩
      const timer = setTimeout(() => {
        preloadForRole(profile.role)
      }, 1000) // 1초 후 프리로드
      
      return () => clearTimeout(timer)
    }
  }, [profile?.role])

  // REMOVED: This effect was causing redirect loops
  // The dedicated pages (attendance, documents) handle their own routing
  // and the activeTab state is derived from the pathname, not the other way around

  // REMOVED: This effect causes circular routing and performance issues
  // Navigation should be handled by user actions, not state changes
  // Each navigation component (sidebar, bottom nav, quick menu) handles its own routing

  // Handle case where profile is not loaded yet
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">프로필을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // Navigation items moved to UnifiedMobileNav component



  // 하단 네비게이션 클릭 처리
  const handleBottomNavClick = React.useCallback(async (tabId: string) => {
    // console.log('[DashboardLayout] handleBottomNavClick called with:', tabId)
    
    try {
      // Check if it's a direct link (starts with /)
      if (tabId.startsWith('/')) {
        // console.log('[DashboardLayout] Direct navigation to:', tabId)
        await router.push(tabId)
        
        // Update active tab state based on the route
        if (tabId === '/dashboard') setActiveTab('home')
        else if (tabId === '/dashboard/attendance') setActiveTab('attendance')
        else if (tabId === '/dashboard/daily-reports') setActiveTab('daily-reports')
        else if (tabId === '/dashboard/site-info') setActiveTab('site-info')
        else if (tabId === '/dashboard/documents') setActiveTab('documents')
        
        return
      }
      
      // Handle hash-based or direct tab navigation
      const cleanTabId = tabId.replace('#', '')
      // console.log('[DashboardLayout] Setting active tab to:', cleanTabId)
      setActiveTab(cleanTabId)
      
    } catch (error) {
      console.error('[DashboardLayout] Navigation error:', error)
    }
  }, [router])

  const renderContent = () => {
    // If children are provided (e.g., from dedicated pages), render them instead
    if (children) {
      return (
        <div key={pathname} className="dashboard-dedicated-page">
          {children}
        </div>
      )
    }
    
    
    switch (activeTab) {
      case 'home':
        return <HomeTab 
          profile={profile} 
          onTabChange={setActiveTab}
          onDocumentsSearch={setDocumentsInitialSearch}
        />
      case 'daily-reports':
        return <LazyWorkLogsTab profile={profile} />
      case 'attendance':
        // 지연 로딩으로 성능 개선
        return <LazyAttendanceTab profile={profile} />
      case 'documents-unified':
        return <LazyDocumentsTabUnified profile={profile} initialSearch={documentsInitialSearch} onTabChange={setActiveTab} />
      case 'documents':
        // Show fallback content while navigation happens
        return <HomeTab 
          profile={profile} 
          onTabChange={setActiveTab}
          onDocumentsSearch={setDocumentsInitialSearch}
        />
      case 'site-info':
        // Site info has its own dedicated page at /dashboard/site-info
        // This case shouldn't normally be reached when using the dedicated page
        return <HomeTab 
          profile={profile} 
          onTabChange={setActiveTab}
          onDocumentsSearch={setDocumentsInitialSearch}
        />
      case 'blueprint-markup':
        // Should not reach here - dedicated page at /dashboard/markup
        return <div className="p-4">Loading markup editor...</div>
      case 'profile':
        return (
          <Card elevation="sm" className="theme-transition">
            <CardHeader>
              <CardTitle className="text-2xl">내정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">이름</label>
                <p className="text-lg text-gray-900 dark:text-gray-100">{profile.full_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">이메일</label>
                <p className="text-lg text-gray-900 dark:text-gray-100">{profile.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">역할</label>
                <p className="text-lg text-gray-900 dark:text-gray-100">
                  {profile?.role === 'worker' && '작업자'}
                  {profile?.role === 'site_manager' && '현장관리자'}
                  {profile?.role === 'customer_manager' && '파트너사'}
                  {profile?.role === 'admin' && '관리자'}
                  {profile?.role === 'system_admin' && '시스템관리자'}
                </p>
              </div>
            </CardContent>
          </Card>
        )
      // 관리자 전용 메뉴들
      case 'site-management':
        return (
          <Card elevation="sm" className="theme-transition">
            <CardHeader>
              <CardTitle className="text-2xl">현장 관리</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">현장 관리 기능이 구현될 예정입니다.</p>
            </CardContent>
          </Card>
        )
      case 'user-management':
        return (
          <Card elevation="sm" className="theme-transition">
            <CardHeader>
              <CardTitle className="text-2xl">사용자 관리</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">사용자 관리 기능이 구현될 예정입니다.</p>
            </CardContent>
          </Card>
        )
      case 'shared-documents-management':
        return (
          <Card elevation="sm" className="theme-transition">
            <CardHeader>
              <CardTitle className="text-2xl">공유 문서함 관리</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">공유 문서함 관리 기능이 구현될 예정입니다.</p>
            </CardContent>
          </Card>
        )
      case 'payroll-management':
        return (
          <Card elevation="sm" className="theme-transition">
            <CardHeader>
              <CardTitle className="text-2xl">급여 관리</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">급여 관리 기능이 구현될 예정입니다.</p>
            </CardContent>
          </Card>
        )
      case 'npc1000-management':
        return (
          <Card elevation="sm" className="theme-transition">
            <CardHeader>
              <CardTitle className="text-2xl">NPC-1000 자재 관리</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">NPC-1000 자재 관리 기능이 구현될 예정입니다.</p>
            </CardContent>
          </Card>
        )
      case 'blueprint-markup-management':
        return (
          <Card elevation="sm" className="theme-transition">
            <CardHeader>
              <CardTitle className="text-2xl">도면 마킹 관리</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">도면 마킹 관리 기능이 구현될 예정입니다.</p>
            </CardContent>
          </Card>
        )
      case 'other-admin-menu':
        return (
          <Card elevation="sm" className="theme-transition">
            <CardHeader>
              <CardTitle className="text-2xl">그 외 관리자 메뉴</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">추가 관리자 기능이 구현될 예정입니다.</p>
            </CardContent>
          </Card>
        )
      case 'system-management':
        return (
          <Card elevation="sm" className="theme-transition">
            <CardHeader>
              <CardTitle className="text-2xl">시스템 관리</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">시스템 관리 기능이 구현될 예정입니다.</p>
            </CardContent>
          </Card>
        )
      case 'settings':
        return (
          <div className="max-w-7xl mx-auto">
            <iframe 
              src="/dashboard/settings" 
              className="w-full h-screen border-0"
              title="Settings"
            />
          </div>
        )
      default:
        return <HomeTab 
          profile={profile} 
          onTabChange={setActiveTab}
          initialCurrentSite={initialCurrentSite}
          initialSiteHistory={initialSiteHistory}
        />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 theme-transition">
      {/* Skip link for keyboard users */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-md shadow-lg focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
      >
        메인 콘텐츠로 이동
      </a>

      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75 z-40 lg:hidden transition-opacity duration-200"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            // console.log('[DashboardLayout] Backdrop clicked, closing sidebar')
            setIsSidebarOpen(false)
          }}
          aria-hidden="true"
          role="button"
          tabIndex={-1}
        />
      )}

      {/* Sidebar Navigation */}
      <aside aria-label="메인 네비게이션">
        <Sidebar
          key={`sidebar-${isSidebarOpen}`}
          profile={profile}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isOpen={isSidebarOpen}
          onClose={() => {
            // console.log('[DashboardLayout] onClose called, setting isSidebarOpen to false')
            setIsSidebarOpen(false)
          }}
        />
      </aside>

      {/* Main content area */}
      <div className="lg:pl-64 h-screen flex flex-col">
        {/* Page header */}
        <Header
          isSidebarOpen={isSidebarOpen}
          onMenuClick={() => {
            // console.log('[DashboardLayout] Menu button clicked, toggling sidebar from', isSidebarOpen, 'to', !isSidebarOpen)
            setIsSidebarOpen(!isSidebarOpen)
          }}
        />
        
        {/* Main content with scroll container */}
        <main id="main-content" className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-900">
          <div className="pt-3 px-4 sm:px-6 lg:px-8 pb-24 md:pb-6">
            <div className="mx-auto max-w-7xl">
              <div role="region" aria-live="polite" aria-label="페이지 콘텐츠">
                {renderContent()}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Simplified Mobile Bottom Navigation */}
      <UnifiedMobileNav 
        userRole={profile.role}
        activeTab={activeTab}
        onTabChange={(tabId) => {
          // console.log('[DashboardLayout] onTabChange called with:', tabId)
          handleBottomNavClick(tabId)
        }}
      />
    </div>
  )
}