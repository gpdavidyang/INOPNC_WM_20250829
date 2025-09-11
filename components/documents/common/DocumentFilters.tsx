'use client'

import { Search, Filter, Grid, List, ChevronDown, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

interface DocumentFiltersProps {
  // Search
  searchTerm: string
  onSearchChange: (term: string) => void
  searchPlaceholder?: string

  // Category filter
  categories: Array<{ id: string; label: string; icon?: any }>
  selectedCategory: string
  onCategoryChange: (category: string) => void

  // Site filter (optional)
  sites?: Array<{ id: string; name: string }>
  selectedSite?: string
  onSiteChange?: (site: string) => void

  // Sorting
  sortOptions: Array<{ value: string; label: string }>
  selectedSort: string
  onSortChange: (sort: string) => void

  // View mode
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void

  // Upload (optional)
  showUpload?: boolean
  onUploadClick?: () => void
  uploadLoading?: boolean

  // Selection mode (optional)
  isSelectionMode?: boolean
  selectedCount?: number
  onToggleSelectionMode?: () => void
  onClearSelection?: () => void

  // Additional actions
  additionalActions?: React.ReactNode

  // Styling
  className?: string
  compact?: boolean
}

export default function DocumentFilters({
  searchTerm,
  onSearchChange,
  searchPlaceholder = '문서 검색...',
  categories,
  selectedCategory,
  onCategoryChange,
  sites,
  selectedSite,
  onSiteChange,
  sortOptions,
  selectedSort,
  onSortChange,
  viewMode,
  onViewModeChange,
  showUpload = false,
  onUploadClick,
  uploadLoading = false,
  isSelectionMode = false,
  selectedCount = 0,
  onToggleSelectionMode,
  onClearSelection,
  additionalActions,
  className = '',
  compact = false
}: DocumentFiltersProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header row with title and primary actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Selection mode indicator */}
          {isSelectionMode && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                {selectedCount}개 선택됨
              </Badge>
              {onClearSelection && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearSelection}
                  className="h-8 px-2"
                >
                  <X className="h-4 w-4" />
                  선택 해제
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Selection toggle */}
          {onToggleSelectionMode && (
            <Button
              variant={isSelectionMode ? 'default' : 'outline'}
              size="sm"
              onClick={onToggleSelectionMode}
              className="h-8"
            >
              {isSelectionMode ? '선택 완료' : '선택 모드'}
            </Button>
          )}

          {/* Upload button */}
          {showUpload && onUploadClick && (
            <Button
              onClick={onUploadClick}
              disabled={uploadLoading}
              size="sm"
              className="h-8"
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploadLoading ? '업로드 중...' : '업로드'}
            </Button>
          )}

          {/* View mode toggle */}
          <div className="flex border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('grid')}
              className="h-8 rounded-none border-0"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('list')}
              className="h-8 rounded-none border-0"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Additional actions */}
          {additionalActions}
        </div>
      </div>

      {/* Filter row */}
      <div className={`grid gap-3 ${compact ? 'grid-cols-1 md:grid-cols-4' : 'grid-cols-1 lg:grid-cols-5'}`}>
        {/* Search */}
        <div className={`relative ${compact ? 'md:col-span-2' : 'lg:col-span-2'}`}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category filter */}
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger>
            <SelectValue placeholder="카테고리" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category.id} value={category.id}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Site filter (if provided) */}
        {sites && onSiteChange && (
          <Select value={selectedSite} onValueChange={onSiteChange}>
            <SelectTrigger>
              <SelectValue placeholder="현장 선택" />
            </SelectTrigger>
            <SelectContent>
              {sites.map(site => (
                <SelectItem key={site.id} value={site.id}>
                  {site.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Sort */}
        <Select value={selectedSort} onValueChange={onSortChange}>
          <SelectTrigger>
            <SelectValue placeholder="정렬" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Active filters display */}
      {(selectedCategory !== 'all' || (selectedSite && selectedSite !== 'all') || searchTerm) && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500 dark:text-gray-400">활성 필터:</span>
          
          {selectedCategory !== 'all' && (
            <Badge 
              variant="secondary" 
              className="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
              onClick={() => onCategoryChange('all')}
            >
              {categories.find(c => c.id === selectedCategory)?.label}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          )}

          {selectedSite && selectedSite !== 'all' && sites && onSiteChange && (
            <Badge 
              variant="secondary" 
              className="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
              onClick={() => onSiteChange('all')}
            >
              {sites.find(s => s.id === selectedSite)?.name}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          )}

          {searchTerm && (
            <Badge 
              variant="secondary" 
              className="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
              onClick={() => onSearchChange('')}
            >
              "{searchTerm}"
              <X className="h-3 w-3 ml-1" />
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onSearchChange('')
              onCategoryChange('all')
              if (onSiteChange) onSiteChange('all')
            }}
            className="h-6 px-2 text-xs"
          >
            모든 필터 지우기
          </Button>
        </div>
      )}
    </div>
  )
}