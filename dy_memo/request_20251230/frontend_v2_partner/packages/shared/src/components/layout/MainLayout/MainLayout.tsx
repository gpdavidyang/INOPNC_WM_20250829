import React, { useState, useEffect } from 'react'
import { Header } from '../Header'
import { BottomNav } from '../BottomNav'
import { GlobalSearch } from '../../navigation/GlobalSearch'
import { CertificateModal } from '../../features/CertificateModal'
import { NotificationPanel } from '../../overlay/NotificationPanel'
import { MenuPanel } from '../../navigation/MenuPanel'
import { AccountOverlay } from '../../overlay/AccountOverlay'
import { AppSwitcher } from '../../navigation/AppSwitcher/AppSwitcher'
import { navigationService } from '../../../services/navigationService'
import { searchService } from '../../../services/searchService'
import type { NotificationItem, AppInfo } from '../../../types'

export interface MainLayoutProps {
  children: React.ReactNode
  title?: string
  currentApp?: string
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  title = 'INOPNC',
  currentApp,
}) => {
  // State: Navigation Features
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isCertModalOpen, setIsCertModalOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const [isNotiOpen, setIsNotiOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 1,
      type: 'alert',
      title: '현장 안전 점검 요망',
      desc: 'A구역 비계 설치 상태 확인',
      time: '방금 전',
      unread: true,
    },
    {
      id: 2,
      type: 'info',
      title: '시스템 점검 안내',
      desc: '12월 10일 오전 2시~4시 점검',
      time: '2시간 전',
      unread: true,
    },
  ])

  // App configuration for navigation
  const apps: AppInfo[] = [
    {
      id: 'main',
      name: '홈',
      url: import.meta.env.VITE_APP_MAIN_URL || 'http://localhost:3007',
      icon: 'https://picsum.photos/seed/main/24/24',
    },
    {
      id: 'money',
      name: '출력현황',
      url: import.meta.env.VITE_APP_MONEY_URL || 'http://localhost:3004',
      icon: 'https://picsum.photos/seed/money/24/24',
    },
    {
      id: 'site',
      name: '현장정보',
      url: import.meta.env.VITE_APP_SITE_URL || 'http://localhost:3003',
      icon: 'https://picsum.photos/seed/site/24/24',
    },
    {
      id: 'doc',
      name: '문서함',
      url: import.meta.env.VITE_APP_DOC_URL || 'http://localhost:3005',
      icon: 'https://picsum.photos/seed/doc/24/24',
    },
  ]

  // Initialize Search Service & Navigation on mount
  useEffect(() => {
    searchService.loadMockData()
    console.log('Search Index Initialized')

    const cleanups: Array<() => void> = []

    if (currentApp) {
      // Initialize navigation service
      const appInfo = apps.find(app => app.id === currentApp)
      if (appInfo) {
        navigationService.initialize(appInfo)

        // Listen for route changes
        const handleRouteChange = () => {
          navigationService.updatePath(window.location.pathname)
        }

        window.addEventListener('popstate', handleRouteChange)
        handleRouteChange() // Initial path

        cleanups.push(() => window.removeEventListener('popstate', handleRouteChange))
      }
    }

    // Theme Initialization - check for external themeManager first
    const externalThemeManager = (window as any).themeManager

    if (externalThemeManager && typeof externalThemeManager.subscribe === 'function') {
      // Use external themeManager if available (from doc app)
      const unsubscribe = externalThemeManager.subscribe((theme: string) => {
        const isDark = theme === 'dark'
        setIsDarkMode(isDark)
        const rootElement = document.getElementById('inopnc-i3-root')
        if (isDark) {
          document.documentElement.classList.add('dark')
          document.body.classList.add('dark-mode')
          rootElement?.classList.add('dark-mode')
        } else {
          document.documentElement.classList.remove('dark')
          document.body.classList.remove('dark-mode')
          rootElement?.classList.remove('dark-mode')
        }
      })

      cleanups.push(() => unsubscribe())
    } else {
      // Fallback to local theme management
      const savedTheme = localStorage.getItem('theme') || localStorage.getItem('inopnc-theme')
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const rootElement = document.getElementById('inopnc-i3-root')

      if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
        setIsDarkMode(true)
        document.documentElement.classList.add('dark')
        document.body.classList.add('dark-mode')
        rootElement?.classList.add('dark-mode')
      } else {
        setIsDarkMode(false)
        document.documentElement.classList.remove('dark')
        document.body.classList.remove('dark-mode')
        rootElement?.classList.remove('dark-mode')
      }
    }

    // Keyboard Shortcut (Ctrl/Cmd + K)
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsSearchOpen(true)
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    cleanups.push(() => window.removeEventListener('keydown', handleGlobalKeyDown))

    return () => {
      cleanups.forEach(fn => fn())
    }
  }, [currentApp])

  const toggleTheme = () => {
    const externalThemeManager = (window as any).themeManager

    if (externalThemeManager && typeof externalThemeManager.toggleTheme === 'function') {
      // Use external themeManager if available
      externalThemeManager.toggleTheme()
    } else {
      // Fallback to local theme management
      const rootElement = document.getElementById('inopnc-i3-root')
      if (isDarkMode) {
        document.documentElement.classList.remove('dark')
        document.body.classList.remove('dark-mode')
        rootElement?.classList.remove('dark-mode')
        localStorage.setItem('theme', 'light')
        localStorage.setItem('inopnc-theme', 'light')
        setIsDarkMode(false)
      } else {
        document.documentElement.classList.add('dark')
        document.body.classList.add('dark-mode')
        rootElement?.classList.add('dark-mode')
        localStorage.setItem('theme', 'dark')
        localStorage.setItem('inopnc-theme', 'dark')
        setIsDarkMode(true)
      }
    }
  }

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })))
  }

  const unreadCount = notifications.filter(n => n.unread).length

  return (
    <div
      id="inopnc-i3-root"
      className="min-h-screen pb-[100px] pt-[60px] max-w-[600px] mx-auto relative shadow-2xl transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-body)' }}
    >
      <Header
        onSearchClick={() => setIsSearchOpen(true)}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        onCertClick={() => setIsCertModalOpen(true)}
        unreadCount={unreadCount}
        onNotificationClick={() => setIsNotiOpen(true)}
        onMenuClick={() => setIsMenuOpen(true)}
        title={title}
      />

      {/* App Switcher - positioned after header */}
      {currentApp && (
        <div className="fixed top-[70px] left-5 z-30">
          <AppSwitcher currentApp={currentApp} apps={apps} />
        </div>
      )}

      <main className="p-5">{children}</main>

      <BottomNav currentApp={currentApp} />

      {/* Global Search Overlay */}
      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Certificate Modal */}
      <CertificateModal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        onHeaderReset={() => {
          // 헤더 초기 상태로 복원
          // 모든 모달/패널 닫기
          setIsSearchOpen(false)
          setIsNotiOpen(false)
          setIsMenuOpen(false)
          setIsAccountOpen(false)
        }}
      />

      {/* Notification Panel */}
      <NotificationPanel
        isOpen={isNotiOpen}
        onClose={() => setIsNotiOpen(false)}
        notifications={notifications}
        onMarkAllRead={markAllNotificationsRead}
      />

      {/* Menu Panel */}
      <MenuPanel
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onOpenAccount={() => setIsAccountOpen(true)}
      />

      {/* Account Overlay */}
      <AccountOverlay isOpen={isAccountOpen} onClose={() => setIsAccountOpen(false)} />
    </div>
  )
}
