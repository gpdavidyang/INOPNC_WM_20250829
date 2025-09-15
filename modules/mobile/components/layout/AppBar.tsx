'use client'

import React, { useState, useEffect } from 'react'
import { Menu, Moon, Sun, Search, Bell } from 'lucide-react'

interface AppBarProps {
  onMenuClick?: () => void
  onSearchClick?: () => void
}

export const AppBar: React.FC<AppBarProps> = ({ onMenuClick, onSearchClick }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal')
  const [notificationCount] = useState(3)

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = (localStorage.getItem('inopnc_theme') as 'light' | 'dark') || 'light'
    const savedFontSize =
      (localStorage.getItem('inopnc_font_size') as 'normal' | 'large') || 'normal'

    setTheme(savedTheme)
    setFontSize(savedFontSize)

    document.documentElement.setAttribute('data-theme', savedTheme)
    document.body.className = savedFontSize === 'normal' ? 'fs-100' : 'fs-150'
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('inopnc_theme', newTheme)
  }

  const toggleFontSize = (size: 'normal' | 'large') => {
    setFontSize(size)
    document.body.className = size === 'normal' ? 'fs-100' : 'fs-150'
    localStorage.setItem('inopnc_font_size', size)
  }

  return (
    <header className="appbar">
      <div className="bar">
        <div className="flex items-center gap-3">
          {/* Hamburger Menu */}
          <button id="btnHamburger" className="icon-btn" aria-label="메뉴" onClick={onMenuClick}>
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo */}
          <a href="/mobile" className="brand-logo tracking-tight" id="homeLink" title="홈으로 이동">
            <img src="/images/logo_n.png" alt="INOPNC" className="h-6" style={{ height: '24px' }} />
          </a>
        </div>

        <div className="actions flex items-center gap-2">
          {/* Font Size Switch */}
          <div className="fswitch" role="group" aria-label="글씨 크기">
            <button
              id="fsNormal"
              className={`fswitch-btn ${fontSize === 'normal' ? 'active' : ''}`}
              type="button"
              onClick={() => toggleFontSize('normal')}
            >
              일반
            </button>
            <button
              id="fsLarge"
              className={`fswitch-btn ${fontSize === 'large' ? 'active' : ''}`}
              type="button"
              onClick={() => toggleFontSize('large')}
            >
              확대
            </button>
          </div>

          {/* Dark Mode Toggle */}
          <button id="btnTheme" className="icon-btn" aria-label="다크모드" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Search */}
          <button id="btnSearch" className="icon-btn" aria-label="검색" onClick={onSearchClick}>
            <Search className="w-5 h-5" />
          </button>

          {/* Notifications */}
          <button
            className="notif relative"
            aria-label="알림"
            id="notificationBtn"
            style={{ width: '28px', height: '28px' }}
          >
            <img
              src="/images/bell.png"
              alt="알림"
              className="icon"
              style={{ width: '24px', height: '24px' }}
            />
            {notificationCount > 0 && (
              <span className="notification-badge" id="notificationBadge" aria-live="polite">
                {notificationCount}
              </span>
            )}
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
          gap: 8px;
        }

        .notif {
          position: relative;
          width: 28px;
          height: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          vertical-align: middle;
          line-height: 0;
          flex-shrink: 0;
          background: transparent;
          border: 0;
          padding: 0;
          border-radius: 8px;
          cursor: pointer;
        }

        .icon {
          height: 100%;
          width: 100%;
          object-fit: contain;
          flex-shrink: 0;
          display: block;
        }
      `}</style>
    </header>
  )
}
