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
    id: 'dashboard',
    label: '홈',
    icon: '🏠',
    href: '/mobile',
    roles: ['worker', 'site_manager'],
  },
  {
    id: 'attendance',
    label: '출근',
    icon: '📋',
    href: '/mobile/attendance',
    roles: ['worker', 'site_manager'],
  },
  {
    id: 'daily-reports',
    label: '일보',
    icon: '📝',
    href: '/mobile/daily-reports',
    roles: ['site_manager'],
  },
  {
    id: 'materials',
    label: '자재',
    icon: '📦',
    href: '/mobile/materials',
    roles: ['worker', 'site_manager'],
  },
  {
    id: 'notifications',
    label: '알림',
    icon: '🔔',
    href: '/mobile/notifications',
    badge: 0,
    roles: ['worker', 'site_manager'],
  },
  {
    id: 'documents',
    label: '문서함',
    icon: '📄',
    href: '/mobile/documents',
    roles: ['worker', 'site_manager'],
  },
]

export const MobileNav: React.FC<MobileNavProps> = ({ userRole }) => {
  const pathname = usePathname()

  const visibleItems = NAV_ITEMS.filter(item => item.roles.includes(userRole))

  return (
    <nav className="mobile-nav">
      <div className="mobile-nav-content">
        {visibleItems.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
            >
              <div className="mobile-nav-icon">
                {item.icon}
                {item.badge && item.badge > 0 && (
                  <NotificationBadge count={item.badge} className="absolute -top-1 -right-1" />
                )}
              </div>
              <span className="mobile-nav-label">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

// CSS styles to add to design system
const mobileNavStyles = `
.mobile-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: var(--card);
  border-top: 1px solid var(--line);
  z-index: 50;
}

.mobile-nav-content {
  display: flex;
  height: 100%;
  padding: 0 4px;
}

.mobile-nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 4px;
  border-radius: 8px;
  color: var(--muted);
  text-decoration: none;
  transition: all 0.2s ease;
  position: relative;
}

.mobile-nav-item:hover {
  color: var(--text);
  background: var(--tag-blue-20);
}

.mobile-nav-item.active {
  color: var(--accent);
  background: var(--tag-blue-20);
}

.mobile-nav-icon {
  position: relative;
  font-size: 20px;
  line-height: 1;
}

.mobile-nav-label {
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
}
`
