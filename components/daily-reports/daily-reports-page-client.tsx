'use client'

import { useState } from 'react'
import { Profile } from '@/types'
import Sidebar from '@/components/dashboard/sidebar'
import Header from '@/components/dashboard/header'
import { BottomNavigation, BottomNavItem } from '@/components/ui/bottom-navigation'
import { DailyReportListMobile } from '@/components/daily-reports/DailyReportListMobile'
import { DailyReportListEnhanced } from '@/components/daily-reports/DailyReportListEnhanced'
import { ReportsPageHeader } from '@/components/ui/page-header'
import { Home, Calendar, FileText, FolderOpen, MapPin } from 'lucide-react'

interface DailyReportsPageClientProps {
  profile: Profile
  sites: unknown[]
}

export function DailyReportsPageClient({ profile, sites }: DailyReportsPageClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  
  // Bottom navigation items
  const bottomNavItems: BottomNavItem[] = [
    { 
      label: "빠른화면", 
      href: "/dashboard", 
      icon: <Home /> 
    },
    { 
      label: "출력정보", 
      href: "/dashboard/attendance", 
      icon: <Calendar /> 
    },
    { 
      label: "작업일지", 
      href: "/dashboard/daily-reports", 
      icon: <FileText />, 
      badge: 3
    },
    { 
      label: "현장정보", 
      href: "/dashboard/site-info", 
      icon: <MapPin /> 
    },
    { 
      label: "문서함", 
      href: "/dashboard/documents", 
      icon: <FolderOpen /> 
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop Sidebar */}
      <Sidebar 
        profile={profile}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        activeTab="daily-reports"
      />
      
      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Header with hamburger button functionality */}
        <Header 
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
        />
        
        {/* Page Content */}
        <main className="px-3 sm:px-4 lg:px-6 pb-20 lg:pb-0">
          {/* Mobile View - UI Guidelines에 맞춘 모바일 최적화 */}
          <div className="lg:hidden">
            <div 
              className="h-[calc(100vh-4rem-5rem)] overflow-y-auto pt-3 overscroll-behavior-contain"
              style={{ 
                WebkitOverflowScrolling: 'touch',
                transform: 'translate3d(0, 0, 0)' 
              }}
            >
              <DailyReportListMobile 
                currentUser={profile as any}
                sites={sites || []}
              />
            </div>
          </div>
          
          {/* Desktop View - 기존 Enhanced 컴포넌트 유지 */}
          <div className="hidden lg:block h-full bg-gray-50 dark:bg-gray-900">
            <div className="bg-white dark:bg-gray-900">
              <ReportsPageHeader
                title="작업일지"
                subtitle="일일 작업 보고서 및 현장 상황을 관리합니다"
              />
              <DailyReportListEnhanced 
                currentUser={profile as any}
                sites={sites || []}
              />
            </div>
          </div>
        </main>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <BottomNavigation
        items={bottomNavItems}
        className="lg:hidden"
      />
    </div>
  )
}