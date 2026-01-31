'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { ArrowLeft, Search, Building2, Users, FileText, Activity, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SearchPageProps {
  isOpen: boolean
  onClose: () => void
}

type SearchItemType = 'site' | 'user' | 'worklog' | 'document'

interface SearchResult {
  id: string
  type: SearchItemType
  title: string
  subtitle?: string
  description?: string
  url: string
  badge?: string
  badgeColor?: 'green' | 'blue' | 'yellow' | 'red' | 'gray'
}

export const SearchPage: React.FC<SearchPageProps> = ({ isOpen, onClose }) => {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const clearSearchInput = useCallback(() => {
    setSearchQuery('')
    setSearchResults([])
    setHasSearched(false)
  }, [])

  const groupedResults = useMemo(() => {
    const groups: Record<SearchItemType, SearchResult[]> = {
      site: [],
      user: [],
      worklog: [],
      document: [],
    }
    searchResults.forEach(item => {
      groups[item.type].push(item)
    })
    return groups
  }, [searchResults])

  const resultOrder: { key: SearchItemType; label: string; icon: React.ReactNode }[] = [
    { key: 'worklog', label: '작업일지', icon: <Activity className="w-4 h-4" /> },
    { key: 'site', label: '현장', icon: <Building2 className="w-4 h-4" /> },
    { key: 'document', label: '문서', icon: <FileText className="w-4 h-4" /> },
    { key: 'user', label: '사용자', icon: <Users className="w-4 h-4" /> },
  ]

  const runSearch = useCallback(async (rawQuery: string) => {
    const query = rawQuery.trim()

    if (!query) {
      setSearchResults([])
      setHasSearched(false)
      return
    }

    setIsSearching(true)
    setHasSearched(true)

    try {
      const params = new URLSearchParams({ q: query, limit: '5' })
      const response = await fetch(`/api/admin/global-search?${params.toString()}`, {
        cache: 'no-store',
      })
      if (!response.ok) {
        throw new Error('검색 요청 실패')
      }
      const data = await response.json().catch(() => ({}))
      const items = Array.isArray(data?.items) ? data.items : []
      setSearchResults(items)

      setRecentSearches(prev => {
        const next = [query, ...prev.filter(item => item !== query)].slice(0, 5)
        try {
          localStorage.setItem('inopnc_recent_searches', JSON.stringify(next))
        } catch (_) {
          /* ignore storage errors */
        }
        return next
      })
    } catch (error) {
      console.error('Global search failed', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  const scheduleSearch = useCallback(
    (query: string) => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }

      const trimmed = query.trim()
      if (!trimmed) {
        setSearchResults([])
        setHasSearched(false)
        return
      }

      searchTimeoutRef.current = setTimeout(() => {
        runSearch(query)
      }, 250)
    },
    [runSearch]
  )

  // 최근 검색어 불러오기
  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('inopnc_recent_searches')
      if (saved) {
        setRecentSearches(JSON.parse(saved))
      }
      // 포커스 설정
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  // 검색어 입력 처리
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    scheduleSearch(query)
  }

  const handleResultClick = (item: SearchResult) => {
    if (!item?.url) return
    onClose()
    router.push(item.url)
  }

  // 최근 검색어 삭제
  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem('inopnc_recent_searches')
  }

  const removeRecentSearch = useCallback((term: string) => {
    setRecentSearches(prev => {
      const next = prev.filter(item => item !== term)
      try {
        if (next.length === 0) {
          localStorage.removeItem('inopnc_recent_searches')
        } else {
          localStorage.setItem('inopnc_recent_searches', JSON.stringify(next))
        }
      } catch {
        /* ignore storage errors */
      }
      return next
    })
  }, [])

  if (!isOpen) return null

  const renderResultGroups = () => {
    if (!searchQuery) return null
    if (isSearching) {
      return (
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          검색 결과를 불러오는 중입니다…
        </div>
      )
    }
    if (!searchResults.length && hasSearched) {
      return (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 px-6 py-10 text-center text-sm text-slate-500">
          <Search className="h-8 w-8 text-slate-400" />
          <p>
            ‘<span className="font-semibold">{searchQuery}</span>’에 대한 검색 결과가 없습니다.
          </p>
        </div>
      )
    }
    return resultOrder.map(group => {
      const items = groupedResults[group.key]
      if (!items.length) return null
      return (
        <div key={group.key} className="rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-800">
            <span className="text-slate-500">{group.icon}</span>
            {group.label}
            <span className="ml-auto text-xs font-medium text-slate-400">{items.length}건</span>
          </div>
          <div className="divide-y divide-slate-100">
            {items.map(item => (
              <button
                key={`${item.type}-${item.id}`}
                type="button"
                onClick={() => handleResultClick(item)}
                className="flex w-full flex-col items-start gap-1 px-4 py-3 text-left transition hover:bg-slate-50"
              >
                <div className="flex w-full items-center gap-2">
                  <span className="truncate text-sm font-semibold text-slate-900">
                    {item.title || '제목 없음'}
                  </span>
                  {item.badge && (
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                      {item.badge}
                    </span>
                  )}
                </div>
                {item.subtitle && (
                  <p className="truncate text-xs text-slate-500">{item.subtitle}</p>
                )}
                {item.description && (
                  <p className="truncate text-xs text-slate-400">{item.description}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      )
    })
  }

  return (
    <div className="fixed inset-0 z-[2000] flex justify-center bg-[var(--bg)]">
      <div className="flex h-full w-full max-w-[600px] flex-col bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-700 transition hover:bg-slate-50"
            aria-label="검색 닫기"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm text-slate-900 outline-none transition focus:border-[#1A254F] focus:bg-white focus:ring-2 focus:ring-[#1A254F]/10"
              placeholder="현장, 작업일지, 문서를 검색하세요"
              value={searchQuery}
              onChange={handleInputChange}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  if (searchTimeoutRef.current) {
                    clearTimeout(searchTimeoutRef.current)
                  }
                  runSearch(searchQuery)
                }
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearchInput}
                aria-label="검색어 비우기"
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600 transition hover:bg-slate-300"
              >
                ×
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50/80 px-4 py-5">
          <div className="mx-auto flex w-full max-w-[520px] flex-col gap-6">
            {!searchQuery && recentSearches.length > 0 && (
              <div className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                  <span>최근 검색어</span>
                  <button
                    type="button"
                    className="text-xs font-medium text-slate-500 transition hover:text-slate-700"
                    onClick={clearRecentSearches}
                  >
                    전체 삭제
                  </button>
                </div>
                <div className="space-y-2">
                  {recentSearches.map((term, index) => (
                    <div
                      key={`${term}-${index}`}
                      className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2"
                    >
                      <button
                        type="button"
                        className="flex flex-1 items-center gap-2 text-left text-sm font-medium text-slate-700 transition hover:text-slate-900"
                        onClick={() => {
                          setSearchQuery(term)
                          if (searchTimeoutRef.current) {
                            clearTimeout(searchTimeoutRef.current)
                          }
                          runSearch(term)
                        }}
                      >
                        <Search className="h-4 w-4 text-slate-400" />
                        <span className="truncate">{term}</span>
                      </button>
                      <button
                        type="button"
                        className="text-xs text-slate-400 transition hover:text-slate-600"
                        aria-label={`${term} 검색어 삭제`}
                        onClick={() => removeRecentSearch(term)}
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchQuery && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span className="font-semibold text-slate-900">검색 결과</span>
                  <span>{isSearching ? '검색 중…' : `${searchResults.length}건`}</span>
                </div>
                <div className="space-y-4">{renderResultGroups()}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
