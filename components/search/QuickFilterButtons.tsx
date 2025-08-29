'use client'

import { Button } from '@/components/ui/button'
import { 
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  Package,
  Filter,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { QuickFilter, SearchOptions } from '@/lib/search/types'

interface QuickFilterButtonsProps {
  quickFilters: QuickFilter[]
  activeFilters: string[]
  onFilterToggle: (filterId: string) => void
  onClearAll: () => void
  className?: string
}

const iconMap = {
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  Package,
  Filter
}

export function QuickFilterButtons({ 
  quickFilters, 
  activeFilters, 
  onFilterToggle, 
  onClearAll,
  className 
}: QuickFilterButtonsProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">빠른 필터</h3>
        {activeFilters.length > 0 && (
          <Button
            variant="outline"
            size="compact"
            onClick={onClearAll}
            className="h-7 px-2 text-xs"
          >
            <X className="w-3 h-3 mr-1" />
            전체 해제
          </Button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {quickFilters.map((filter: any) => {
          const isActive = activeFilters.includes(filter.id)
          const IconComponent = filter.icon ? iconMap[filter.icon as keyof typeof iconMap] : Filter
          
          return (
            <Button
              key={filter.id}
              variant={isActive ? "primary" : "outline"}
              size="compact"
              onClick={() => onFilterToggle(filter.id)}
              className={cn(
                "h-8 px-3 text-xs transition-all",
                isActive && "bg-blue-600 text-white border-blue-600"
              )}
            >
              {IconComponent && <IconComponent className="w-3 h-3 mr-1.5" />}
              {filter.label}
            </Button>
          )
        })}
      </div>
    </div>
  )
}