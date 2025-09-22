'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import {
  Search,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react'

import type { 
  SearchFilter, 
  SearchFieldConfig, 
  SearchOperator,
  SearchOptions 
} from '@/lib/search/types'

interface SearchBuilderProps {
  fields: SearchFieldConfig[]
  onSearch: (options: SearchOptions) => void
  className?: string
  loading?: boolean
}

interface FilterRow {
  id: string
  field: string
  operator: SearchOperator
  value: unknown
  values?: unknown[] // For 'between' operator
}

export function SearchBuilder({ fields, onSearch, className, loading }: SearchBuilderProps) {
  const [filters, setFilters] = useState<FilterRow[]>([])
  const [globalQuery, setGlobalQuery] = useState('')
  const [sortBy, setSortBy] = useState('work_date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const addFilter = () => {
    const newFilter: FilterRow = {
      id: Date.now().toString(),
      field: fields[0]?.field || '',
      operator: fields[0]?.operators[0] || 'contains',
      value: ''
    }
    setFilters([...filters, newFilter])
  }

  const removeFilter = (id: string) => {
    setFilters(filters.filter(f => f.id !== id))
  }

  const updateFilter = (id: string, updates: Partial<FilterRow>) => {
    setFilters(filters.map(f => 
      f.id === id ? { ...f, ...updates } : f
    ))
  }

  const clearAllFilters = () => {
    setFilters([])
    setGlobalQuery('')
  }

  const handleSearch = () => {
    const searchFilters: SearchFilter[] = filters
      .filter(f => f.value !== '' || (f.values && f.values.length > 0))
      .map(f => ({
        field: f.field,
        operator: f.operator,
        value: f.value,
        values: f.values
      }))

    const options: SearchOptions = {
      query: globalQuery || undefined,
      filters: searchFilters,
      sortBy,
      sortOrder
    }

    onSearch(options)
  }

  const getFieldConfig = (fieldName: string) => {
    return fields.find(f => f.field === fieldName)
  }

  const getOperatorLabel = (operator: SearchOperator) => {
    const labels: Record<SearchOperator, string> = {
      contains: '포함',
      equals: '일치',
      startsWith: '시작',
      endsWith: '끝',
      gte: '이상',
      lte: '이하',
      between: '범위'
    }
    return labels[operator] || operator
  }

  const renderValueInput = (filter: FilterRow) => {
    const fieldConfig = getFieldConfig(filter.field)
    if (!fieldConfig) return null

    if (filter.operator === 'between') {
      return (
        <div className="grid grid-cols-2 gap-2">
          <Input
            type={fieldConfig.type === 'date' ? 'date' : fieldConfig.type === 'number' ? 'number' : 'text'}
            placeholder="시작값"
            value={filter.values?.[0] || ''}
            onChange={(e) => updateFilter(filter.id, {
              values: [e.target.value, filter.values?.[1] || '']
            })}
            className="h-8 text-sm"
          />
          <Input
            type={fieldConfig.type === 'date' ? 'date' : fieldConfig.type === 'number' ? 'number' : 'text'}
            placeholder="끝값"
            value={filter.values?.[1] || ''}
            onChange={(e) => updateFilter(filter.id, {
              values: [filter.values?.[0] || '', e.target.value]
            })}
            className="h-8 text-sm"
          />
        </div>
      )
    }

    if (fieldConfig.type === 'select' && fieldConfig.options) {
      return (
        <select
          value={filter.value}
          onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
          className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        >
          <option value="">선택하세요</option>
          {fieldConfig.options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )
    }

    return (
      <Input
        type={fieldConfig.type === 'date' ? 'date' : fieldConfig.type === 'number' ? 'number' : 'text'}
        placeholder={fieldConfig.placeholder}
        value={filter.value}
        onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
        className="h-8 text-sm"
      />
    )
  }

  return (
    <Card className={cn("p-4 space-y-4", className)}>
      {/* Global Search */}
      <div>
        <Label className="text-sm font-medium mb-2 block">전체 검색</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="전체 필드에서 검색..."
            value={globalQuery}
            onChange={(e) => setGlobalQuery(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
      </div>

      {/* Advanced Filters */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-medium">상세 필터</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="compact"
              onClick={addFilter}
            >
              <Plus className="w-4 h-4 mr-1" />
              필터 추가
            </Button>
            {(filters.length > 0 || globalQuery) && (
              <Button
                type="button"
                variant="outline"
                size="compact"
                onClick={clearAllFilters}
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                초기화
              </Button>
            )}
          </div>
        </div>

        {filters.length === 0 ? (
          <div className="text-center py-6 text-gray-500 text-sm">
            필터를 추가하여 정확한 검색을 해보세요
          </div>
        ) : (
          <div className="space-y-3">
            {filters.map((filter, index) => (
              <div key={filter.id} className="grid grid-cols-12 gap-2 items-end">
                {/* Field Selection */}
                <div className="col-span-3">
                  {index === 0 && <Label className="text-xs text-gray-600 mb-1 block">필드</Label>}
                  <select
                    value={filter.field}
                    onChange={(e) => {
                      const fieldConfig = getFieldConfig(e.target.value)
                      updateFilter(filter.id, {
                        field: e.target.value,
                        operator: fieldConfig?.operators[0] || 'contains',
                        value: '',
                        values: undefined
                      })
                    }}
                    className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    {fields.map(field => (
                      <option key={field.field} value={field.field}>
                        {field.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Operator Selection */}
                <div className="col-span-2">
                  {index === 0 && <Label className="text-xs text-gray-600 mb-1 block">조건</Label>}
                  <select
                    value={filter.operator}
                    onChange={(e) => updateFilter(filter.id, {
                      operator: e.target.value as SearchOperator,
                      value: '',
                      values: undefined
                    })}
                    className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    {getFieldConfig(filter.field)?.operators.map(operator => (
                      <option key={operator} value={operator}>
                        {getOperatorLabel(operator)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Value Input */}
                <div className="col-span-6">
                  {index === 0 && <Label className="text-xs text-gray-600 mb-1 block">값</Label>}
                  {renderValueInput(filter)}
                </div>

                {/* Remove Button */}
                <div className="col-span-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="compact"
                    onClick={() => removeFilter(filter.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sort Options */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium mb-2 block">정렬 기준</Label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            {fields.map(field => (
              <option key={field.field} value={field.field}>
                {field.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-sm font-medium mb-2 block">정렬 순서</Label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="desc">내림차순</option>
            <option value="asc">오름차순</option>
          </select>
        </div>
      </div>

      {/* Search Button */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSearch}
          disabled={loading}
          className="min-w-[120px]"
        >
          <Search className="w-4 h-4 mr-2" />
          {loading ? '검색 중...' : '검색'}
        </Button>
      </div>
    </Card>
  )
}
