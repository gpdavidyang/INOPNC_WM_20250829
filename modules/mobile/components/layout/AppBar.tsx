'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Search, Moon, Sun, Type, Bell, Menu } from 'lucide-react'
import { NotificationModal } from '../notifications/NotificationModal'
// Drawer is now managed by MobileLayout, not AppBar
import { SearchPage } from './SearchPage'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'

interface AppBarProps {
  onMenuClick?: () => void
  onSearchClick?: () => void
}

export const AppBar: React.FC<AppBarProps> = ({ onMenuClick, onSearchClick }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal')
  const [notificationCount, setNotificationCount] = useState(0)
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  // Drawer state is now managed by MobileLayout
  const [showSearchPage, setShowSearchPage] = useState(false)
  const { user } = useUser()
  const supabase = createClient()

  // Fetch notification count function
  const fetchNotificationCount = useCallback(async () => {
    try {
      // Skip notifications fetch if no user
      if (!user?.id) {
        setNotificationCount(0)
        return
      }

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .eq('is_read', false)

      if (error) {
        // Handle specific API errors silently
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          // Table doesn't exist, set count to 0
          setNotificationCount(0)
        } else {
          // Other errors, use fallback
          console.warn('Notifications API unavailable:', error.message)
          setNotificationCount(0)
        }
      } else {
        setNotificationCount(count || 0)
      }
    } catch (error) {
      // Network or other errors - fail silently with 0 count
      console.warn('Failed to fetch notification count:', error)
      setNotificationCount(0)
    }
  }, [supabase, user?.id])

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = (localStorage.getItem('inopnc_theme') as 'light' | 'dark') || 'light'
    const savedFontSize =
      (localStorage.getItem('inopnc_font_size') as 'normal' | 'large') || 'normal'

    setTheme(savedTheme)
    setFontSize(savedFontSize)

    document.documentElement.setAttribute('data-theme', savedTheme)

    // Apply font size class to main content container instead of body
    const mainContainer = document.querySelector('main.container')
    if (mainContainer) {
      mainContainer.classList.remove('fs-100', 'fs-150')
      mainContainer.classList.add(savedFontSize === 'normal' ? 'fs-100' : 'fs-150')
    }
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
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('inopnc_theme', newTheme)
  }

  const toggleFontSize = () => {
    const newSize = fontSize === 'normal' ? 'large' : 'normal'
    setFontSize(newSize)

    // Apply font size class to main content container instead of body
    const mainContainer = document.querySelector('main.container')
    if (mainContainer) {
      mainContainer.classList.remove('fs-100', 'fs-150')
      mainContainer.classList.add(newSize === 'normal' ? 'fs-100' : 'fs-150')
    }

    localStorage.setItem('inopnc_font_size', newSize)
  }

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <h1 className="brand-title" onClick={() => (window.location.href = '/mobile')}>
            INOPNC
          </h1>
        </div>

        <div className="header-center">{/* 중앙 영역은 비워둠 */}</div>

        <div className="header-right">
          {/* Search */}
          <button
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
            <span className="icon-text">검색</span>
          </button>

          {/* Dark Mode */}
          <button
            className="header-icon-btn"
            id="darkModeBtn"
            aria-label="다크모드"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            <span className="icon-text">다크모드</span>
          </button>

          {/* Font Size */}
          <button
            className="header-icon-btn"
            id="fontSizeBtn"
            aria-label="글씨 크기"
            onClick={toggleFontSize}
          >
            <Type className="w-5 h-5" />
            <span className="icon-text" id="fontSizeText">
              {fontSize === 'normal' ? '작은글씨' : '큰글씨'}
            </span>
          </button>

          {/* Notifications */}
          <button
            className="header-icon-btn"
            id="notificationBtn"
            aria-label="알림"
            onClick={() => setShowNotificationModal(true)}
          >
            <Bell className="w-5 h-5" />
            <span className="icon-text">알림</span>
            {notificationCount > 0 && (
              <span className="notification-badge" id="notificationBadge">
                {notificationCount}
              </span>
            )}
          </button>

          {/* Menu */}
          <button
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
            <span className="icon-text">메뉴</span>
          </button>
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
