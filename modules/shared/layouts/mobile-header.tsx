'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/modules/shared/ui'

interface MobileHeaderProps {
  title?: string
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ title = 'INOPNC' }) => {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal')
  const [notificationCount, setNotificationCount] = useState(3)

  useEffect(() => {
    try {
      const saved = (localStorage.getItem('inopnc_theme') as 'light' | 'dark') || null
      const resolved =
        saved ??
        (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light')
      document.documentElement.setAttribute('data-theme', resolved)
      document.documentElement.classList.toggle('dark', resolved === 'dark')
      setIsDarkMode(resolved === 'dark')
    } catch (_) {
      // ignore
    }
  }, [])

  const toggleDarkMode = () => {
    const next = !isDarkMode
    setIsDarkMode(next)
    const newTheme = next ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', newTheme)
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('inopnc_theme', newTheme)
    } catch (_) {
      // ignore persistence errors (e.g., private mode/quota)
    }
  }

  const toggleFontSize = (size: 'normal' | 'large') => {
    setFontSize(size)
    document.body.classList.toggle('fs-150', size === 'large')
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-card border-b border-line">
      <div className="max-w-4xl mx-auto h-full flex items-center justify-between px-3">
        {/* 왼쪽 영역 */}
        <div className="flex items-center gap-3">
          <button className="icon-btn p-2" aria-label="메뉴">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <a href="/home" className="flex items-center">
            <img
              src="https://postfiles.pstatic.net/MjAyNTA5MTBfMjk3/MDAxNzU3NDc4ODkwMTc3.lBcKNGpQIyCk5kkAruIKUApO23ml-EJeX7da8626bQQg.oMA0TTp0F8nLP6ICPLrGelEJMVNg6cS5fdLUsXBb7pUg.PNG/00_%EB%A1%9C%EA%B3%A0-%EC%84%B8%EB%A1%9C%EC%A1%B0%ED%95%A9_n.png?type=w3840"
              alt="INOPNC"
              className="h-6 w-auto"
              loading="lazy"
            />
          </a>
        </div>

        {/* 오른쪽 액션들 */}
        <div className="flex items-center gap-2">
          {/* 글씨 크기 스위치 */}
          <div className="flex bg-gray-100 rounded-lg p-1" role="group" aria-label="글씨 크기">
            <button
              className={`px-2 py-1 text-xs rounded transition-colors ${
                fontSize === 'normal' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'
              }`}
              onClick={() => toggleFontSize('normal')}
            >
              일반
            </button>
            <button
              className={`px-2 py-1 text-xs rounded transition-colors ${
                fontSize === 'large' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'
              }`}
              onClick={() => toggleFontSize('large')}
            >
              확대
            </button>
          </div>

          {/* 다크모드 토글 */}
          <button className="icon-btn p-2" aria-label="다크모드" onClick={toggleDarkMode}>
            {isDarkMode ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>

          {/* 검색 버튼 */}
          <button className="icon-btn p-2" aria-label="검색">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>

          {/* 알림 버튼 */}
          <button className="icon-btn p-2 relative" aria-label="알림">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-5 5v-5zM11 13h2l3-3h-6l1 3z"
              />
            </svg>
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                {notificationCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
