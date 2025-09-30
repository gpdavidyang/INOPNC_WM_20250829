'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, Calculator, ClipboardList, Map, Folder } from 'lucide-react'

export const PartnerBottomNav: React.FC = () => {
  const pathname = usePathname()

  const navItems = [
    {
      route: 'home',
      label: '홈',
      href: '/mobile/partner',
      icon: Home,
    },
    {
      route: 'attendance',
      label: '출력정보',
      href: '/mobile/partner/output',
      icon: Calculator,
    },
    {
      route: 'worklog',
      label: '작업일지',
      href: '/mobile/worklog',
      icon: ClipboardList,
    },
    {
      route: 'sites',
      label: '현장정보',
      href: '/mobile/sites',
      icon: Map,
    },
    {
      route: 'docs',
      label: '문서함',
      href: '/mobile/documents',
      icon: Folder,
    },
  ]

  return (
    <nav className="bottom-nav-wrap">
      <div className="bottom-nav">
        <ul className="nav-list">
          {navItems.map(item => {
            const Icon = item.icon
            const isActive =
              pathname === item.href ||
              (item.href !== '/mobile/partner' && pathname?.startsWith(item.href))

            return (
              <li key={item.route} className="nav-item">
                <Link
                  href={item.href}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                  data-route={item.route}
                  prefetch={false}
                >
                  <span className="nav-ico">
                    <Icon className="nav-svg" />
                  </span>
                  <span className="nav-label">{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
