import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface PillTabLinkItem {
  key: string
  label: string
  href: string
}

export default function PillTabLinks({
  items,
  activeKey,
  className,
  fill = false,
}: {
  items: PillTabLinkItem[]
  activeKey: string
  className?: string
  fill?: boolean
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-xl border-0 shadow bg-gradient-to-r from-[--brand-600] to-[--brand-700] p-1',
        fill ? 'w-full' : '',
        className
      )}
    >
      {items.map(t => {
        const isActive = t.key === activeKey
        return (
          <Link
            key={t.key}
            href={t.href}
            className={cn(
              'px-3 py-1.5 text-sm rounded-md transition-colors',
              fill ? 'flex-1 text-center' : '',
              isActive ? 'bg-white text-[--brand-700] shadow-md' : 'text-white/90 hover:text-white'
            )}
          >
            {t.label}
          </Link>
        )
      })}
    </div>
  )
}
