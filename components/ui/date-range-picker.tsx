'use client'

import type { HTMLAttributes } from 'react'

interface DateRangePickerProps extends HTMLAttributes<HTMLDivElement> {
  value?: { from?: Date; to?: Date }
  onChange?: (value: { from?: Date; to?: Date }) => void
}

export function DateRangePicker({ className, value, onChange, ...props }: DateRangePickerProps) {
  return (
    <div
      {...props}
      className={`flex items-center justify-between rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-600 ${className ?? ''}`.trim()}
    >
      <span>{value?.from?.toLocaleDateString() ?? '시작일'}</span>
      <span className="mx-2 text-gray-400">~</span>
      <span>{value?.to?.toLocaleDateString() ?? '종료일'}</span>
      <button
        type="button"
        className="ml-3 rounded bg-blue-600 px-3 py-1 text-white"
        onClick={() => onChange?.({ from: new Date(), to: new Date() })}
      >
        오늘
      </button>
    </div>
  )
}
