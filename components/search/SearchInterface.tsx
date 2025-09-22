'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AppliedFiltersBar } from '@/components/search/AppliedFiltersBar'
import { QuickFilterButtons } from '@/components/search/QuickFilterButtons'
import { SearchBuilder } from '@/components/search/SearchBuilder'
import {
  Search,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'

import type { 
  SearchOptions, 
  SearchResult, 
  AppliedFilter,
  SearchFieldConfig,
  QuickFilter
} from '@/lib/search/types'
import type { DailyReport, Site } from '@/types'

interface SearchInterfaceProps {
  fields: SearchFieldConfig[]
  quickFilters: QuickFilter[]
  onSearch: (options: SearchOptions) => Promise<void>
  onQuickFilter: (filterId: string) => Promise<void>
  searchResult?: SearchResult<DailyReport>
  loading?: boolean
  className?: string
  sites: Site[]
}

export function SearchInterface({
  fields,
  quickFilters,
  onSearch,
  onQuickFilter,
  searchResult,
  loading,
  className,
  sites
}: SearchInterfaceProps) {
  const [activeQuickFilters, setActiveQuickFilters] = useState<string[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilter[]>([])

  // Update fields with dynamic site options
  const enhancedFields = fields.map(field => {
    if (field.field === 'site_id') {
      return {
        ...field,
        options: sites.map(site => ({
          value: site.id,
          label: site.name
        }))
      }
    }
    return field
  })

  useEffect(() => {
    if (searchResult?.filters) {
      setAppliedFilters(searchResult.filters)
    }
  }, [searchResult])

  const handleQuickFilterToggle = async (filterId: string) => {
    if (activeQuickFilters.includes(filterId)) {
      // Remove filter
      setActiveQuickFilters(prev => prev.filter(id => id !== filterId))
      // Reset to show all results
      await onSearch({ filters: [], sortBy: 'work_date', sortOrder: 'desc' })
    } else {
      // Add filter
      setActiveQuickFilters(prev => [...prev, filterId])
      await onQuickFilter(filterId)
    }
  }

  const handleClearQuickFilters = async () => {
    setActiveQuickFilters([])
    await onSearch({ filters: [], sortBy: 'work_date', sortOrder: 'desc' })
  }

  const handleAdvancedSearch = async (options: SearchOptions) => {
    await onSearch(options)
    if (!isExpanded) setIsExpanded(false) // Collapse after search
  }

  const handleRemoveAppliedFilter = async (field: string, operator: string, value: unknown) => {
    const newFilters = appliedFilters.filter(f => 
      !(f.field === field && f.operator === operator && f.value === value)
    )
    setAppliedFilters(newFilters)
    
    // Rebuild search options from remaining filters
    const searchOptions: SearchOptions = {
      filters: newFilters.map(f => ({
        field: f.field,
        operator: f.operator,
        value: f.value,
        values: f.values
      })),
      sortBy: 'work_date',
      sortOrder: 'desc'
    }
    
    await onSearch(searchOptions)
  }

  const handleClearAllFilters = async () => {
    setAppliedFilters([])
    setActiveQuickFilters([])
    await onSearch({ filters: [], sortBy: 'work_date', sortOrder: 'desc' })
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Applied Filters Bar */}
      <AppliedFiltersBar
        filters={appliedFilters}
        onRemoveFilter={handleRemoveAppliedFilter}
        onClearAll={handleClearAllFilters}
      />

      {/* Search Interface */}
      <Card className="border-0 shadow-sm">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">검색 및 필터</h3>
              {searchResult && (
                <span className="text-sm text-gray-500">
                  ({searchResult.total}건 중 {searchResult.items.length}건 표시)
                </span>
              )}
            </div>
            <Button
              variant="outline"
              size="compact"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  간단히
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  상세 검색
                </>
              )}
            </Button>
          </div>

          {/* Quick Filters (Always Visible) */}
          <QuickFilterButtons
            quickFilters={quickFilters}
            activeFilters={activeQuickFilters}
            onFilterToggle={handleQuickFilterToggle}
            onClearAll={handleClearQuickFilters}
          />

          {/* Advanced Search (Expandable) */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <SearchBuilder
                fields={enhancedFields}
                onSearch={handleAdvancedSearch}
                loading={loading}
              />
            </div>
          )}
        </div>
      </Card>

      {/* Search Results Summary */}
      {searchResult && searchResult.items.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600 px-1">
          <span>
            총 {searchResult.total}건 중 {searchResult.items.length}건 표시
          </span>
          {searchResult.hasMore && (
            <span className="text-blue-600">더 많은 결과가 있습니다</span>
          )}
        </div>
      )}
    </div>
  )
}
