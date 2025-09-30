'use client'

import React from 'react'
import { usePathname } from 'next/navigation'

interface NavItem {
  label: string
  href: string
  icon: string
  isActive?: boolean
}

export const MobileBottomNav: React.FC = () => {
  const pathname = usePathname()

  const navItems: NavItem[] = [
    { label: '홈', href: '/mobile', icon: 'home' },
    { label: '출근', href: '/mobile/attendance', icon: 'clock' },
    { label: '작업일지', href: '/mobile/worklog', icon: 'clipboard' },
    { label: '현장정보', href: '/mobile/sites', icon: 'map' },
    { label: '문서함', href: '/mobile/documents', icon: 'folder' },
  ]

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'home':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
        )
      case 'clock':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )
      case 'clipboard':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
        )
      case 'map':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
        )
      case 'folder':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
        )
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        )
    }
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 h-16 border-t bg-white dark:bg-[#11151b] border-gray-200 dark:border-gray-700">
      <div className="max-w-4xl mx-auto h-full">
        <ul className="flex items-center justify-around h-full px-2">
          {navItems.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

            return (
              <li key={item.href} className="flex-1">
                <a
                  href={item.href}
                  className={`
                    flex flex-col items-center justify-center h-full px-2 py-1 transition-colors
                    ${isActive ? 'text-[var(--nav-text-active)]' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}
                  `}
                >
                  <span className="nav-ico mb-1">{getIcon(item.icon)}</span>
                  <span className="text-xs font-medium nav-label">{item.label}</span>
                </a>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}

export default MobileBottomNav
