'use client'

import * as React from 'react'

export type ViewMode = 'card' | 'list' | 'grid'

interface ViewToggleProps {
  mode: ViewMode
  onModeChange: (mode: ViewMode) => void
  className?: string
  availableModes?: ViewMode[]
  size?: 'sm' | 'md' | 'lg'
  showLabels?: boolean
}

export function ViewToggle({
  mode,
  onModeChange,
  className,
  availableModes = ['card', 'list'],
  size = 'md',
  showLabels = false
}: ViewToggleProps) {
  const sizeClasses = {
    sm: 'h-7 px-2 text-xs',
    md: 'h-9 px-3 text-sm',
    lg: 'h-11 px-4 text-base'
  }

  const iconSizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  const getModeIcon = (viewMode: ViewMode) => {
    switch (viewMode) {
      case 'card':
        return <LayoutGrid className={iconSizes[size]} />
      case 'list':
        return <List className={iconSizes[size]} />
      case 'grid':
        return <Grid3x3 className={iconSizes[size]} />
      default:
        return <TableProperties className={iconSizes[size]} />
    }
  }

  const getModeLabel = (viewMode: ViewMode) => {
    switch (viewMode) {
      case 'card':
        return '카드'
      case 'list':
        return '리스트'
      case 'grid':
        return '그리드'
      default:
        return viewMode
    }
  }

  return (
    <div 
      className={cn(
        'inline-flex items-center rounded-lg border border-gray-200 dark:border-gray-700 p-0.5 bg-gray-100 dark:bg-gray-800',
        className
      )}
    >
      {availableModes.map((viewMode) => (
        <button
          key={viewMode}
          type="button"
          onClick={() => onModeChange(viewMode)}
          className={cn(
            'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-all',
            sizeClasses[size],
            mode === viewMode
              ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          )}
          aria-label={`${getModeLabel(viewMode)} 보기`}
          title={`${getModeLabel(viewMode)} 보기`}
        >
          {getModeIcon(viewMode)}
          {showLabels && (
            <span className="hidden sm:inline-block">
              {getModeLabel(viewMode)}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// Hook for managing view mode state with localStorage
export function useViewMode(
  key: string,
  defaultMode: ViewMode = 'card'
): [ViewMode, (mode: ViewMode) => void] {
  const [mode, setMode] = React.useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`view-mode-${key}`)
      return (saved as ViewMode) || defaultMode
    }
    return defaultMode
  })

  const handleModeChange = React.useCallback((newMode: ViewMode) => {
    setMode(newMode)
    if (typeof window !== 'undefined') {
      localStorage.setItem(`view-mode-${key}`, newMode)
    }
  }, [key])

  return [mode, handleModeChange]
}

// CardView Wrapper Component
interface CardViewProps {
  children: React.ReactNode
  className?: string
  columns?: 1 | 2 | 3 | 4 | 'auto'
}

export function CardView({ 
  children, 
  className,
  columns = 'auto'
}: CardViewProps) {
  const gridColumns = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    'auto': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  }

  return (
    <div className={cn(
      'grid gap-4',
      gridColumns[columns],
      className
    )}>
      {children}
    </div>
  )
}

// ListView Wrapper Component (uses SortableTable)
export { SortableTable as ListView } from './sortable-table'