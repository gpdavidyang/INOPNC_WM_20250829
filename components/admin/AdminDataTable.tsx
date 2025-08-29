'use client'

import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, Search, Filter, MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react'
import { useFontSize,  getTypographyClass, getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'

interface Column<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  filterable?: boolean
  render?: (value: any, row: T) => React.ReactNode
  width?: string
  align?: 'left' | 'center' | 'right'
}

interface AdminDataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  error?: string | null
  // Selection
  selectable?: boolean
  selectedIds?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
  getRowId: (row: T) => string
  // Actions
  onView?: (row: T) => void
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  customActions?: Array<{
    icon: any
    label: string
    onClick: (row: T) => void
    show?: (row: T) => boolean
    variant?: 'default' | 'destructive'
  }>
  // Pagination
  currentPage?: number
  totalPages?: number
  onPageChange?: (page: number) => void
  pageSize?: number
  totalCount?: number
  // Empty state
  emptyMessage?: string
  emptyDescription?: string
}

export default function AdminDataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  error,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  getRowId,
  onView,
  onEdit,
  onDelete,
  customActions = [],
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  pageSize = 10,
  totalCount = 0,
  emptyMessage = '데이터가 없습니다',
  emptyDescription = '조건에 맞는 데이터를 찾을 수 없습니다.'
}: AdminDataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()

  // Handle sorting
  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(columnKey)
      setSortDirection('asc')
    }
  }

  // Handle filtering
  const handleFilter = (columnKey: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [columnKey]: value
    }))
  }

  // Sort and filter data
  const processedData = useMemo(() => {
    let result = [...data]

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value.trim()) {
        result = result.filter(item => {
          const itemValue = String(item[key] || '').toLowerCase()
          return itemValue.includes(value.toLowerCase())
        })
      }
    })

    // Apply sorting
    if (sortColumn) {
      result.sort((a, b) => {
        const aValue = a[sortColumn]
        const bValue = b[sortColumn]
        
        if (aValue === bValue) return 0
        
        let comparison = 0
        if (aValue > bValue) comparison = 1
        if (aValue < bValue) comparison = -1
        
        return sortDirection === 'desc' ? -comparison : comparison
      })
    }

    return result
  }, [data, filters, sortColumn, sortDirection])

  // Handle selection
  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return
    
    if (checked) {
      const allIds = processedData.map(getRowId)
      onSelectionChange(allIds)
    } else {
      onSelectionChange([])
    }
  }

  const handleSelectRow = (rowId: string, checked: boolean) => {
    if (!onSelectionChange) return
    
    if (checked) {
      onSelectionChange([...selectedIds, rowId])
    } else {
      onSelectionChange(selectedIds.filter(id => id !== rowId))
    }
  }

  const isAllSelected = selectedIds.length > 0 && selectedIds.length === processedData.length
  const isPartiallySelected = selectedIds.length > 0 && selectedIds.length < processedData.length

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className={`${
          touchMode === 'glove' ? 'p-10' : touchMode === 'precision' ? 'p-6' : 'p-8'
        } text-center`}>
          <div className={`${getFullTypographyClass('body', 'base', isLargeFont)} text-red-600 mb-2`}>오류가 발생했습니다</div>
          <div className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-500`}>{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1400px] divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              {selectable && (
                <th className={`${
                  touchMode === 'glove' ? 'px-7 py-4' : touchMode === 'precision' ? 'px-5 py-2' : 'px-6 py-3'
                } text-left ${getFullTypographyClass('caption', 'xs', isLargeFont)} font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-12`}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={input => {
                      if (input) input.indeterminate = isPartiallySelected
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
              )}
              
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`${
                    touchMode === 'glove' ? 'px-7 py-4' : touchMode === 'precision' ? 'px-5 py-2' : 'px-6 py-3'
                  } ${getFullTypographyClass('caption', 'xs', isLargeFont)} font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                    column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                  style={{ width: column.width }}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {column.sortable && (
                      <button
                        onClick={() => handleSort(String(column.key))}
                        className={`text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ${
                          touchMode === 'glove' ? 'p-2' : touchMode === 'precision' ? 'p-0.5' : 'p-1'
                        }`}
                      >
                        {sortColumn === column.key ? (
                          sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        )}
                      </button>
                    )}
                  </div>
                  
                  {column.filterable && (
                    <div className="mt-2">
                      <input
                        type="text"
                        placeholder="필터..."
                        value={filters[String(column.key)] || ''}
                        onChange={(e) => handleFilter(String(column.key), e.target.value)}
                        className={`block w-full ${getFullTypographyClass('caption', 'xs', isLargeFont)} ${
                          touchMode === 'glove' ? 'px-3 py-2' : touchMode === 'precision' ? 'px-1.5 py-0.5' : 'px-2 py-1'
                        } border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                      />
                    </div>
                  )}
                </th>
              ))}
              
              {(onView || onEdit || onDelete || customActions.length > 0) && (
                <th className={`${
                  touchMode === 'glove' ? 'px-7 py-4' : touchMode === 'precision' ? 'px-5 py-2' : 'px-6 py-3'
                } text-center ${getFullTypographyClass('caption', 'xs', isLargeFont)} font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[150px]`}>
                  작업
                </th>
              )}
            </tr>
          </thead>
          
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              // Loading skeleton
              Array.from({ length: pageSize }).map((_, index) => (
                <tr key={index}>
                  {selectable && (
                    <td className={`${
                      touchMode === 'glove' ? 'px-7 py-5' : touchMode === 'precision' ? 'px-5 py-3' : 'px-6 py-4'
                    } whitespace-nowrap`}>
                      <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td key={String(column.key)} className={`${
                      touchMode === 'glove' ? 'px-7 py-5' : touchMode === 'precision' ? 'px-5 py-3' : 'px-6 py-4'
                    } whitespace-nowrap`}>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </td>
                  ))}
                  {(onView || onEdit || onDelete || customActions.length > 0) && (
                    <td className={`${
                      touchMode === 'glove' ? 'px-7 py-5' : touchMode === 'precision' ? 'px-5 py-3' : 'px-6 py-4'
                    } whitespace-nowrap text-right`}>
                      <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ml-auto" />
                    </td>
                  )}
                </tr>
              ))
            ) : processedData.length === 0 ? (
              // Empty state
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + ((onView || onEdit || onDelete || customActions.length > 0) ? 1 : 0)} className={`${
                  touchMode === 'glove' ? 'px-7 py-14' : touchMode === 'precision' ? 'px-5 py-10' : 'px-6 py-12'
                } text-center`}>
                  <div className="text-gray-500 dark:text-gray-400">
                    <div className={`${getFullTypographyClass('heading', 'lg', isLargeFont)} font-medium mb-2`}>{emptyMessage}</div>
                    <div className={getFullTypographyClass('body', 'sm', isLargeFont)}>{emptyDescription}</div>
                  </div>
                </td>
              </tr>
            ) : (
              // Data rows
              processedData.map((row) => {
                const rowId = getRowId(row)
                const isSelected = selectedIds.includes(rowId)
                
                return (
                  <tr key={rowId} className={isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}>
                    {selectable && (
                      <td className={`${
                        touchMode === 'glove' ? 'px-7 py-5' : touchMode === 'precision' ? 'px-5 py-3' : 'px-6 py-4'
                      } whitespace-nowrap`}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleSelectRow(rowId, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                    )}
                    
                    {columns.map((column) => {
                      const value = row[column.key as keyof T]
                      return (
                        <td
                          key={String(column.key)}
                          className={`${
                            touchMode === 'glove' ? 'px-7 py-5' : touchMode === 'precision' ? 'px-5 py-3' : 'px-6 py-4'
                          } whitespace-nowrap ${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-900 dark:text-gray-100 ${
                            column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'
                          }`}
                        >
                          {column.render ? column.render(value, row) : String(value || '')}
                        </td>
                      )
                    })}
                    
                    {(onView || onEdit || onDelete || customActions.length > 0) && (
                      <td className={`${
                        touchMode === 'glove' ? 'px-7 py-5' : touchMode === 'precision' ? 'px-5 py-3' : 'px-6 py-4'
                      } whitespace-nowrap text-center ${getFullTypographyClass('body', 'sm', isLargeFont)}`}>
                        <div className="flex items-center justify-center gap-2">
                          {onView && (
                            <button
                              onClick={() => onView(row)}
                              className={`text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700 rounded ${
                                touchMode === 'glove' ? 'p-2' : touchMode === 'precision' ? 'p-0.5' : 'p-1'
                              } transition-colors`}
                              title="보기"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          )}
                          {onEdit && (
                            <button
                              onClick={() => onEdit(row)}
                              className={`text-blue-600 hover:text-blue-900 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-100 dark:hover:bg-blue-900/20 rounded ${
                                touchMode === 'glove' ? 'p-2' : touchMode === 'precision' ? 'p-0.5' : 'p-1'
                              } transition-colors`}
                              title="편집"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                          {customActions.map((action, index) => {
                            if (action.show && !action.show(row)) return null
                            
                            const Icon = action.icon
                            return (
                              <button
                                key={index}
                                onClick={() => action.onClick(row)}
                                className={`${
                                  action.variant === 'destructive'
                                    ? 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-100'
                                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                                } ${
                                  touchMode === 'glove' ? 'p-2' : touchMode === 'precision' ? 'p-0.5' : 'p-1'
                                }`}
                                title={action.label}
                              >
                                <Icon className="h-4 w-4" />
                              </button>
                            )
                          })}
                          {onDelete && (
                            <button
                              onClick={() => onDelete(row)}
                              className={`text-red-600 hover:text-red-900 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-100 dark:hover:bg-red-900/20 rounded ${
                                touchMode === 'glove' ? 'p-2' : touchMode === 'precision' ? 'p-0.5' : 'p-1'
                              } transition-colors`}
                              title="삭제"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && onPageChange && (
        <div className={`${
          touchMode === 'glove' ? 'px-7 py-4' : touchMode === 'precision' ? 'px-5 py-2' : 'px-6 py-3'
        } border-t border-gray-200 dark:border-gray-700 flex items-center justify-between`}>
          <div className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-700 dark:text-gray-300`}>
            총 {totalCount}개 중 {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalCount)}개 표시
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`${
                touchMode === 'glove' ? 'px-4 py-2' : touchMode === 'precision' ? 'px-2 py-0.5' : 'px-3 py-1'
              } ${getFullTypographyClass('button', 'sm', isLargeFont)} border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              이전
            </button>
            
            <span className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-700 dark:text-gray-300`}>
              {currentPage} / {totalPages}
            </span>
            
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`${
                touchMode === 'glove' ? 'px-4 py-2' : touchMode === 'precision' ? 'px-2 py-0.5' : 'px-3 py-1'
              } ${getFullTypographyClass('button', 'sm', isLargeFont)} border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              다음
            </button>
          </div>
        </div>
      )}
    </div>
  )
}