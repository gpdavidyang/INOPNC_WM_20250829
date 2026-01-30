import React, { useState, lazy, Suspense, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Header } from './components/Header'
import { BottomNav } from './components/BottomNav'
import { GlobalSearch } from './components/GlobalSearch'
import { CertificateModal } from './components/CertificateModal'
import { NotificationPanel } from './components/NotificationPanel'
import { MenuPanel } from './components/MenuPanel'
import { AccountOverlay } from './components/AccountOverlay'
import { searchService } from './services/searchService'
import { HeaderNotificationItem } from './types'

// Lazy loading으로 페이지 컴포넌트 import
const MainPage = lazy(() => import('./pages/MainPage').then(m => ({ default: m.MainPage })))
const WorklogPage = lazy(() => import('./pages/WorklogPage'))
const WorklogList = lazy(() => import('./pages/WorklogList'))
const DocPage = lazy(() => import('./pages/DocPage').then(m => ({ default: m.DocPage })))
const SitePage = lazy(() => import('./pages/SitePage').then(m => ({ default: m.SitePage })))
const MoneyPage = lazy(() => import('./pages/MoneyPage'))

// 로딩 컴포넌트
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-[var(--bg-body)] text-[var(--text-main)] transition-colors duration-300">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-text-sub">로딩 중...</p>
    </div>
  </div>
)

const AppContent: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isCertModalOpen, setIsCertModalOpen] = useState(false)
  const [isNotiOpen, setIsNotiOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAccountOpen, setIsAccountOpen] = useState(false)

  // Notification State
  const [notifications, setNotifications] = useState<HeaderNotificationItem[]>([
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

  // Initialize Search Service on mount
  useEffect(() => {
    searchService.loadMockData()
    console.log('Search Index Initialized')

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
    <div className="min-h-screen pb-[100px] pt-[60px] max-w-[600px] mx-auto bg-[var(--bg-body)] text-[var(--text-main)] relative shadow-2xl transition-colors duration-300">
      <Header
        onSearchClick={() => setIsSearchOpen(true)}
        onCertClick={() => setIsCertModalOpen(true)}
        unreadCount={unreadCount}
        onNotificationClick={() => {
          setIsNotiOpen(true)
          setIsMenuOpen(false)
          setIsAccountOpen(false)
        }}
        onMenuClick={() => {
          setIsMenuOpen(true)
          setIsNotiOpen(false)
          setIsAccountOpen(false)
        }}
      />

      {/* 페이지 라우팅 with Suspense */}
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/main" element={<MainPage />} />
          <Route path="/money" element={<MoneyPage />} />
          <Route path="/worklog" element={<WorklogList />} />
          <Route path="/site" element={<SitePage />} />
          <Route path="/doc" element={<DocPage />} />
          <Route path="/worklog-form" element={<WorklogPage />} />
        </Routes>
      </Suspense>

      <BottomNav />

      {/* Global Search Overlay */}
      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Certificate Modal */}
      <CertificateModal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        onHeaderReset={() => {
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

export const App: React.FC = () => {
  return <AppContent />
}

export default App
