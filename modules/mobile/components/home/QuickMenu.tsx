'use client'

import React from 'react'
import Link from 'next/link'

const quickMenuItemsBase = [
  {
    href: '/mobile/attendance',
    icon: '/icons/pay_output.png',
    label: '출력정보',
  },
  {
    href: '/mobile/worklog',
    icon: '/icons/report_worklog.png',
    label: '작업일지',
  },
  {
    href: '/mobile/sites',
    icon: '/icons/map_site.png',
    label: '현장정보',
  },
  {
    href: '/mobile/documents',
    icon: '/icons/doc_documents.png',
    label: '문서함',
  },
  {
    href: 'https://open.kakao.com/o/g6r8yDRh',
    icon: '/icons/request_hq.png',
    label: '본사요청',
    external: true,
  },
  {
    href: '/mobile/sites#materials-inventory-section',
    icon: '/icons/stock_inventory.png',
    label: '재고관리',
  },
]

export const QuickMenu: React.FC = () => {
  // Partner roles route to partner output
  const [outputHref, setOutputHref] = React.useState('/mobile/attendance')
  React.useEffect(() => {
    let alive = true
    fetch('/api/auth/me', { cache: 'no-store' })
      .then(r => r.json().catch(() => null))
      .then(j => {
        if (!alive) return
        const role = j?.profile?.role
        if (role === 'partner' || role === 'customer_manager') {
          setOutputHref('/mobile/partner/output')
        }
      })
      .catch(() => void 0)
    return () => {
      alive = false
    }
  }, [])

  const quickMenuItems = React.useMemo(() => {
    const arr = [...quickMenuItemsBase]
    arr[0] = { ...arr[0], href: outputHref }
    return arr
  }, [outputHref])

  return (
    <section className="section" id="home-quick">
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
            {item.external ? (
              <a href={item.href} className="quick-item" target="_blank" rel="noopener noreferrer">
                <img
                  className="qm-icon"
                  src={item.icon}
                  alt={item.label}
                  decoding="async"
                  loading="lazy"
                />
                <span>{item.label}</span>
              </a>
            ) : (
              <Link href={item.href} className="quick-item" prefetch={false}>
                <img
                  className="qm-icon"
                  src={item.icon}
                  alt={item.label}
                  decoding="async"
                  loading="lazy"
                />
                <span>{item.label}</span>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
