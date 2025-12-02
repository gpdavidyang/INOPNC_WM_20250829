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

  return (
    <div className="search-page">
      <div className="search-header">
        <button className="back-btn" onClick={onClose}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="search-input-wrapper">
          <Search className="search-page-icon" />
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="현장, 작업일지, 문서 검색"
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
              className="search-clear-btn"
              aria-label="검색어 비우기"
              onClick={clearSearchInput}
            >
              &times;
            </button>
          )}
        </div>
      </div>

      <div className="search-body">
        {!searchQuery && recentSearches.length > 0 && (
          <div className="recent-searches">
            <div className="section-header">
              <h3>최근 검색</h3>
              <button onClick={clearRecentSearches}>전체 삭제</button>
            </div>
            <div className="recent-list">
              {recentSearches.map((search, index) => (
                <div key={`${search}-${index}`} className="recent-item-row">
                  <button
                    type="button"
                    className="recent-item"
                    onClick={() => {
                      setSearchQuery(search)
                      if (searchTimeoutRef.current) {
                        clearTimeout(searchTimeoutRef.current)
                      }
                      runSearch(search)
                    }}
                  >
                    <Search className="w-4 h-4" />
                    <span>{search}</span>
                  </button>
                  <button
                    type="button"
                    className="recent-remove-btn"
                    aria-label={`${search} 검색어 삭제`}
                    onClick={() => removeRecentSearch(search)}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {searchQuery && (
          <div className="search-results">
            <div className="section-header">
              <h3>검색 결과</h3>
              <span>{isSearching ? '검색 중…' : `${searchResults.length}건`}</span>
            </div>
            {isSearching && (
              <div className="search-loading">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>검색 결과를 불러오는 중입니다…</span>
              </div>
            )}
            {!isSearching && searchResults.length > 0 && (
              <div className="results-list">
                {resultOrder.map(group => {
                  const items = groupedResults[group.key]
                  if (!items.length) return null
                  return (
                    <div key={group.key} className="result-group">
                      <div className="group-header">
                        <span className="group-icon">{group.icon}</span>
                        <span className="group-title">{group.label}</span>
                      </div>
                      <div className="group-list">
                        {items.map(item => (
                          <button
                            key={`${item.type}-${item.id}`}
                            className="result-item"
                            onClick={() => handleResultClick(item)}
                          >
                            <div className="result-item-content">
                              <div className="result-title-row">
                                <span className="result-title">{item.title || '제목 없음'}</span>
                                {item.badge && (
                                  <span
                                    className={`priority-badge priority-${item.badgeColor || 'gray'}`}
                                  >
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              {item.subtitle && <p className="result-snippet">{item.subtitle}</p>}
                              {item.description && (
                                <p className="result-date">{item.description}</p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {!isSearching && hasSearched && !searchResults.length && (
              <div className="no-results">
                <Search className="w-12 h-12" />
                <p>&lsquo;{searchQuery}&rsquo;에 대한 검색 결과가 없습니다.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .search-page {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--bg);
          z-index: 2000;
          display: flex;
          flex-direction: column;
          animation: slideIn 0.3s ease;
        }

        .search-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: var(--card);
          border-bottom: 1px solid var(--line);
        }

        .back-btn {
          background: transparent;
          border: none;
          padding: 8px;
          cursor: pointer;
          color: var(--text);
          border-radius: 8px;
          transition: background 0.2s;
        }

        .back-btn:hover {
          background: rgba(0, 0, 0, 0.05);
        }

        [data-theme='dark'] .back-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .search-input-wrapper {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--surface-2);
          border: 1px solid var(--line);
          border-radius: 20px;
          min-height: 40px;
          padding: 0 44px 0 14px;
        }

        .search-page-icon {
          width: 20px;
          height: 20px;
          color: var(--muted-ink);
          flex-shrink: 0;
          pointer-events: none;
          position: static;
          display: inline-flex;
        }

        .search-input {
          flex: 1 1 auto;
          min-width: 0;
          width: auto;
          height: 40px;
          padding: 0 4px;
          background: transparent;
          border: none;
          border-radius: 0;
          font-size: 16px;
          color: var(--text);
          outline: none;
          transition: all 0.2s;
        }

        .search-input::placeholder {
          color: var(--muted-ink);
        }

        .search-input:focus,
        .search-input:focus-visible {
          outline: none !important;
          box-shadow: none !important; /* suppress global focus ring */
        }

        .search-input-wrapper:focus-within {
          border-color: var(--line);
          background: var(--surface-2);
          box-shadow: none;
        }
        .search-clear-btn {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(0, 0, 0, 0.05);
          color: var(--text);
          border: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 18px;
          line-height: 1;
        }
        [data-theme='dark'] .search-clear-btn {
          background: rgba(255, 255, 255, 0.1);
          color: #e6e9f1;
        }

        .search-body {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .section-header h3 {
          font-size: 16px;
          font-weight: 600;
          color: var(--text);
        }

        [data-theme='dark'] .section-header h3 {
          color: #e6e9f1;
        }

        .section-header button {
          background: transparent;
          border: none;
          color: var(--tag-blue);
          font-size: 14px;
          cursor: pointer;
        }

        .section-header span {
          color: var(--muted-ink);
          font-size: 14px;
        }

        [data-theme='dark'] .section-header span {
          color: #a8b0bb;
        }

        .recent-list,
        .results-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .recent-item-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .recent-item,
        .result-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 10px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
          color: var(--text);
          font-size: 15px;
          width: 100%;
        }

        .recent-remove-btn {
          flex-shrink: 0;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: none;
          background: rgba(0, 0, 0, 0.05);
          color: var(--text);
          cursor: pointer;
          font-size: 18px;
          line-height: 1;
        }

        [data-theme='dark'] .recent-remove-btn {
          background: rgba(255, 255, 255, 0.1);
          color: #e6e9f1;
        }

        .recent-item:hover,
        .result-item:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 14px rgba(0, 0, 0, 0.06);
        }

        .recent-item:active,
        .result-item:active {
          transform: translateY(0);
        }

        .result-item {
          align-items: flex-start;
        }

        .result-item-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
          width: 100%;
        }

        .result-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .result-title {
          font-weight: 600;
          font-size: 15px;
          color: var(--text);
          flex: 1 1 auto;
        }

        .result-snippet {
          color: var(--muted-ink);
          font-size: 13px;
        }

        .result-date {
          color: var(--muted-ink);
          font-size: 12px;
        }

        .priority-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 8px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
        }
        .priority-blue {
          background: #e5f0ff;
          color: #1d4ed8;
        }
        .priority-green {
          background: #e8f7ef;
          color: #15803d;
        }
        .priority-yellow {
          background: #fff7e6;
          color: #b45309;
        }
        .priority-red {
          background: #fde8e8;
          color: #c53030;
        }
        .priority-gray {
          background: #f3f4f6;
          color: #374151;
        }

        .search-loading {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--muted-ink);
          font-size: 14px;
        }

        .no-results {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: var(--muted-ink);
          padding: 16px;
        }

        .result-group {
          margin-bottom: 16px;
        }

        .group-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          color: var(--muted-ink);
          font-weight: 600;
        }

        .group-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .group-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        @keyframes slideIn {
          from {
            transform: translateY(8px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
