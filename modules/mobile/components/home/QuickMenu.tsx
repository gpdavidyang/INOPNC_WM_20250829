'use client'

import React from 'react'
import Link from 'next/link'

const quickMenuItems = [
  {
    href: '/mobile/worklog',
    icon: '/icons/pay_출력현황.png',
    label: '출력현황',
  },
  {
    href: '/mobile/tasks',
    icon: '/icons/report_작업일지.png',
    label: '작업일지',
  },
  {
    href: '/mobile/sites',
    icon: '/icons/map_현장정보.png',
    label: '현장정보',
  },
  {
    href: '/mobile/documents',
    icon: '/icons/doc_문서함.png',
    label: '문서함',
  },
  {
    href: '/mobile/requests',
    icon: '/icons/request_본사요청.png',
    label: '본사요청',
  },
  {
    href: '/mobile/materials',
    icon: '/icons/stock_재고관리.png',
    label: '재고관리',
  },
]

export const QuickMenu: React.FC = () => {
  return (
    <section className="section" id="home-quick" style={{ marginTop: '-30px' }}>
      <div className="section-header">
        <img
          src="/icons/Flash_new.png"
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
