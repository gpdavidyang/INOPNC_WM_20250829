import React, { useEffect, useState } from 'react'
import { Header } from './components/Header'
import { BottomNav } from './components/BottomNav'
import { GlobalSearch } from './components/GlobalSearch'
import { CertificateModal } from './components/CertificateModal'
import { NotificationPanel } from './components/NotificationPanel'
import { MenuPanel } from './components/MenuPanel'
import { AccountOverlay } from './components/AccountOverlay'
import { searchService } from './services/searchService'
import { NotificationItem } from './types'

function App() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isCertModalOpen, setIsCertModalOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAccountOpen, setIsAccountOpen] = useState(false)

  // Notification State
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

  // Initialize Search Service & Theme on mount
  useEffect(() => {
    searchService.loadMockData()
    console.log('Search Index Initialized')

    // Theme Initialization
    const savedTheme = localStorage.getItem('theme')
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const rootElement = document.getElementById('inopnc-i3-root')

    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setIsDarkMode(true)
      rootElement?.classList.add('dark-mode', 'dark')
    } else {
      setIsDarkMode(false)
      rootElement?.classList.remove('dark-mode', 'dark')
    }

    // 1. Keyboard Shortcut (Ctrl/Cmd + K)
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsSearchOpen(true)
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [])

  const toggleTheme = () => {
    const rootElement = document.getElementById('inopnc-i3-root')
    if (isDarkMode) {
      rootElement?.classList.remove('dark-mode', 'dark')
      localStorage.setItem('theme', 'light')
      setIsDarkMode(false)
    } else {
      rootElement?.classList.add('dark-mode', 'dark')
      localStorage.setItem('theme', 'dark')
      setIsDarkMode(true)
    }
  }

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })))
  }

  const unreadCount = notifications.filter(n => n.unread).length

  return (
    <div
      id="inopnc-i3-root"
      className="min-h-screen pb-[100px] pt-[60px] max-w-[600px] mx-auto bg-[#f2f4f6] dark:bg-[#0f172a] relative shadow-2xl transition-colors duration-300"
    >
      <Header
        onSearchClick={() => setIsSearchOpen(true)}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        onCertClick={() => setIsCertModalOpen(true)}
        unreadCount={unreadCount}
        onNotificationClick={() => setIsNotiOpen(true)}
        onMenuClick={() => setIsMenuOpen(true)}
      />

      <main className="p-5">
        {/* Mock Content to replicate the dashboard look */}
        <div className="mb-6 bg-white dark:bg-[#1e293b] rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-colors duration-300">
          <h2 className="text-[20px] font-bold text-[#1a254f] dark:text-white mb-2">
            현장 사진 대지
          </h2>
          <p className="text-[16px] text-[#475569] dark:text-[#94a3b8] leading-relaxed">
            금일 작업한 현장의 사진을 업로드하고 관리하는 공간입니다.
            <br />
            <strong>통합검색</strong> (Ctrl+K)을 통해 빠르게 접근할 수 있습니다.
          </p>
          <button
            onClick={() => setIsSearchOpen(true)}
            className="mt-4 w-full h-[50px] bg-[#f1f5f9] dark:bg-[#334155] text-[#475569] dark:text-white font-bold rounded-xl border border-[#e2e8f0] dark:border-[#475569] active:scale-[0.98] transition-all hover:border-[#31a3fa] dark:hover:border-[#31a3fa]"
          >
            검색창 열기
          </button>
        </div>

        <div className="mb-6 bg-white dark:bg-[#1e293b] rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-colors duration-300">
          <h2 className="text-[20px] font-bold text-[#1a254f] dark:text-white mb-2">작업 일지</h2>
          <p className="text-[16px] text-[#475569] dark:text-[#94a3b8] leading-relaxed">
            오늘의 투입 인력, 장비, 자재 내역을 기록합니다.
          </p>
        </div>

        <div className="flex justify-center text-[#94a3b8] dark:text-[#64748b] text-sm mt-10">
          <p>Press Ctrl + K to Search</p>
        </div>
      </main>

      <BottomNav />

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

export default App
