import React from 'react'
import Link from 'next/link'

type TabItem = {
  value: string
  label: string
  href: string
}

interface FillTabsProps {
  items: TabItem[]
  value: string
  className?: string
}

/**
 * FillTabs
 * - 가로 전체를 균등 분할하여 탭을 렌더링하는 단순 링크 탭 컴포넌트
 * - 접근성: role=tablist/tab, aria-selected 지원
 * - 서버 라우팅과 호환: 각 탭은 Link로 이동
 */
export function FillTabs({ items, value, className }: FillTabsProps) {
  return (
    <nav
      className={`flex w-full items-stretch rounded-md border border-gray-200 bg-white p-0.5 ${className ?? ''}`.trim()}
      role="tablist"
      aria-label="커뮤니케이션 센터 탭"
    >
      {items.map(item => {
        const active = item.value === value
        return (
          <Link
            key={item.value}
            href={item.href}
            role="tab"
            aria-selected={active}
            className={[
              'flex-1 inline-flex items-center justify-center whitespace-nowrap text-sm h-9 px-3 rounded-md transition-colors',
              active
                ? 'bg-gray-900 text-white shadow-sm'
                : 'bg-transparent text-gray-700 hover:bg-gray-100',
            ].join(' ')}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export default FillTabs
