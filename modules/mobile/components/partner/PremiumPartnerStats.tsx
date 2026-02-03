'use client'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Building2, CalendarCheck, Clock, MousePointer2 } from 'lucide-react'

interface PremiumPartnerStatsProps {
  summary: any
  pendingCount: number
  todaySubmitted: number
}

export function PremiumPartnerStats({
  summary,
  pendingCount,
  todaySubmitted,
}: PremiumPartnerStatsProps) {
  const stats = [
    {
      label: 'Active Sites',
      value: summary?.activeSites || 0,
      sub: `${summary?.totalSites || 0} Total`,
      icon: <Building2 className="w-4 h-4" />,
      color: 'bg-blue-500',
    },
    {
      label: 'Pending Approval',
      value: pendingCount,
      sub: 'Needs Review',
      icon: <MousePointer2 className="w-4 h-4" />,
      color: 'bg-amber-500',
    },
    {
      label: 'Total Man-Days',
      value: summary?.totalLaborHours || 0,
      sub: 'This Period',
      icon: <Clock className="w-4 h-4" />,
      color: 'bg-emerald-500',
    },
    {
      label: 'Today Submitted',
      value: todaySubmitted,
      sub: 'Daily Target',
      icon: <CalendarCheck className="w-4 h-4" />,
      color: 'bg-indigo-500',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((s, idx) => (
        <Card
          key={idx}
          className="p-4 rounded-3xl border-none bg-white shadow-xl shadow-blue-900/5 group hover:-translate-y-1 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div
              className={cn(
                'w-8 h-8 rounded-xl flex items-center justify-center text-white',
                s.color
              )}
            >
              {s.icon}
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest block">
              {s.label}
            </span>
            <span className="text-xl font-black text-foreground italic">{s.value}</span>
            <span className="text-[9px] font-bold text-muted-foreground/40 block">{s.sub}</span>
          </div>
        </Card>
      ))}
    </div>
  )
}
