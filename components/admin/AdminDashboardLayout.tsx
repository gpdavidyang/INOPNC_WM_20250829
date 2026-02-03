'use client'

import type { Profile } from '@/lib/supabase'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import AdminHeader from './AdminHeader'
import { AdminSidebar } from './layout/AdminSidebar'

interface AdminDashboardLayoutProps {
  children: React.ReactNode
  profile?: Profile | null
}

export default function AdminDashboardLayout({
  children,
  profile: propProfile,
}: AdminDashboardLayoutProps) {
  const pathname = usePathname()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [profile, setProfile] = useState<any | null>(propProfile || null)

  // Sidebar hydration
  useEffect(() => {
    const saved = localStorage.getItem('admin-sidebar-collapsed')
    if (saved !== null) setIsSidebarCollapsed(saved === 'true')
    else setIsSidebarCollapsed(window.innerWidth < 1024)
  }, [])

  useEffect(() => {
    localStorage.setItem('admin-sidebar-collapsed', isSidebarCollapsed.toString())
  }, [isSidebarCollapsed])

  // Profile hydration
  useEffect(() => {
    if (!propProfile) {
      fetch('/api/admin/profile')
        .then(res => res.json())
        .then(data => setProfile(data))
    }
  }, [propProfile])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AdminHeader
        profile={profile}
        onDesktopMenuClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isSidebarCollapsed={isSidebarCollapsed}
      />

      <div className="flex flex-1 overflow-hidden relative">
        <aside
          className={`fixed inset-y-0 left-0 z-40 transition-all duration-500 ease-in-out bg-white shadow-2xl shadow-black/5 ${
            isSidebarCollapsed ? 'w-16' : 'w-72 lg:w-72 md:w-64 sm:w-56'
          }`}
          style={{ top: '64px' }}
        >
          <AdminSidebar profile={profile} pathname={pathname} isCollapsed={isSidebarCollapsed} />
        </aside>

        <main
          className={`flex-1 transition-all duration-500 ease-in-out ${
            isSidebarCollapsed ? 'ml-16' : 'ml-72 lg:ml-72 md:ml-64 sm:ml-56'
          }`}
          style={{
            marginTop: '64px',
            minHeight: 'calc(100vh - 64px)',
            minWidth: '1536px',
          }}
        >
          <div className="p-8 w-full max-w-[1920px] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-700">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
