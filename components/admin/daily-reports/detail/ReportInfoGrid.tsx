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
    <div className="flex flex-wrap items-center gap-x-10 gap-y-4 px-8 py-5 border-t border-gray-50 bg-white/50 backdrop-blur-sm">
      {items.map(item => (
        <div key={item.label} className="flex flex-col min-w-[110px] gap-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">
            {item.label}
          </span>
          <span className="text-sm font-bold text-gray-700">{item.value || ''}</span>
        </div>
      ))}
    </div>
  )
}
