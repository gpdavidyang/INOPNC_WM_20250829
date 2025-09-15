'use client'

import React from 'react'
import Link from 'next/link'

const quickMenuItems = [
  {
    href: '/mobile/worklog',
    icon: '/icons/output-status.svg',
    label: '출력현황',
  },
  {
    href: '/mobile/tasks',
    icon: '/icons/report.png',
    label: '작업일지',
  },
  {
    href: '/mobile/sites',
    icon: '/icons/site-info.svg',
    label: '현장정보',
  },
  {
    href: '/mobile/documents',
    icon: '/icons/documents.svg',
    label: '문서함',
  },
  {
    href: '/mobile/requests',
    icon: '/icons/headquarters-request.svg',
    label: '본사요청',
  },
  {
    href: '/mobile/materials',
    icon: '/icons/inventory.svg',
    label: '재고관리',
  },
]

export const QuickMenu: React.FC = () => {
  return (
    <section className="section" id="home-quick" style={{ marginTop: '-30px' }}>
      <div className="section-header">
        <img
          src="/icons/Flash.png"
          alt=""
          className="quick-menu-icon"
          style={{ width: '20px', height: '20px', objectFit: 'contain' }}
        />
        <h3 className="section-title">빠른메뉴</h3>
      </div>
      {/* Direct quick menu grid - main.html 100% match */}
      <ul className="quick-grid" id="quick-menu">
        {quickMenuItems.map((item, index) => (
          <li key={index}>
            <Link href={item.href} className="quick-item">
              <img
                className="qm-icon"
                src={item.icon}
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
