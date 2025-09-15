'use client'

import React from 'react'
import Link from 'next/link'

const quickMenuItems = [
  {
    href: '/mobile/worklog',
    icon: '/images/report.png',
    label: '출력현황',
  },
  {
    href: '/mobile/tasks',
    icon: '/images/memo.png',
    label: '작업일지',
  },
  {
    href: '/mobile/sites',
    icon: '/images/map.png',
    label: '현장정보',
  },
  {
    href: '/mobile/documents',
    icon: '/images/doc.png',
    label: '문서함',
  },
  {
    href: '/mobile/requests',
    icon: '/images/request.png',
    label: '본사요청',
  },
  {
    href: '/mobile/materials',
    icon: '/images/stock.png',
    label: '재고관리',
  },
]

export const QuickMenu: React.FC = () => {
  return (
    <section className="section mb-3.5">
      <div className="flex items-center gap-2 mb-3">
        <img
          src="/images/Flash.png"
          alt=""
          className="w-4 h-4"
          style={{ width: '16px', height: '16px' }}
        />
        <h3 className="section-title">빠른메뉴</h3>
      </div>
      <ul className="quick-grid">
        {quickMenuItems.map((item, index) => (
          <li key={index}>
            <Link href={item.href} className="quick-item">
              <img
                className="qm-icon"
                src={item.icon}
                width="64"
                height="64"
                alt={item.label}
                decoding="async"
                loading="lazy"
              />
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
