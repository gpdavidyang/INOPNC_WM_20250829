'use client'

import React from 'react'
import clsx from 'clsx'
import { Search, X, RotateCcw, ChevronDown } from 'lucide-react'
import '@/modules/mobile/styles/worklogs.css'
import { WorklogStatus } from '@/types/worklog'

type Option = {
  value: string
  label: string
}

type SiteOption = Option & {
  description?: string
}

const STATUS_LABELS: Record<WorklogStatus, string> = {
  draft: '임시 저장',
  submitted: '제출 완료',
  approved: '승인 완료',
  rejected: '반려',
}

const STATUS_HINT: Partial<Record<WorklogStatus, string>> = {
  draft: '작성 중인 작업일지',
  submitted: '제출 대기 혹은 검토 중',
  approved: '승인 완료된 건',
  rejected: '보완 요청 건',
}

export interface FilterBarProps {
  sites: SiteOption[]
  selectedSite?: string
  onSiteChange?: (siteId: string) => void
  periodOptions: Option[]
  selectedPeriod?: string
  onPeriodChange?: (value: string) => void
  query?: string
  onQueryChange?: (value: string) => void
  onQuerySubmit?: () => void
  activeStatuses?: WorklogStatus[]
  onStatusToggle?: (status: WorklogStatus) => void
  onClearFilters?: () => void
  isCompact?: boolean
  className?: string
}

export const FilterBar: React.FC<FilterBarProps> = ({
  sites,
  selectedSite,
  onSiteChange,
  periodOptions,
  selectedPeriod,
  onPeriodChange,
  query = '',
  onQueryChange,
  onQuerySubmit,
  activeStatuses = [],
  onStatusToggle,
  onClearFilters,
  isCompact = false,
  className = '',
}) => {
  const handleQueryKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      onQuerySubmit?.()
    }
  }

  const handleQueryClear = () => {
    onQueryChange?.('')
    onQuerySubmit?.()
  }

  const hasActiveFilters = Boolean(
    (selectedSite && selectedSite !== 'all') ||
      (selectedPeriod && selectedPeriod !== 'recent') ||
      query.trim() ||
      activeStatuses.length > 0
  )

  return (
    <section className={clsx('worklogs-section-card', 'worklogs-filter-bar', className)}>
      <div className={clsx('filter-row', isCompact && 'compact')}>
        <div className="filter-field">
          <select
            className="filter-select"
            value={selectedSite ?? ''}
            onChange={event => onSiteChange?.(event.target.value)}
            aria-label="현장 선택"
          >
            {sites.map(site => (
              <option key={site.value} value={site.value}>
                {site.label}
              </option>
            ))}
          </select>
          <ChevronDown className="select-chevron" size={18} aria-hidden="true" />
        </div>

        <div className="filter-field">
          <select
            className="filter-select"
            value={selectedPeriod ?? ''}
            onChange={event => onPeriodChange?.(event.target.value)}
            aria-label="조회 기간"
          >
            {periodOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="select-chevron" size={18} aria-hidden="true" />
        </div>

        <div className={clsx('search-wrapper', query ? 'active' : undefined)}>
          <Search className="search-icon" size={18} aria-hidden="true" />
          <input
            className="filter-search-input"
            value={query}
            onChange={event => onQueryChange?.(event.target.value)}
            onKeyDown={handleQueryKeyDown}
            placeholder="작업일지 검색 (현장, 작성자, 공정 등)"
            aria-label="작업일지 검색"
            inputMode="search"
          />
          <button
            type="button"
            className="clear-search-btn"
            onClick={handleQueryClear}
            aria-label="검색어 지우기"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="status-chip-row" role="group" aria-label="작업일지 상태 필터">
        {(Object.keys(STATUS_LABELS) as WorklogStatus[]).map(status => {
          const isActive = activeStatuses.includes(status)
          return (
            <button
              key={status}
              type="button"
              className={clsx('status-chip', isActive && 'active')}
              onClick={() => onStatusToggle?.(status)}
              aria-pressed={isActive}
              title={STATUS_HINT[status] ?? STATUS_LABELS[status]}
            >
              <span>{STATUS_LABELS[status]}</span>
            </button>
          )
        })}
      </div>

      <div className="filter-actions">
        <button
          type="button"
          className="clear-filters-btn"
          onClick={onClearFilters}
          disabled={!hasActiveFilters}
        >
          <RotateCcw size={16} aria-hidden="true" />
          <span style={{ marginLeft: 6 }}>필터 초기화</span>
        </button>
      </div>
    </section>
  )
}

export default FilterBar
