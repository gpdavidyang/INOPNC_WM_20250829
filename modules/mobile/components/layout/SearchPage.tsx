'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { ArrowLeft, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SearchPageProps {
  isOpen: boolean
  onClose: () => void
}

interface AnnouncementResult {
  id: string
  title: string
  content: string
  priority?: string | null
  created_at?: string | null
}

const priorityLabels: Record<string, string> = {
  low: '일반',
  medium: '일반',
  high: '중요',
  urgent: '긴급',
  critical: '위급',
}

export const SearchPage: React.FC<SearchPageProps> = ({ isOpen, onClose }) => {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<AnnouncementResult[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const clearSearchInput = useCallback(() => {
    setSearchQuery('')
    setSearchResults([])
    setHasSearched(false)
    setSearchError(null)
  }, [])

  const formatResultDate = (value?: string | null) => {
    if (!value) return ''
    try {
      return new Date(value).toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return ''
    }
  }

  const getSnippet = (value?: string | null) => {
    if (!value) return '내용이 없습니다.'
    const cleaned = value.replace(/\s+/g, ' ').trim()
    if (!cleaned) return '내용이 없습니다.'
    return cleaned.length > 120 ? `${cleaned.slice(0, 120)}…` : cleaned
  }

  const runSearch = useCallback(async (rawQuery: string) => {
    const query = rawQuery.trim()

    if (!query) {
      setSearchResults([])
      setSearchError(null)
      setHasSearched(false)
      return
    }

    setIsSearching(true)
    setSearchError(null)
    setHasSearched(true)

    try {
      const response = await fetch(`/api/announcements?search=${encodeURIComponent(query)}`, {
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error('검색 요청 실패')
      }

      const data = await response.json().catch(() => ({}))
      const announcements = Array.isArray(data?.announcements) ? data.announcements : []
      setSearchResults(announcements)

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
      console.error('Announcement search failed', error)
      setSearchError('검색 결과를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
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
        setSearchError(null)
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

  // 검색어 클릭 처리
  const handleResultClick = (announcement: AnnouncementResult) => {
    if (!announcement?.id) return
    onClose()
    router.push(`/mobile/announcements/${announcement.id}`)
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
          <Search className="search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="검색어를 입력하세요"
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
            {searchError && <div className="search-error">{searchError}</div>}
            {isSearching && <div className="search-loading">검색 결과를 불러오는 중입니다…</div>}
            {!isSearching && !searchError && searchResults.length > 0 && (
              <div className="results-list">
                {searchResults.map(result => {
                  const dateLabel = formatResultDate(result.created_at)
                  const priorityKey = (result.priority || '').toLowerCase()
                  const priorityLabel = priorityLabels[priorityKey]
                  return (
                    <button
                      key={result.id}
                      className="result-item"
                      onClick={() => handleResultClick(result)}
                    >
                      <div className="result-item-content">
                        <div className="result-title-row">
                          <span className="result-title">{result.title || '제목 없음'}</span>
                          <div className="result-meta">
                            {priorityLabel && (
                              <span className={`priority-badge priority-${priorityKey}`}>
                                {priorityLabel}
                              </span>
                            )}
                            {dateLabel && <span className="result-date">{dateLabel}</span>}
                          </div>
                        </div>
                        <p className="result-snippet">{getSnippet(result.content)}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {searchQuery && hasSearched && !isSearching && !searchResults.length && !searchError && (
          <div className="no-results">
            <Search className="w-12 h-12" />
            <p>&lsquo;{searchQuery}&rsquo;에 대한 검색 결과가 없습니다.</p>
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
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 20px;
          height: 20px;
          color: var(--muted-ink);
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          height: 40px;
          padding: 0 40px 0 40px;
          background: var(--surface-2);
          border: 1px solid var(--line);
          border-radius: 20px;
          font-size: 16px;
          color: var(--text);
          outline: none;
          transition: all 0.2s;
        }
        .search-clear-btn {
          position: absolute;
          right: 10px;
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

        .search-input:focus {
          border-color: var(--line);
          background: var(--surface);
        }

        .search-input:focus-visible {
          outline: none;
          box-shadow: none;
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

        .result-item-content {
          display: flex;
          flex-direction: column;
          gap: 6px;
          width: 100%;
        }

        .result-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          width: 100%;
        }

        .result-title {
          font-size: 15px;
          font-weight: 600;
          color: var(--text);
        }

        .result-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        .priority-badge {
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 9999px;
          background: rgba(49, 163, 250, 0.12);
          color: #1a254f;
        }

        .priority-badge.priority-urgent,
        .priority-badge.priority-critical {
          background: rgba(234, 56, 41, 0.12);
          color: #ea3829;
        }

        .priority-badge.priority-high {
          background: rgba(249, 115, 22, 0.15);
          color: #ea580c;
        }

        .result-date {
          font-size: 12px;
          color: var(--muted-ink);
          white-space: nowrap;
        }

        .result-snippet {
          font-size: 13px;
          color: var(--muted-ink);
          line-height: 1.4;
        }

        [data-theme='dark'] .recent-item,
        [data-theme='dark'] .result-item {
          background: var(--card);
          border-color: #3a4048;
          color: #e6e9f1;
        }

        .recent-item:hover,
        .result-item:hover {
          background: var(--surface-2);
          border-color: var(--tag-blue);
        }

        [data-theme='dark'] .recent-item:hover,
        [data-theme='dark'] .result-item:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: #31a3fa;
        }

        .search-error {
          margin-bottom: 12px;
          font-size: 13px;
          color: #dc2626;
        }

        .search-loading {
          padding: 16px;
          text-align: center;
          font-size: 14px;
          color: var(--muted-ink);
        }

        .no-results {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          color: var(--muted-ink);
          text-align: center;
        }

        .no-results p {
          margin-top: 16px;
          font-size: 15px;
        }

        [data-theme='dark'] .no-results {
          color: #a8b0bb;
        }

        [data-theme='dark'] .no-results p {
          color: #e6e9f1;
        }

        @keyframes slideIn {
          from {
            transform: translateY(-100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
