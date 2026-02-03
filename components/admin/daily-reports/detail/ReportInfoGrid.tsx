'use client'

interface InfoItem {
  label: string
  value: string
}

interface ReportInfoGridProps {
  items: InfoItem[]
}

export function ReportInfoGrid({ items }: ReportInfoGridProps) {
  return (
    <div className="flex flex-wrap items-center gap-6 px-8 py-5 border-t bg-gray-50/30">
      {items.map(item => (
        <div key={item.label} className="flex flex-col min-w-[120px]">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 transition-all">
            {item.label}
          </span>
          <span className="text-sm font-bold text-foreground">{item.value}</span>
        </div>
      ))}
    </div>
  )
}
