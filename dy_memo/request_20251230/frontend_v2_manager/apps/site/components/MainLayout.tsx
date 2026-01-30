import React, { useState, useEffect } from 'react'
import { Header } from './Header'
import { BottomNav } from './BottomNav'
import { GlobalSearch } from './GlobalSearch'
import { CertificateModal } from './CertificateModal'
import { NotificationPanel } from './NotificationPanel'
import { MenuPanel } from './MenuPanel'
import { AccountOverlay } from './AccountOverlay'
import { searchService } from '@inopnc/shared/services/searchService'
import { NotificationItem } from '@inopnc/shared/types'

interface MainLayoutProps {
  children: React.ReactNode
  title?: string
  isDarkMode?: boolean
  toggleTheme?: () => void
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  title = 'INOPNC',
  isDarkMode: propIsDarkMode,
  toggleTheme: propToggleTheme,
}) => {
  // State: Navigation Features
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isCertModalOpen, setIsCertModalOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const [isNotiOpen, setIsNotiOpen] = useState(false)

  // 내부 테마 토글 함수
  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark', 'dark-mode')
      localStorage.setItem('theme', 'light')
      setIsDarkMode(false)
    } else {
      document.documentElement.classList.add('dark', 'dark-mode')
      localStorage.setItem('theme', 'dark')
      setIsDarkMode(true)
    }
  }

  // props로 테마 상태가 전달되면 사용, 아니면 내부 상태 사용
  const finalIsDarkMode = propIsDarkMode !== undefined ? propIsDarkMode : isDarkMode
  const finalToggleTheme = propToggleTheme !== undefined ? propToggleTheme : toggleTheme
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

  // Initialize Search Service & Theme on mount
  useEffect(() => {
    searchService.loadMockData()
    console.log('Search Index Initialized')

    // Theme Initialization
    const savedTheme = localStorage.getItem('theme')
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark', 'dark-mode')
    } else {
      setIsDarkMode(false)
      document.documentElement.classList.remove('dark', 'dark-mode')
    }

    // Keyboard Shortcut (Ctrl/Cmd + K)
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsSearchOpen(true)
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [])

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })))
  }

  const unreadCount = notifications.filter(n => n.unread).length

  return (
    <div className="min-h-screen max-w-[600px] mx-auto bg-[var(--bg-body)] relative shadow-2xl transition-colors duration-300">
      <main className="px-5 pt-0">{children}</main>

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
