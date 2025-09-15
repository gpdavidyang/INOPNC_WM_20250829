'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, FileText, Edit3, MapPin, FolderOpen } from 'lucide-react'

export const BottomNav: React.FC = () => {
  const pathname = usePathname()

  const navItems = [
    {
      label: '홈',
      href: '/mobile',
      icon: Home,
    },
    {
      label: '출력현황',
      href: '/mobile/worklog',
      icon: FileText,
    },
    {
      label: '작업일지',
      href: '/mobile/tasks',
      icon: Edit3,
    },
    {
      label: '현장정보',
      href: '/mobile/sites',
      icon: MapPin,
    },
    {
      label: '문서함',
      href: '/mobile/documents',
      icon: FolderOpen,
    },
  ]

  return (
    <nav className="bottom-nav">
      <ul className="bottom-nav-list">
        {navItems.map((item, index) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href || (item.href !== '/mobile' && pathname?.startsWith(item.href))

          return (
            <li key={index} className="bottom-nav-item">
              <Link href={item.href} className={`bottom-nav-link ${isActive ? 'active' : ''}`}>
                <Icon className="bottom-nav-icon" />
                <span className="text-xs">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>

      <style jsx>{`
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: var(--nav-bg);
          border-top: 1px solid var(--nav-border);
          height: var(--nav-h);
          z-index: 90;
        }

        .bottom-nav-list {
          display: flex;
          height: 100%;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .bottom-nav-item {
          flex: 1;
        }

        :global(.bottom-nav-link) {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--nav-text);
          text-decoration: none;
          font-size: 12px;
          font-weight: 500;
          transition: color 0.2s ease;
        }

        :global(.bottom-nav-link.active) {
          color: var(--nav-text-active);
        }

        :global(.bottom-nav-icon) {
          width: 20px;
          height: 20px;
          margin-bottom: 4px;
          stroke-width: 2;
        }
      `}</style>
    </nav>
  )
}
