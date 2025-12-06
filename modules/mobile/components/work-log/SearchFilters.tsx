'use client'

import React, { useState, useCallback } from 'react'
import { Calendar, User, Filter, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SearchFilter {
  dateRange?: {
    start: Date | null
    end: Date | null
  }
  status?: 'all' | 'draft' | 'submitted' | 'approved' | 'rejected'
  author?: string
}

interface SearchFiltersProps {
  filters: SearchFilter
  onFiltersChange: (filters: SearchFilter) => void
  className?: string
  showCompact?: boolean
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  onFiltersChange,
  className,
  showCompact = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(!showCompact)
  const [localFilters, setLocalFilters] = useState<SearchFilter>(filters)

  const hasActiveFilters = useCallback(() => {
    return (
      filters.dateRange?.start ||
      filters.dateRange?.end ||
      (filters.status && filters.status !== 'all') ||
      filters.author
    )
  }, [filters])

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    const date = value ? new Date(value) : null
    const newFilters = {
      ...localFilters,
      dateRange: {
        ...localFilters.dateRange,
        start: field === 'start' ? date : localFilters.dateRange?.start || null,
        end: field === 'end' ? date : localFilters.dateRange?.end || null,
      },
    }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleStatusChange = (status: SearchFilter['status']) => {
    const newFilters = {
      ...localFilters,
      status,
    }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleAuthorChange = (author: string) => {
    const newFilters = {
      ...localFilters,
      author,
    }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const clearFilters = () => {
    const clearedFilters: SearchFilter = {
      dateRange: { start: null, end: null },
      status: 'all',
      author: '',
    }
    setLocalFilters(clearedFilters)
    onFiltersChange(clearedFilters)
  }

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return ''
    return date.toISOString().split('T')[0]
  }

  const activeFilterCount = () => {
    let count = 0
    if (filters.dateRange?.start || filters.dateRange?.end) count++
    if (filters.status && filters.status !== 'all') count++
    if (filters.author) count++
    return count
  }

  if (showCompact && !isExpanded) {
    return (
      <div style={{ position: 'relative' }} className={className}>
        <button
          onClick={() => setIsExpanded(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '12px',
            border: hasActiveFilters()
              ? '1px solid var(--brand, #1A254F)'
              : '1px solid var(--border, #e0e0e0)',
            background: hasActiveFilters()
              ? 'var(--brand-light, rgba(26, 37, 79, 0.05))'
              : 'var(--card, #ffffff)',
            color: 'var(--text, #101828)',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            minHeight: '40px',
          }}
          aria-label="필터 열기"
          aria-expanded={false}
          onMouseEnter={e => {
            e.currentTarget.style.background = hasActiveFilters()
              ? 'var(--brand-light, rgba(26, 37, 79, 0.1))'
              : 'var(--bg, #F6F9FF)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = hasActiveFilters()
              ? 'var(--brand-light, rgba(26, 37, 79, 0.05))'
              : 'var(--card, #ffffff)'
          }}
        >
          <Filter size={16} />
          <span>필터</span>
          {hasActiveFilters() && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '20px',
                height: '20px',
                fontSize: '12px',
                fontWeight: '700',
                color: 'white',
                background: 'var(--brand, #1A254F)',
                borderRadius: '50%',
              }}
            >
              {activeFilterCount()}
            </span>
          )}
        </button>
      </div>
    )
  }

  return (
    <div className={cn('space-y-3 animate-fadeIn', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-[var(--muted)]" />
          <h3 className="text-sm font-semibold text-[var(--text)]">검색 필터</h3>
          {hasActiveFilters() && (
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold text-[var(--brand)] bg-[var(--brand)]/10 rounded-full">
              {activeFilterCount()}개 적용
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters() && (
            <button
              onClick={clearFilters}
              className="text-xs text-[var(--muted)] hover:text-[var(--text)] transition-colors"
              aria-label="필터 초기화"
            >
              초기화
            </button>
          )}
          {showCompact && (
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
              aria-label="필터 닫기"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-xs font-medium text-[var(--muted)]">
          <Calendar size={14} />
          작성일자
        </label>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={formatDate(localFilters.dateRange?.start)}
            onChange={e => handleDateRangeChange('start', e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-[var(--line)] rounded-lg bg-[var(--card)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"
            placeholder="시작일"
            aria-label="시작일"
          />
          <span className="text-xs text-[var(--muted)]">~</span>
          <input
            type="date"
            value={formatDate(localFilters.dateRange?.end)}
            onChange={e => handleDateRangeChange('end', e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-[var(--line)] rounded-lg bg-[var(--card)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"
            placeholder="종료일"
            aria-label="종료일"
          />
        </div>
      </div>

      {/* Status Filter */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-[var(--muted)]">상태</label>
        <div className="flex gap-2 flex-wrap">
          {[
            { value: 'all', label: '전체' },
            { value: 'draft', label: '임시저장' },
            { value: 'submitted', label: '제출' },
            { value: 'approved', label: '승인' },
            { value: 'rejected', label: '반려' },
          ].map(option => (
            <button
              key={option.value}
              onClick={() => handleStatusChange(option.value as SearchFilter['status'])}
              className={cn(
                'flex-1 px-3 py-2 text-xs font-medium rounded-lg border transition-all',
                localFilters.status === option.value
                  ? 'bg-[var(--brand)] text-white border-[var(--brand)]'
                  : 'bg-[var(--card)] text-[var(--text)] border-[var(--line)] hover:bg-[var(--bg-hover)]'
              )}
              aria-pressed={localFilters.status === option.value}
              role="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Author Filter */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-xs font-medium text-[var(--muted)]">
          <User size={14} />
          작성자
        </label>
        <input
          type="text"
          value={localFilters.author || ''}
          onChange={e => handleAuthorChange(e.target.value)}
          placeholder="작성자 이름 입력"
          className="w-full px-3 py-2 text-sm border border-[var(--line)] rounded-lg bg-[var(--card)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"
          aria-label="작성자 검색"
        />
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters() && (
        <div className="pt-2 border-t border-[var(--line)]">
          <div className="flex flex-wrap gap-2">
            {localFilters.dateRange?.start && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-[var(--bg-secondary)] rounded-full">
                시작: {localFilters.dateRange.start.toLocaleDateString()}
              </span>
            )}
            {localFilters.dateRange?.end && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-[var(--bg-secondary)] rounded-full">
                종료: {localFilters.dateRange.end.toLocaleDateString()}
              </span>
            )}
            {localFilters.status && localFilters.status !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-[var(--bg-secondary)] rounded-full">
                상태:{' '}
                {localFilters.status === 'draft'
                  ? '임시저장'
                  : localFilters.status === 'submitted'
                    ? '제출'
                    : localFilters.status === 'approved'
                      ? '승인'
                      : '반려'}
              </span>
            )}
            {localFilters.author && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-[var(--bg-secondary)] rounded-full">
                작성자: {localFilters.author}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
