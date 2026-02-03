'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface InvoiceProgressSummaryProps {
  progress: any
}

export function InvoiceProgressSummary({ progress }: InvoiceProgressSummaryProps) {
  const stages = [
    { key: 'start', label: '착수 단계', color: 'blue' },
    { key: 'progress', label: '진행 단계', color: 'amber' },
    { key: 'completion', label: '완료 단계', color: 'emerald' },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stages.map(stage => {
        const data = progress[stage.key]
        const percent = data.required > 0 ? (data.fulfilled / data.required) * 100 : 0
        const isDone = percent === 100 && data.required > 0

        const colorClasses = {
          blue: 'from-blue-500 to-blue-600 bg-blue-50 border-blue-100 text-blue-700',
          amber: 'from-amber-500 to-amber-600 bg-amber-50 border-amber-100 text-amber-700',
          emerald:
            'from-emerald-500 to-emerald-600 bg-emerald-50 border-emerald-100 text-emerald-700',
        }[stage.color as 'blue' | 'amber' | 'emerald']

        return (
          <div
            key={stage.key}
            className={cn(
              'relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all',
              isDone
                ? 'border-transparent bg-white shadow-md ring-2 ring-offset-2 ' +
                    (stage.color === 'blue'
                      ? 'ring-blue-500'
                      : stage.color === 'amber'
                        ? 'ring-amber-500'
                        : 'ring-emerald-500')
                : 'bg-card'
            )}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                {stage.label}
              </span>
              <Badge
                variant={isDone ? 'default' : 'outline'}
                className={cn(
                  'text-[10px] h-5',
                  isDone && 'bg-gradient-to-r ' + colorClasses.split(' ').slice(0, 2).join(' ')
                )}
              >
                {data.fulfilled} / {data.required} 완료
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="flex items-end justify-between">
                <span className="text-2xl font-black italic">{Math.round(percent)}%</span>
                <span className="text-[10px] font-bold opacity-40">FULFILLMENT RATE</span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all duration-1000 ease-out bg-gradient-to-r',
                    colorClasses.split(' ').slice(0, 2).join(' ')
                  )}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
