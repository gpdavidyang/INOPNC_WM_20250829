'use client'

import { cn } from '@/lib/utils'
import type { AppliedFilter } from '@/lib/search/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Filter, X } from 'lucide-react'

interface AppliedFiltersBarProps {
  filters: AppliedFilter[]
  onRemoveFilter: (field: string, operator: string, value: unknown) => void
  onClearAll: () => void
  className?: string
}

export function AppliedFiltersBar({ 
  filters, 
  onRemoveFilter, 
  onClearAll, 
  className 
}: AppliedFiltersBarProps) {
  if (filters.length === 0) {
    return null
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            적용된 필터 ({filters.length})
          </span>
        </div>
        <Button
          variant="outline"
          size="compact"
          onClick={onClearAll}
          className="h-7 px-2 text-xs"
        >
          전체 해제
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {filters.map((filter, index) => (
          <Badge
            key={`${filter.field}-${filter.operator}-${filter.value}-${index}`}
            variant="secondary"
            className="px-2 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
          >
            <span className="font-medium">{filter.label}:</span>
            <span className="ml-1">{filter.displayValue}</span>
            <button
              onClick={() => onRemoveFilter(filter.field, filter.operator, filter.value)}
              className="ml-2 hover:text-blue-900"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  )
}
