'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { CheckCircle2, Circle } from 'lucide-react'

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
    <div className="grid gap-6 md:grid-cols-3">
      {stages.map(stage => {
        const data = progress[stage.key] || { fulfilled: 0, required: 0 }
        const percent = data.required > 0 ? (data.fulfilled / data.required) * 100 : 0
        const isDone = percent === 100 && data.required > 0

        return (
          <div
            key={stage.key}
            className={cn(
              'relative overflow-hidden rounded-3xl border p-6 transition-all duration-500',
              isDone
                ? 'bg-white border-blue-600 shadow-lg shadow-blue-900/10'
                : 'bg-white border-slate-100 shadow-sm'
            )}
          >
            {isDone && (
              <div className="absolute top-0 right-0 p-2">
                <div className="bg-blue-600 text-white rounded-bl-2xl rounded-tr-xl px-3 py-1 text-[10px] font-black uppercase tracking-tighter">
                  완료됨
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-300" />
                )}
                <span className="text-[11px] font-black text-[#1A254F] uppercase tracking-tighter opacity-40">
                  {stage.label}
                </span>
              </div>
              <Badge
                variant={isDone ? 'default' : 'secondary'}
                className={cn(
                  'text-[10px] font-black h-6 px-3 rounded-lg border-none shadow-sm',
                  isDone ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'
                )}
              >
                {data.fulfilled} <span className="mx-1 opacity-40">/</span> {data.required}
              </Badge>
            </div>

            <div className="space-y-4">
              <div className="flex items-end justify-between">
                <div className="flex items-baseline gap-1">
                  <span
                    className={cn(
                      'text-3xl font-black italic tracking-tighter',
                      isDone ? 'text-blue-600' : 'text-[#1A254F]'
                    )}
                  >
                    {Math.round(percent)}
                  </span>
                  <span className="text-sm font-bold text-slate-400 opacity-60">%</span>
                </div>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">
                  진행율
                </span>
              </div>

              <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden shadow-inner">
                <div
                  className={cn(
                    'h-full transition-all duration-1000 ease-out rounded-full',
                    stage.color === 'blue'
                      ? 'bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]'
                      : stage.color === 'amber'
                        ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                        : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                  )}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>

            {/* Micro-stats / Legend */}
            <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                {isDone ? '모든 항목 등록됨' : `${data.required - data.fulfilled}개 미등록`}
              </span>
              <div className="flex -space-x-1">
                {[...Array(Math.min(data.required, 5))].map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-3 h-3 rounded-full border-2 border-white',
                      i < data.fulfilled ? 'bg-blue-600' : 'bg-slate-200'
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
