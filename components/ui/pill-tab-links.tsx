import { cn } from '@/lib/utils'
import Link from 'next/link'

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
        'inline-flex items-center gap-2 rounded-2xl bg-slate-50/80 p-1.5 border border-slate-100 shadow-inner',
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
              'px-4 py-2 text-sm rounded-xl transition-all duration-200 font-bold whitespace-nowrap',
              fill ? 'flex-1 text-center' : '',
              isActive
                ? 'bg-blue-50 text-blue-700 shadow-md shadow-blue-100/50'
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'
            )}
          >
            {t.label}
          </Link>
        )
      })}
    </div>
  )
}
