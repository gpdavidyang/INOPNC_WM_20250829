'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Search, Moon, Sun, Type, Bell, Menu } from 'lucide-react'
import { Button } from '@/modules/shared/ui'
import { NotificationModal } from '../notifications/NotificationModal'
// Drawer is now managed by MobileLayout, not AppBar
import { SearchPage } from './SearchPage'
// Switched to server API for unread count to align with notification_logs
import { useUser } from '@/hooks/use-user'
import { useUnifiedAuth } from '@/hooks/use-unified-auth'
import { useFontSize } from '@/contexts/FontSizeContext'

interface AppBarProps {
  onMenuClick?: () => void
  onSearchClick?: () => void
  /** Storybook-only visual controls (safe defaults keep prod behavior) */
  titleText?: string
  showLabels?: boolean
  notificationCountOverride?: number
}

export const AppBar: React.FC<AppBarProps> = ({
  onMenuClick,
  onSearchClick,
  titleText = 'INOPNC',
  showLabels = true,
  notificationCountOverride,
}) => {
  // Centralized theme control (syncs data-theme + .dark class)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [notificationCount, setNotificationCount] = useState(0)
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  // Drawer state is now managed by MobileLayout
  const [showSearchPage, setShowSearchPage] = useState(false)
  const { user } = useUser()
  const { profile } = useUnifiedAuth()
  const { isLargeFont, toggleFontSize } = useFontSize()

  // Fetch notification count function
  const fetchNotificationCount = useCallback(async () => {
    try {
      // Skip if no user session (API infers from cookies, but avoid unnecessary calls)
      if (!user?.id) return setNotificationCount(0)

      const res = await fetch('/api/notifications/unread-count', { cache: 'no-store' })
      if (!res.ok) return setNotificationCount(0)
      const json = await res.json().catch(() => ({ count: 0 }))
      setNotificationCount(Number(json?.count || 0))
    } catch (error) {
      // Fail silently
      setNotificationCount(0)
    }
  }, [user?.id])

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = (localStorage.getItem('inopnc_theme') as 'light' | 'dark') || 'light'
    setTheme(savedTheme)
    document.documentElement.setAttribute('data-theme', savedTheme)
    document.documentElement.classList.toggle('dark', savedTheme === 'dark')
  }, [])

  // Fetch notification count
  useEffect(() => {
    if (user?.id) {
      fetchNotificationCount()
    }
  }, [user?.id, fetchNotificationCount])

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    try {
      document.documentElement.setAttribute('data-theme', newTheme)
      document.documentElement.classList.toggle('dark', newTheme === 'dark')
      localStorage.setItem('inopnc_theme', newTheme)
    } catch (_) {
      /* ignore */
    }
  }

  // Font size toggle is handled by FontSizeContext (applies .large-font-mode)

  const displayCount =
    typeof notificationCountOverride === 'number' ? notificationCountOverride : notificationCount

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <h1
            className="brand-title"
            onClick={() =>
              (window.location.href =
                profile?.role === 'production_manager'
                  ? '/mobile/production'
                  : profile?.role === 'customer_manager' || profile?.role === 'partner'
                    ? '/mobile/partner'
                    : '/mobile')
            }
          >
            {titleText}
          </h1>
        </div>

        <div className="header-center">{/* 중앙 영역은 비워둠 */}</div>

        <div className="header-right">
          {/* Search */}
          <Button
            variant="ghost"
            size="sm"
            className="header-icon-btn"
            id="searchBtn"
            aria-label="검색"
            onClick={() => {
              if (onSearchClick) {
                onSearchClick()
              } else {
                setShowSearchPage(true)
              }
            }}
          >
            <Search className="w-5 h-5" />
            {showLabels && <span className="icon-text">검색</span>}
          </Button>

          {/* Dark Mode */}
          <Button
            variant="ghost"
            size="sm"
            className="header-icon-btn"
            id="darkModeBtn"
            aria-label="다크모드"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {showLabels && <span className="icon-text">다크모드</span>}
          </Button>

          {/* Font Size */}
          <Button
            variant="ghost"
            size="sm"
            className="header-icon-btn"
            id="fontSizeBtn"
            aria-label="글씨 크기"
            onClick={toggleFontSize}
          >
            <Type className="w-5 h-5" />
            {showLabels && (
              <span className="icon-text" id="fontSizeText">
                {isLargeFont ? '큰글씨' : '작은글씨'}
              </span>
            )}
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="header-icon-btn"
            id="notificationBtn"
            aria-label="알림"
            onClick={() => setShowNotificationModal(true)}
          >
            <Bell className="w-5 h-5" />
            {showLabels && <span className="icon-text">알림</span>}
            {displayCount > 0 && (
              <span className="notification-badge" id="notificationBadge">
                {displayCount}
              </span>
            )}
          </Button>

          {/* Menu */}
          <Button
            variant="ghost"
            size="sm"
            className="header-icon-btn"
            id="menuBtn"
            aria-label="메뉴"
            onClick={() => {
              if (onMenuClick) {
                onMenuClick()
              }
              // Drawer is now controlled by MobileLayout
            }}
          >
            <Menu className="w-5 h-5" />
            {showLabels && <span className="icon-text">메뉴</span>}
          </Button>
        </div>
      </div>

      <style jsx>{`
        .brand-logo {
          font-family:
            'Poppins',
            'Inter',
            'Pretendard',
            'Noto Sans KR',
            system-ui,
            -apple-system,
            Segoe UI,
            Roboto,
            sans-serif;
          font-weight: 800;
          font-size: 20px;
          line-height: 1;
          letter-spacing: 0.2px;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
          color: var(--text);
          text-decoration: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          flex-shrink: 0;
        }

        .actions {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .icon-btn-with-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          padding: 4px;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 42px;
          gap: 2px;
        }

        .icon-btn-with-label:hover {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 8px;
        }

        [data-theme='dark'] .icon-btn-with-label:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .icon-img {
          width: 20px;
          height: 20px;
          stroke-width: 2;
          color: var(--text);
        }

        .icon-text {
          font-size: 18px;
          font-weight: 900;
          color: var(--text);
          line-height: 1;
        }

        .icon-label {
          font-size: 10px;
          font-weight: 700;
          color: var(--text);
          margin-top: 2px;
          white-space: nowrap;
        }

        .notif-btn {
          position: relative;
        }

        .notif-icon-wrapper {
          position: relative;
          width: 20px;
          height: 20px;
        }

        .notification-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #ea3829;
          color: white;
          font-size: 10px;
          font-weight: bold;
          padding: 1px 4px;
          border-radius: 10px;
          min-width: 16px;
          text-align: center;
        }
      `}</style>

      {/* Notification Modal */}
      <NotificationModal
        isOpen={showNotificationModal}
        onClose={() => {
          setShowNotificationModal(false)
          fetchNotificationCount() // Refresh count after closing
        }}
        userId={user?.id}
      />

      {/* Drawer is now rendered by MobileLayout */}

      {/* Search Page */}
      <SearchPage isOpen={showSearchPage} onClose={() => setShowSearchPage(false)} />
    </header>
  )
}
