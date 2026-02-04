'use client'

import { cn } from '@/lib/utils'

interface StatItem {
  label: string
  value: string | number
  helper?: string
  color?: 'primary' | 'active' | 'neutral'
}

interface ReportStatsProps {
  stats: StatItem[]
}

const COLOR_STYLES = {
  primary: {
    container: 'bg-indigo-50/50 text-[#1A254F]',
  },
  active: {
    container: 'bg-blue-50 text-blue-700',
  },
  neutral: {
    container: 'bg-sky-50 text-sky-700',
  },
}

export function ReportStats({ stats }: ReportStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {stats.map((stat, idx) => (
        <StatCard key={idx} {...stat} />
      ))}
    </div>
  )
}

function StatCard({ label, value, helper, color = 'primary' }: StatItem) {
  const style = COLOR_STYLES[color] || COLOR_STYLES.primary

  return (
    <div
      className={cn(
        'relative group p-4 sm:p-5 rounded-xl flex flex-col gap-1 transition-all',
        style.container
      )}
    >
      <div className="text-[10px] font-black uppercase tracking-widest opacity-30 mb-1">
        {label}
      </div>

      <div className="flex flex-col">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black italic tracking-tighter leading-none">{value}</span>
        </div>
        {helper && (
          <span className="text-[10px] font-bold opacity-20 tracking-tight italic mt-1 line-clamp-1">
            {helper}
          </span>
        )}
      </div>
    </div>
  )
}
