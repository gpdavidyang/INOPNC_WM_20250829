import Link from 'next/link'
import clsx from 'clsx'

type ProductionManagerTabKey = 'requests' | 'production' | 'shipping'

interface ProductionManagerTabsProps {
  active?: ProductionManagerTabKey
}

const tabs: Array<{ key: ProductionManagerTabKey; label: string; href: string }> = [
  { key: 'requests', label: '입고요청', href: '/mobile/production/requests' },
  { key: 'production', label: '생산정보', href: '/mobile/production/production' },
  { key: 'shipping', label: '출고배송', href: '/mobile/production/shipping-payment' },
]

export function ProductionManagerTabs({ active }: ProductionManagerTabsProps) {
  return (
    <nav className="pm-tab-nav" aria-label="생산관리 내비게이션">
      <ul className="pm-tab-list">
        {tabs.map(tab => (
          <li key={tab.key} className="pm-tab-item">
            <Link
              href={tab.href}
              className={clsx('pm-tab-link', active === tab.key && 'active')}
              prefetch={false}
            >
              {tab.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
