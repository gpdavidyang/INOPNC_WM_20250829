'use client'

import { CardContent } from '@/components/ui/card'

interface InfoItem {
  label: string
  value: string
}

interface ReportInfoGridProps {
  items: InfoItem[]
}

export function ReportInfoGrid({ items }: ReportInfoGridProps) {
  return (
    <CardContent className="px-4 pb-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-5">
        {items.map(item => (
          <div
            key={item.label}
            className="flex flex-col gap-1 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2"
          >
            <span className="text-xs text-muted-foreground">{item.label}</span>
            <span className="text-sm font-semibold text-foreground">{item.value}</span>
          </div>
        ))}
      </div>
    </CardContent>
  )
}
