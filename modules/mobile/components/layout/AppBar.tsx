'use client'

import { Button } from '@/modules/shared/ui'
import { Bell, FileCheck, Menu, Search } from 'lucide-react'
import React, { useCallback, useEffect, useState } from 'react'
import { NotificationModal } from '../notifications/NotificationModal'
// Drawer is now managed by MobileLayout, not AppBar
import { SearchPage } from './SearchPage'
// Switched to server API for unread count to align with notification_logs
import { useUnifiedAuth } from '@/hooks/use-unified-auth'
import { isNotificationHiddenToday } from '@/modules/mobile/lib/notification-preferences'
import { normalizeUserRole } from '@/lib/auth/roles'
import { useRouter } from 'next/navigation'

interface AppBarProps {
  onMenuClick?: () => void
  onSearchClick?: () => void
  /** Allows parent layouts to render the shared SearchPage overlay */
  renderInlineSearchPage?: boolean
  /** Storybook-only visual controls (safe defaults keep prod behavior) */
  titleText?: string
  showLabels?: boolean
  notificationCountOverride?: number
}

export const AppBar: React.FC<AppBarProps> = ({
  onMenuClick,
  onSearchClick,
  renderInlineSearchPage = true,
  titleText = 'INOPNC',
  showLabels = true,
  notificationCountOverride,
}) => {
  const [notificationCount, setNotificationCount] = useState(0)
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [notificationHiddenToday, setNotificationHiddenToday] = useState(false)
  const [hasAutoOpenedToday, setHasAutoOpenedToday] = useState(false)
  // Drawer state is now managed by MobileLayout
  const [showSearchPage, setShowSearchPage] = useState(false)
  const { user, profile } = useUnifiedAuth()
  const router = useRouter()
  // Font size is managed elsewhere for accessibility; header no longer exposes toggle

  // Fetch notification count function
  const fetchNotificationCount = useCallback(async () => {
    try {
      // Skip if no user session
      if (!user?.id) return setNotificationCount(0)

      const res = await fetch('/api/notifications/unread-count', { cache: 'no-store' })
      if (!res.ok) return setNotificationCount(0)
      const json = await res.json().catch(() => ({ count: 0 }))
      setNotificationCount(Number(json?.count || 0))
    } catch (error) {
      setNotificationCount(0)
    }
  }, [user?.id])

  // Initialize: Enforce Light Mode Always
  useEffect(() => {
    // Force light mode attributes
    document.documentElement.setAttribute('data-theme', 'light')
    document.documentElement.classList.remove('dark')
    document.documentElement.classList.add('light')

    // Clear legacy preferences if any
    localStorage.removeItem('inopnc_theme')

    setNotificationHiddenToday(isNotificationHiddenToday())
  }, [])

  // Fetch notification count
  useEffect(() => {
    if (user?.id) {
      fetchNotificationCount()
    }
  }, [user?.id, fetchNotificationCount])

  const displayCount =
    typeof notificationCountOverride === 'number' ? notificationCountOverride : notificationCount

  const isSiteManager = normalizeUserRole(profile?.role) === 'site_manager'

  const handleBrandClick = () => {
    const destination =
      profile?.role === 'production_manager'
        ? '/mobile/production/production'
        : profile?.role === 'customer_manager' || profile?.role === 'partner'
          ? '/mobile/partner'
          : '/mobile'

    window.location.href = destination
  }

  const handleNotificationButtonClick = () => {
    const hidden = isNotificationHiddenToday()
    setNotificationHiddenToday(hidden)
    // Manual open should bypass the per-day auto-hide so users can still read notifications
    setHasAutoOpenedToday(true)
    setShowNotificationModal(true)
  }

  // Auto-open the notification modal once per day if there are unread items and the user
  // has not opted out for the day. This covers the "오늘 하루 보지 않기" requirement.
  useEffect(() => {
    if (!user?.id) return
    if (showNotificationModal) return
    if (notificationHiddenToday) return
    if (hasAutoOpenedToday) return
    if (notificationCount <= 0) return

    setShowNotificationModal(true)
    setHasAutoOpenedToday(true)
  }, [
    hasAutoOpenedToday,
    notificationCount,
    notificationHiddenToday,
    showNotificationModal,
    user?.id,
  ])

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <button
            type="button"
            className="brand-logo"
            onClick={handleBrandClick}
            aria-label={`${titleText} 홈으로 이동`}
          >
            <span className="brand-wordmark" aria-hidden="true">
              INOPNC
            </span>
          </button>
        </div>

        <div className="header-center">{/* 중앙 영역은 비워둠 */}</div>

        <div className="header-right">
          {/* Search */}
          <Button
            variant="ghost"
            size="sm"
            className="header-icon-btn"
            id="searchBtn"
            aria-label="통합검색"
            onClick={() => {
              if (onSearchClick) {
                onSearchClick()
              } else if (renderInlineSearchPage) {
                setShowSearchPage(true)
              }
            }}
          >
            <Search className="appbar-icon" />
            {showLabels && <span className="icon-text">통합검색</span>}
          </Button>

          {/* Completion Certificate */}
          {isSiteManager ? (
            <Button
              variant="ghost"
              size="sm"
              className="header-icon-btn"
              id="certificateBtn"
              aria-label="확인서"
              onClick={() => router.push('/mobile/certificate')}
            >
              <FileCheck className="appbar-icon" />
              {showLabels && <span className="icon-text">확인서</span>}
            </Button>
          ) : null}

          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="header-icon-btn"
            id="notificationBtn"
            aria-label="알림"
            onClick={handleNotificationButtonClick}
          >
            <Bell className="appbar-icon" />
            {showLabels && <span className="icon-text">알림</span>}
            {notificationCount > 0 && (
              <span className="notification-badge" id="notificationBadge">
                {notificationCount}
              </span>
            )}
          </Button>

          {/* Menu */}
          <Button
            variant="ghost"
            size="sm"
            className="header-icon-btn"
            id="menuBtn"
            aria-label="내정보"
            onClick={() => {
              if (onMenuClick) {
                onMenuClick()
              }
              // Drawer is now controlled by MobileLayout
            }}
          >
            <Menu className="appbar-icon" />
            {showLabels && <span className="icon-text">내정보</span>}
          </Button>
        </div>
      </div>

      <style jsx>{`
        .brand-logo {
          border: none;
          background: transparent;
          padding: 0;
          display: inline-flex;
          align-items: center;
          justify-content: flex-start;
          cursor: pointer;
          transition: transform 0.2s ease;
          flex: 0 1 auto;
          max-width: 70vw;
        }

        .brand-logo:hover,
        .brand-logo:focus-visible {
          transform: translateY(-1px);
        }

        .brand-logo:focus-visible {
          outline: 2px solid #31a3fa;
          outline-offset: 3px;
          border-radius: 6px;
        }

        .brand-wordmark {
          font-family:
            'Poppins',
            'Inter',
            'Pretendard',
            'Noto Sans KR',
            system-ui,
            -apple-system,
            'Segoe UI',
            Roboto,
            sans-serif;
          font-weight: 700;
          font-size: 24px;
          line-height: 1;
          letter-spacing: 0.3px;
          color: #1a254f;
          text-transform: uppercase;
          -webkit-font-smoothing: antialiased;
          display: inline-block;
        }

        [data-theme='dark'] .brand-wordmark {
          color: #ffffff;
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

        /* Use global AppBar label tokens for consistent thickness with icon stroke */
        .icon-text {
          font-size: var(--appbar-label-size);
          font-weight: var(--appbar-label-weight);
          color: inherit; /* match icon color */
          line-height: 1;
          letter-spacing: -0.2px;
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
          setNotificationHiddenToday(isNotificationHiddenToday())
        }}
        userId={user?.id}
      />

      {/* Drawer is now rendered by MobileLayout */}

      {/* Search Page */}
      {renderInlineSearchPage ? (
        <SearchPage isOpen={showSearchPage} onClose={() => setShowSearchPage(false)} />
      ) : null}
    </header>
  )
}
