'use client'

import { Card } from '@/components/ui/card'

interface StatCard {
  label: string
  value: string
  helper: string
}

interface ReportStatsProps {
  stats: StatCard[]
}

export function ReportStats({ stats }: ReportStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map(card => (
        <Card key={card.label} className="overflow-hidden border-none shadow-md">
          <div className="bg-gradient-to-br from-white to-slate-50 p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {card.label}
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#1A254F]">{card.value}</span>
            </div>
            <div className="mt-1 text-xs text-slate-400">{card.helper}</div>
          </div>
        </Card>
      ))}
    </div>
  )
}
