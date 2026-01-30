import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime'
import { useState, useEffect } from 'react'
import { Header } from '../Header'
import { BottomNav } from '../BottomNav'
import { GlobalSearch } from '../../navigation/GlobalSearch'
import { CertificateModal } from '../../features/CertificateModal'
import { NotificationPanel } from '../../overlay/NotificationPanel'
import { MenuPanel } from '../../navigation/MenuPanel'
import { AccountOverlay } from '../../overlay/AccountOverlay'
import { searchService } from '../../../services/searchService'
export const MainLayout = ({ children, title = 'INOPNC', currentApp }) => {
  // State: Navigation Features
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isCertModalOpen, setIsCertModalOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const [isNotiOpen, setIsNotiOpen] = useState(false)
  const [notifications, setNotifications] = useState([
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
      document.documentElement.classList.add('dark')
      rootElement?.classList.add('dark-mode')
    } else {
      setIsDarkMode(false)
      document.documentElement.classList.remove('dark')
      rootElement?.classList.remove('dark-mode')
    }
    // Keyboard Shortcut (Ctrl/Cmd + K)
    const handleGlobalKeyDown = e => {
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
      document.documentElement.classList.remove('dark')
      rootElement?.classList.remove('dark-mode')
      localStorage.setItem('theme', 'light')
      setIsDarkMode(false)
    } else {
      document.documentElement.classList.add('dark')
      rootElement?.classList.add('dark-mode')
      localStorage.setItem('theme', 'dark')
      setIsDarkMode(true)
    }
  }
  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })))
  }
  const unreadCount = notifications.filter(n => n.unread).length
  return _jsxs('div', {
    id: 'inopnc-i3-root',
    className:
      'min-h-screen pb-[100px] pt-[60px] max-w-[600px] mx-auto relative shadow-2xl transition-colors duration-300',
    style: { backgroundColor: 'var(--bg-body)' },
    children: [
      _jsx(Header, {
        onSearchClick: () => setIsSearchOpen(true),
        isDarkMode: isDarkMode,
        toggleTheme: toggleTheme,
        onCertClick: () => setIsCertModalOpen(true),
        unreadCount: unreadCount,
        onNotificationClick: () => setIsNotiOpen(true),
        onMenuClick: () => setIsMenuOpen(true),
        title: title,
      }),
      _jsx('main', { className: 'p-5', children: children }),
      _jsx(BottomNav, { currentApp: currentApp }),
      _jsx(GlobalSearch, { isOpen: isSearchOpen, onClose: () => setIsSearchOpen(false) }),
      _jsx(CertificateModal, {
        isOpen: isCertModalOpen,
        onClose: () => setIsCertModalOpen(false),
        onHeaderReset: () => {
          // 헤더 초기 상태로 복원
          // 모든 모달/패널 닫기
          setIsSearchOpen(false)
          setIsNotiOpen(false)
          setIsMenuOpen(false)
          setIsAccountOpen(false)
        },
      }),
      _jsx(NotificationPanel, {
        isOpen: isNotiOpen,
        onClose: () => setIsNotiOpen(false),
        notifications: notifications,
        onMarkAllRead: markAllNotificationsRead,
      }),
      _jsx(MenuPanel, {
        isOpen: isMenuOpen,
        onClose: () => setIsMenuOpen(false),
        onOpenAccount: () => setIsAccountOpen(true),
      }),
      _jsx(AccountOverlay, { isOpen: isAccountOpen, onClose: () => setIsAccountOpen(false) }),
    ],
  })
}
