'use client'

import { t } from '@/lib/ui/strings'
import { cn } from '@/lib/utils'

interface SiteStatsProps {
  total: number
  activeCount: number
  statusFilterLabel: string
}

export const SiteStats = ({ total, activeCount, statusFilterLabel }: SiteStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {[
        {
          label: t('sites.stats.total'),
          value: total,
          unit: '곳',
          bg: 'bg-indigo-50/50',
          text: 'text-[#1A254F]',
        },
        {
          label: t('sites.stats.activeOnPage'),
          value: activeCount,
          unit: '곳',
          bg: 'bg-emerald-50/50',
          text: 'text-emerald-700',
        },
        {
          label: '필터 상태',
          value: statusFilterLabel,
          unit: '',
          bg: 'bg-amber-50/50',
          text: 'text-amber-700',
        },
      ].map(card => (
        <div
          key={card.label}
          className={cn('flex flex-col gap-1 p-5 rounded-xl border-none text-left', card.bg)}
        >
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-30">
            {card.label}
          </span>
          <div className="flex items-baseline gap-1 mt-auto">
            {typeof card.value === 'number' ? (
              <>
                <span className={cn('text-2xl font-bold italic tracking-tighter', card.text)}>
                  {card.value.toLocaleString()}
                </span>
                {card.unit && (
                  <span className="text-[11px] font-medium opacity-30 ml-1">{card.unit}</span>
                )}
              </>
            ) : (
              <span className={cn('text-xl font-bold tracking-tight', card.text)}>
                {card.value}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
