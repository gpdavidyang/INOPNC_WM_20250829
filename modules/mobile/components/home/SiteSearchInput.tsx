'use client'

import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

interface Site {
  id: string
  name: string
  organization_id?: string | null
  organization_name?: string | null
}

interface SiteSearchInputProps {
  // Controlled state
  siteQuery: string
  onQueryChange: (query: string) => void
  siteDropdownOpen: boolean
  setSiteDropdownOpen: (open: boolean) => void
  siteActiveIndex: number
  setSiteActiveIndex: (index: number | ((prev: number) => number)) => void

  // Data
  sites: Site[]
  sitesLoading: boolean
  sitesError: string | null
  siteDropdownItems: Site[]

  // Actions
  onSiteSelect: (site: Site) => void
  onClear: () => void

  // Refs
  siteUserEditingRef: React.MutableRefObject<boolean>
}

// Expose internal input focus method
export interface SiteSearchHandle {
  focus: () => void
}

export const SiteSearchInput = forwardRef<SiteSearchHandle, SiteSearchInputProps>(
  (
    {
      siteQuery,
      onQueryChange,
      siteDropdownOpen,
      setSiteDropdownOpen,
      siteActiveIndex,
      setSiteActiveIndex,
      sites,
      sitesLoading,
      sitesError,
      siteDropdownItems,
      onSiteSelect,
      onClear,
      siteUserEditingRef,
    },
    ref
  ) => {
    const inputRef = useRef<HTMLInputElement>(null)

    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus()
      },
    }))

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Escape') {
        setSiteDropdownOpen(false)
        siteUserEditingRef.current = false
        return
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setSiteDropdownOpen(true)
        setSiteActiveIndex(prev => Math.min(prev + 1, Math.max(0, siteDropdownItems.length - 1)))
        return
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setSiteDropdownOpen(true)
        setSiteActiveIndex(prev => Math.max(prev - 1, 0))
        return
      }

      if (event.key === 'Enter') {
        if (!siteDropdownOpen) return
        event.preventDefault()
        const chosen = siteDropdownItems[siteActiveIndex]
        if (chosen) {
          onSiteSelect(chosen)
        }
      }
    }

    // Close dropdown on click outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node
        if (!siteDropdownOpen) return

        const wrap = document.querySelector('.site-search')
        if (wrap && !wrap.contains(target)) {
          setSiteDropdownOpen(false)
          siteUserEditingRef.current = false
        }
      }

      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [siteDropdownOpen, setSiteDropdownOpen, siteUserEditingRef])

    return (
      <div className="site-search">
        <div className="site-search-wrap">
          <input
            ref={inputRef}
            value={siteQuery}
            onChange={event => onQueryChange(event.target.value)}
            onFocus={() => setSiteDropdownOpen(true)}
            onKeyDown={handleKeyDown}
            className="site-search-input"
            placeholder={
              sitesLoading && sites.length === 0
                ? '현장 목록 불러오는 중...'
                : sitesError
                  ? '현장 목록 불러오기 실패'
                  : '현장 선택 또는 검색'
            }
            role="combobox"
            aria-expanded={siteDropdownOpen}
            aria-controls="site-search-listbox"
            aria-activedescendant={
              siteDropdownOpen && siteDropdownItems[siteActiveIndex]
                ? `site-opt-${siteDropdownItems[siteActiveIndex].id}`
                : undefined
            }
            inputMode="search"
            autoComplete="off"
          />
          {siteQuery.trim() && (
            <button type="button" className="site-search-clear" onClick={onClear}>
              <span className="sr-only">현장 검색어 지우기</span>×
            </button>
          )}
        </div>

        {siteDropdownOpen && (
          <div className="site-search-dropdown" role="listbox" id="site-search-listbox">
            {sitesLoading && sites.length === 0 ? (
              <div className="site-search-empty">현장 목록 불러오는 중...</div>
            ) : siteDropdownItems.length > 0 ? (
              siteDropdownItems.map((site, index) => (
                <button
                  key={site.id}
                  id={`site-opt-${site.id}`}
                  type="button"
                  role="option"
                  aria-selected={index === siteActiveIndex}
                  className={['site-search-option', index === siteActiveIndex ? 'active' : ''].join(
                    ' '
                  )}
                  onMouseEnter={() => setSiteActiveIndex(index)}
                  onClick={() => onSiteSelect(site)}
                >
                  <span>{site.name}</span>
                </button>
              ))
            ) : (
              <div className="site-search-empty">검색 결과가 없습니다.</div>
            )}
          </div>
        )}
      </div>
    )
  }
)

SiteSearchInput.displayName = 'SiteSearchInput'
