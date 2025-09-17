'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NotificationBadge } from '@/modules/shared/ui'

interface NavItem {
  id: string
  label: string
  icon: string
  href: string
  badge?: number
  roles: ('worker' | 'site_manager')[]
}

interface MobileNavProps {
  userRole: 'worker' | 'site_manager'
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'home',
    label: '홈',
    icon: 'home',
    href: '/mobile',
    roles: ['worker', 'site_manager'],
  },
  {
    id: 'worklog',
    label: '출력현황',
    icon: 'worklog',
    href: '/mobile/attendance/output',
    roles: ['worker', 'site_manager'],
  },
  {
    id: 'tasks',
    label: '작업일지',
    icon: 'tasks',
    href: '/mobile/tasks',
    roles: ['worker', 'site_manager'],
  },
  {
    id: 'sites',
    label: '현장정보',
    icon: 'sites',
    href: '/mobile/sites',
    roles: ['worker', 'site_manager'],
  },
  {
    id: 'documents',
    label: '문서함',
    icon: 'documents',
    href: '/mobile/documents',
    badge: 3,
    roles: ['worker', 'site_manager'],
  },
]

const getNavIcon = (iconType: string, isActive: boolean) => {
  const iconClass = `w-5 h-5 ${isActive ? 'text-[#2563eb]' : 'text-[#6b7280]'}`

  switch (iconType) {
    case 'home':
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={iconClass}
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9,22 9,12 15,12 15,22" />
        </svg>
      )
    case 'worklog':
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={iconClass}
        >
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
          <circle cx="12" cy="5" r="2" />
          <path d="M12 7v4" />
        </svg>
      )
    case 'tasks':
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={iconClass}
        >
          <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
          <path d="M9 22v-4h6v4" />
          <path d="M8 6h.01" />
          <path d="M16 6h.01" />
          <path d="M12 6h.01" />
          <path d="M12 10h.01" />
          <path d="M12 14h.01" />
          <path d="M16 10h.01" />
          <path d="M16 14h.01" />
          <path d="M8 10h.01" />
          <path d="M8 14h.01" />
        </svg>
      )
    case 'sites':
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={iconClass}
        >
          <polygon points="3 11 22 2 13 21 11 13 3 11" />
        </svg>
      )
    case 'documents':
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={iconClass}
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14,2 14,8 20,8" />
          <line x1="16" x2="8" y1="13" y2="13" />
          <line x1="16" x2="8" y1="17" y2="17" />
          <polyline points="10,9 9,9 8,9" />
        </svg>
      )
    default:
      return iconType
  }
}

export const MobileNav: React.FC<MobileNavProps> = ({ userRole }) => {
  const pathname = usePathname()

  const visibleItems = NAV_ITEMS.filter(item => item.roles.includes(userRole))

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e5e7eb] h-16 z-50">
      <ul className="flex h-full">
        {visibleItems.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <li key={item.id} className="flex-1">
              <Link
                href={item.href}
                className={`flex flex-col items-center justify-center h-full relative ${
                  isActive ? 'text-[#2563eb] font-medium' : 'text-[#6b7280]'
                }`}
                prefetch={false}
              >
                <div className="relative mb-1">
                  {getNavIcon(item.icon, isActive)}
                  {item.badge && item.badge > 0 && (
                    <NotificationBadge count={item.badge} className="absolute -top-1 -right-1" />
                  )}
                </div>
                <span className="text-xs">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
