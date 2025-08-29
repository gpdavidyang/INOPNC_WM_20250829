'use client'

import * as React from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SortDirection = 'asc' | 'desc' | null
export type SortConfig<T> = {
  key: keyof T | string
  direction: SortDirection
}

interface Column<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
  render?: (value: any, item: T, index: number) => React.ReactNode
  className?: string
  headerClassName?: string
}

interface SortableTableProps<T> {
  data: T[]
  columns: Column<T>[]
  onSort?: (config: SortConfig<T>) => void
  sortConfig?: SortConfig<T>
  className?: string
  containerClassName?: string
  headerClassName?: string
  bodyClassName?: string
  rowClassName?: string | ((item: T, index: number) => string)
  emptyMessage?: string
  loading?: boolean
  striped?: boolean
  hoverable?: boolean
  compact?: boolean
  stickyHeader?: boolean
  maxHeight?: string
}

export function SortableTable<T extends Record<string, any>>({
  data,
  columns,
  onSort,
  sortConfig,
  className,
  containerClassName,
  headerClassName,
  bodyClassName,
  rowClassName,
  emptyMessage = '데이터가 없습니다',
  loading = false,
  striped = false,
  hoverable = true,
  compact = false,
  stickyHeader = false,
  maxHeight
}: SortableTableProps<T>) {
  const handleSort = (column: Column<T>) => {
    if (!column.sortable || !onSort) return

    let newDirection: SortDirection = 'asc'
    
    if (sortConfig?.key === column.key) {
      if (sortConfig.direction === 'asc') {
        newDirection = 'desc'
      } else if (sortConfig.direction === 'desc') {
        newDirection = null
      }
    }

    onSort({
      key: column.key,
      direction: newDirection
    })
  }

  const getSortIcon = (column: Column<T>) => {
    if (!column.sortable) return null

    const isActive = sortConfig?.key === column.key
    const direction = isActive ? sortConfig.direction : null

    return (
      <span className="inline-flex ml-1">
        {direction === null && (
          <ChevronsUpDown className="h-4 w-4 text-gray-400" />
        )}
        {direction === 'asc' && (
          <ChevronUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        )}
        {direction === 'desc' && (
          <ChevronDown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        )}
      </span>
    )
  }

  const getAlignClass = (align?: 'left' | 'center' | 'right') => {
    switch (align) {
      case 'center':
        return 'text-center'
      case 'right':
        return 'text-right'
      default:
        return 'text-left'
    }
  }

  const getValue = (item: T, key: keyof T | string): any => {
    const keys = String(key).split('.')
    let value: any = item
    
    for (const k of keys) {
      value = value?.[k]
    }
    
    return value
  }

  const containerClass = cn(
    'w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700',
    containerClassName
  )

  const tableClass = cn(
    'min-w-full divide-y divide-gray-200 dark:divide-gray-700',
    className
  )

  const headerClass = cn(
    'bg-gray-50 dark:bg-gray-800',
    stickyHeader && 'sticky top-0 z-10',
    headerClassName
  )

  const bodyClass = cn(
    'bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700',
    bodyClassName
  )

  const cellPadding = compact ? 'px-3 py-2' : 'px-4 py-3'

  if (loading) {
    return (
      <div className={containerClass}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={containerClass}>
      <div 
        className={cn(
          'overflow-auto',
          maxHeight && `max-h-[${maxHeight}]`
        )}
      >
        <table className={tableClass}>
          <thead className={headerClass}>
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  scope="col"
                  className={cn(
                    cellPadding,
                    'text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider',
                    getAlignClass(column.align),
                    column.sortable && 'cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
                    column.width && `w-[${column.width}]`,
                    column.headerClassName
                  )}
                  onClick={() => handleSort(column)}
                >
                  <div className={cn(
                    'flex items-center',
                    column.align === 'center' && 'justify-center',
                    column.align === 'right' && 'justify-end'
                  )}>
                    <span>{column.label}</span>
                    {getSortIcon(column)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={bodyClass}>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className={cn(
                    cellPadding,
                    'text-center text-sm text-gray-500 dark:text-gray-400'
                  )}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, index) => {
                const rowClass = typeof rowClassName === 'function' 
                  ? rowClassName(item, index)
                  : rowClassName

                return (
                  <tr
                    key={index}
                    className={cn(
                      hoverable && 'hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
                      striped && index % 2 === 1 && 'bg-gray-50/50 dark:bg-gray-800/50',
                      rowClass
                    )}
                  >
                    {columns.map((column) => {
                      const value = getValue(item, column.key)
                      const cellContent = column.render 
                        ? column.render(value, item, index)
                        : value

                      return (
                        <td
                          key={String(column.key)}
                          className={cn(
                            cellPadding,
                            'text-sm text-gray-900 dark:text-gray-100',
                            getAlignClass(column.align),
                            column.className
                          )}
                        >
                          {cellContent}
                        </td>
                      )
                    })}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Hook for managing sort state
export function useSortableData<T>(
  data: T[],
  defaultConfig?: SortConfig<T>
) {
  const [sortConfig, setSortConfig] = React.useState<SortConfig<T> | undefined>(defaultConfig)

  const sortedData = React.useMemo(() => {
    if (!sortConfig || !sortConfig.direction) {
      return data
    }

    const sorted = [...data].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof T]
      const bValue = b[sortConfig.key as keyof T]

      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1
      }
      return 0
    })

    return sorted
  }, [data, sortConfig])

  return {
    data: sortedData,
    sortConfig,
    setSortConfig
  }
}