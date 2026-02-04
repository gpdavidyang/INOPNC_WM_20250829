import { cn } from '@/lib/utils'

interface MaterialStatsCardProps {
  label: string
  value: string | number
  unit?: string
  className?: string
  variant?: 'blue' | 'gray'
}

export function MaterialStatsCard({
  label,
  value,
  unit,
  className,
  variant = 'blue',
}: MaterialStatsCardProps) {
  const bgClass = variant === 'blue' ? 'bg-blue-50' : 'bg-gray-100'
  const textClass = variant === 'blue' ? 'text-blue-600' : 'text-gray-500'
  const valueClass = variant === 'blue' ? 'text-blue-700' : 'text-gray-900'

  return (
    <div className={cn('rounded-xl p-4 space-y-2', bgClass, className)}>
      <div className={cn('text-[11px] uppercase font-black tracking-tighter', textClass)}>
        {label}
      </div>
      <div className={cn('text-2xl font-black', valueClass)}>
        {typeof value === 'number' ? value.toLocaleString() : value}
        {unit && (
          <span className={cn('text-sm font-bold ml-1 opacity-70', valueClass)}>{unit}</span>
        )}
      </div>
    </div>
  )
}
