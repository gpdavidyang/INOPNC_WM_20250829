'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, Calculator, ClipboardList, Map, Folder, Factory, Truck } from 'lucide-react'
import { useUnifiedAuth } from '@/hooks/use-unified-auth'

export const BottomNav: React.FC = () => {
  const pathname = usePathname()
  const { profile } = useUnifiedAuth()
  const isPartner = profile?.role === 'customer_manager' || profile?.role === 'partner'

  // 생산관리자 전용 하단 내비게이션 (문서 정의: 주문요청 조회 / 생산정보 관리 / 출고·배송·결제 관리)
  const navItems =
    profile?.role === 'production_manager'
      ? [
          {
            route: 'pm-requests',
            label: '주문요청',
            href: '/mobile/production/requests',
            icon: ClipboardList,
          },
          {
            route: 'pm-production',
            label: '생산정보',
            href: '/mobile/production/production',
            icon: Factory,
          },
          {
            route: 'pm-shipping',
            label: '출고배송',
            href: '/mobile/production/shipping-payment',
            icon: Truck,
          },
        ]
      : [
          {
            route: 'home',
            label: '홈',
            href: isPartner ? '/mobile/partner' : '/mobile',
            icon: Home,
          },
          {
            route: 'attendance',
            label: '출력정보',
            href: '/mobile/attendance',
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
              pathname === item.href || (item.href !== '/mobile' && pathname?.startsWith(item.href))

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
