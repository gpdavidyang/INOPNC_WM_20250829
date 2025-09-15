'use client'

import React from 'react'
import Link from 'next/link'

const quickMenuItems = [
  {
    href: '/mobile/worklog',
    icon: 'https://postfiles.pstatic.net/MjAyNTA5MDlfMzMg/MDAxNzU3MzczOTIzOTg2.eKgzH2aeZVhrEtYCSg-Vjyuok2eudz505Ck18_zeqpsg.r-W69aHdwVPEBS58wMg5LyR7-mDy3WaW_Yyt9I-Ax8kg.PNG/%EC%B6%9C%EB%A0%A5%ED%98%84%ED%99%A9.png?type=w966',
    label: '출력현황',
  },
  {
    href: '/mobile/tasks',
    icon: 'https://postfiles.pstatic.net/MjAyNTA5MDlfNDIg/MDAxNzU3MzczOTIzOTE5.uKHob9PU2yFuDqyYrTvYYHunByHEBj0A7pUASU7CEREg.3-0zMZk_TTNxnCDNBVAvSSxeGYcWdeot0GzIWhgD72Ug.PNG/%EC%9E%91%EC%97%85%EC%9D%BC%EC%A7%80.png?type=w966',
    label: '작업일지',
  },
  {
    href: '/mobile/sites',
    icon: 'https://postfiles.pstatic.net/MjAyNTA5MDlfMTg4/MDAxNzU3MzczOTIzNjQ4.t3FLSpag_6badT7CAFsHXFj2wTbUWJh_3iHKxWR1DEwg.80vrXfmE4WGWg206E9n0XibJFSkfk1RkUr-lDpzyXh4g.PNG/%ED%98%84%EC%9E%A5%EC%A0%95%EB%B3%B4.png?type=w966',
    label: '현장정보',
  },
  {
    href: '/mobile/documents',
    icon: 'https://postfiles.pstatic.net/MjAyNTA5MDlfMjc2/MDAxNzU3MzczOTIzNjUx.O1t90awoAKjRWjXhHYAnUEen68ptahXE1NWbYNvjy8Yg.440PWbQoaCp1dpPCgCvnlKU8EASGSAXMHb0zGEKnLHkg.PNG/%EB%AC%B8%EC%84%9C%ED%95%A8.png?type=w966',
    label: '문서함',
  },
  {
    href: '/mobile/requests',
    icon: 'https://postfiles.pstatic.net/MjAyNTA5MDlfNjEg/MDAxNzU3MzczOTIzODI4.vHsIasE2fPt-A9r28ui5Sw7oGf9JXhxetAh96TdAHgcg.iV39dkzonq61Z_hvu1O1-FLwCNFqM-OCqrNDwN3EuI8g.PNG/%EB%B3%B8%EC%82%AC%EC%9A%94%EC%B2%AD.png?type=w966',
    label: '본사요청',
  },
  {
    href: '/mobile/materials',
    icon: 'https://postfiles.pstatic.net/MjAyNTA5MDlfMTAg/MDAxNzU3MzczOTIzODc2.V3ORy11Kszltv6qJ6M3zt4qFtdNopNi1sYcrZALvFD0g.5ZpgJNYRXfyedL0hVpIfo1sxqgBPUAO9SmMjmKf7qZgg.PNG/%EC%9E%AC%EA%B3%A0%EA%B4%80%EB%A6%AC.png?type=w966',
    label: '재고관리',
  },
]

export const QuickMenu: React.FC = () => {
  return (
    <section className="section mb-3.5">
      <div className="flex items-center gap-2 mb-3">
        <img
          src="https://postfiles.pstatic.net/MjAyNTA5MDlfMjYz/MDAxNzU3MzczOTIzNjUy.938EaPjiHzNGNoECgw9vItJhy_4pR6ZYVq3-8Z3tJecg.pSbWcXNy1U9El6kYe8OpwKmCEwkZiWJUiIM2R1qL2Swg.PNG/Flash.png?type=w966"
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
