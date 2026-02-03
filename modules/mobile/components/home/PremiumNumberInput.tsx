'use client'

import { cn } from '@/lib/utils'
import { Minus, Plus } from 'lucide-react'

interface PremiumNumberInputProps {
  value: number
  onChange: (value: number) => void
  values: number[]
  label?: string
  className?: string
}

export function PremiumNumberInput({
  value,
  onChange,
  values,
  label,
  className,
}: PremiumNumberInputProps) {
  const currentIndex = values.indexOf(value)
  const canDecrease = currentIndex > 0
  const canIncrease = currentIndex < values.length - 1

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest ml-1">
          {label}
        </label>
      )}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => canDecrease && onChange(values[currentIndex - 1])}
          disabled={!canDecrease}
          className={cn(
            'w-12 h-12 rounded-2xl flex items-center justify-center transition-all border-2',
            canDecrease
              ? 'bg-white border-gray-100 text-foreground active:scale-95 hover:bg-gray-50 shadow-sm'
              : 'bg-gray-50 border-gray-50 text-gray-300 cursor-not-allowed'
          )}
        >
          <Minus className="w-5 h-5" />
        </button>

        <div className="flex-1 h-14 rounded-2xl bg-gray-50/50 border-2 border-gray-100 flex items-center justify-center relative overflow-hidden">
          <span className="text-xl font-black text-foreground italic">{value.toFixed(1)}</span>
          <span className="text-[10px] font-black uppercase text-muted-foreground/40 absolute bottom-1 tracking-widest">
            Manpower
          </span>
        </div>

        <button
          type="button"
          onClick={() => canIncrease && onChange(values[currentIndex + 1])}
          disabled={!canIncrease}
          className={cn(
            'w-12 h-12 rounded-2xl flex items-center justify-center transition-all border-2',
            canIncrease
              ? 'bg-white border-gray-100 text-foreground active:scale-95 hover:bg-gray-50 shadow-sm'
              : 'bg-gray-50 border-gray-50 text-gray-300 cursor-not-allowed'
          )}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
