'use client'

import { cn } from '@/lib/utils'

interface StatItem {
  label: string
  value: string | number
  helper?: string
  color?: 'blue' | 'emerald' | 'amber' | 'rose' | 'gray'
}

interface ReportStatsProps {
  stats: StatItem[]
}

export function ReportStats({ stats }: ReportStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      {stats.map((stat, idx) => (
        <StatCard key={idx} {...stat} />
      ))}
    </div>
  )
}

function StatCard({ label, value, helper, color = 'blue' }: StatItem) {
  const colorMap = {
    blue: 'from-blue-500 to-blue-600 bg-blue-50/50 text-blue-700 ring-blue-100',
    emerald: 'from-emerald-500 to-emerald-600 bg-emerald-50/50 text-emerald-700 ring-emerald-100',
    amber: 'from-amber-500 to-amber-600 bg-amber-50/50 text-amber-700 ring-amber-100',
    rose: 'from-rose-500 to-rose-600 bg-rose-50/50 text-rose-700 ring-rose-100',
    gray: 'from-gray-500 to-gray-600 bg-gray-50/50 text-gray-700 ring-gray-100',
  }

  const classes = colorMap[color]

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl border p-6 bg-white shadow-sm transition-all hover:shadow-md hover:-translate-y-1 group',
        'ring-2 ring-offset-0 ring-transparent hover:ring-offset-2'
      )}
    >
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
          {label}
        </span>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black italic tracking-tight text-foreground group-hover:text-blue-600 transition-colors">
            {value}
          </span>
        </div>
        {helper && (
          <div className="mt-4 flex items-center gap-2">
            <div
              className={cn(
                'h-1 w-12 rounded-full bg-gradient-to-r',
                classes.split(' ').slice(0, 2).join(' ')
              )}
            />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter truncate opacity-40">
              {helper}
            </span>
          </div>
        )}
      </div>

      {/* Subtle abstract background element */}
      <div
        className={cn(
          'absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity bg-gradient-to-br',
          classes.split(' ').slice(0, 2).join(' ')
        )}
      />
    </div>
  )
}
