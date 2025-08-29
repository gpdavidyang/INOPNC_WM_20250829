'use client'

import { User } from '@supabase/supabase-js'
import { Profile } from '@/types'
import { useState } from 'react'
import Sidebar from '@/components/dashboard/sidebar'
import Header from '@/components/dashboard/header'
import { BottomNavigation, BottomNavItem } from '@/components/ui/bottom-navigation'
import { NotificationsContent } from './notifications-content'
import { Home, Calendar, FileText, FileImage, FolderOpen } from 'lucide-react'

interface NotificationsPageWrapperProps {
  user: User
  profile: Profile
}

export function NotificationsPageWrapper({ user, profile }: NotificationsPageWrapperProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Handle case where profile is not loaded yet
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">프로필을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // PRD 사양에 맞는 하단 네비게이션 아이템 구성
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
      icon: <FileText /> 
    },
    { 
      label: "공유문서", 
      href: "/dashboard/documents", 
      icon: <FolderOpen /> 
    },
    { 
      label: "내문서함", 
      href: "/dashboard/markup", 
      icon: <FileImage /> 
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <Header 
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div className="flex">
        {/* Sidebar */}
        <Sidebar 
          user={user} 
          profile={profile}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Content */}
        <main className="flex-1 lg:ml-64">
          {/* Page Header - Sticky */}
          <div className="sticky top-0 z-20 bg-gray-50 dark:bg-gray-900 px-3 sm:px-4 py-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">알림</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">시스템 알림 및 메시지를 확인하세요</p>
          </div>
          
          <div className="p-3 sm:p-4 pb-20 lg:pb-4">
            
            {/* Notifications Content */}
            <div className="max-w-4xl mx-auto">
              <NotificationsContent />
            </div>
          </div>
        </main>
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <div className="lg:hidden">
        <BottomNavigation 
          items={bottomNavItems}
        />
      </div>
    </div>
  )
}