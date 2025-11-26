'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchSuggestion {
  id: string
  text: string
  type: 'site' | 'recent' | 'popular'
  count?: number
}

interface WorkLogSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  showCancel?: boolean
  suggestions?: SearchSuggestion[]
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void
  enableAutoComplete?: boolean
  enableHighlight?: boolean
  maxSuggestions?: number
  enableHistory?: boolean
  historyKey?: string
  maxHistoryItems?: number
}

// localStorage 키 상수
const SEARCH_HISTORY_PREFIX = 'worklog_search_history_'
const DEFAULT_HISTORY_KEY = 'default'
const MAX_HISTORY_ITEMS = 10

// 검색 기록 관리 유틸리티
const searchHistoryUtils = {
  getHistory: (key: string = DEFAULT_HISTORY_KEY): string[] => {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_PREFIX + key)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  },

  addToHistory: (
    query: string,
    key: string = DEFAULT_HISTORY_KEY,
    maxItems: number = MAX_HISTORY_ITEMS
  ) => {
    if (typeof window === 'undefined' || !query.trim()) return
    try {
      const history = searchHistoryUtils.getHistory(key)
      // 중복 제거 및 최신 항목을 앞에 추가
      const newHistory = [query, ...history.filter(item => item !== query)].slice(0, maxItems)
      localStorage.setItem(SEARCH_HISTORY_PREFIX + key, JSON.stringify(newHistory))
    } catch (e) {
      console.error('Failed to save search history:', e)
    }
  },

  clearHistory: (key: string = DEFAULT_HISTORY_KEY) => {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(SEARCH_HISTORY_PREFIX + key)
    } catch (e) {
      console.error('Failed to clear search history:', e)
    }
  },
}

const EMPTY_SUGGESTIONS: SearchSuggestion[] = []

const areSuggestionsEqual = (a: SearchSuggestion[], b: SearchSuggestion[]) => {
  if (a === b) return true
  if (a.length !== b.length) return false

  for (let i = 0; i < a.length; i += 1) {
    const curr = a[i]
    const next = b[i]

    if (!next) return false

    if (
      curr.id !== next.id ||
      curr.text !== next.text ||
      curr.type !== next.type ||
      curr.count !== next.count
    ) {
      return false
    }
  }

  return true
}

export const WorkLogSearch: React.FC<WorkLogSearchProps> = ({
  value,
  onChange,
  placeholder = '현장명으로 검색',
  showCancel = true,
  suggestions = EMPTY_SUGGESTIONS,
  onSuggestionSelect,
  enableAutoComplete = true,
  enableHighlight = true,
  maxSuggestions = 5,
  enableHistory = true,
  historyKey = DEFAULT_HISTORY_KEY,
  maxHistoryItems = MAX_HISTORY_ITEMS,
}) => {
  const [localValue, setLocalValue] = useState(value)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const [filteredSuggestions, setFilteredSuggestions] = useState<SearchSuggestion[]>([])
  const [searchHistory, setSearchHistory] = useState<string[]>([])

  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionListRef = useRef<HTMLDivElement>(null)

  // Load search history on mount
  useEffect(() => {
    if (enableHistory) {
      const history = searchHistoryUtils.getHistory(historyKey)
      setSearchHistory(history)
    }
  }, [enableHistory, historyKey])

  // 디바운싱 처리
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue)
    }, 300)

    return () => clearTimeout(timer)
  }, [localValue, onChange])

  // 외부에서 value가 변경되면 localValue도 동기화
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const updateFilteredSuggestions = useCallback((next: SearchSuggestion[]) => {
    setFilteredSuggestions(prev => (areSuggestionsEqual(prev, next) ? prev : next))
  }, [])

  // 검색어에 따른 제안 목록 필터링
  useEffect(() => {
    if (!enableAutoComplete) {
      updateFilteredSuggestions([])
      setShowSuggestions(false)
      return
    }

    // 검색어가 없을 때는 검색 기록만 표시
    if (!localValue.trim()) {
      if (enableHistory && searchHistory.length > 0) {
        const historySuggestions: SearchSuggestion[] = searchHistory
          .slice(0, Math.min(maxSuggestions, 5))
          .map((item, index) => ({
            id: `history-${index}`,
            text: item,
            type: 'recent',
          }))
        updateFilteredSuggestions(historySuggestions)
        setShowSuggestions(true)
      } else {
        updateFilteredSuggestions([])
        setShowSuggestions(false)
      }
      setSelectedSuggestionIndex(-1)
      return
    }

    // 일반 제안과 검색 기록을 합쳐서 필터링
    const allSuggestions: SearchSuggestion[] = [...suggestions]

    // 검색 기록을 제안에 추가 (검색어와 매치되는 것만)
    if (enableHistory && searchHistory.length > 0) {
      const matchingHistory = searchHistory
        .filter(
          item =>
            item.toLowerCase().includes(localValue.toLowerCase()) &&
            !suggestions.some(s => s.text.toLowerCase() === item.toLowerCase())
        )
        .slice(0, 3) // 최대 3개의 검색 기록만 추가
        .map((item, index) => ({
          id: `history-${index}`,
          text: item,
          type: 'recent' as const,
        }))

      allSuggestions.push(...matchingHistory)
    }

    const filtered = allSuggestions
      .filter(suggestion => suggestion.text.toLowerCase().includes(localValue.toLowerCase()))
      .slice(0, maxSuggestions)

    updateFilteredSuggestions(filtered)
    setShowSuggestions(filtered.length > 0)
    setSelectedSuggestionIndex(-1)
  }, [
    localValue,
    suggestions,
    enableAutoComplete,
    maxSuggestions,
    enableHistory,
    searchHistory,
    updateFilteredSuggestions,
  ])

  // 키보드 네비게이션 처리
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showSuggestions || filteredSuggestions.length === 0) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedSuggestionIndex(prev => (prev < filteredSuggestions.length - 1 ? prev + 1 : 0))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedSuggestionIndex(prev => (prev > 0 ? prev - 1 : filteredSuggestions.length - 1))
          break
        case 'Enter':
          e.preventDefault()
          if (selectedSuggestionIndex >= 0) {
            handleSuggestionSelect(filteredSuggestions[selectedSuggestionIndex])
          }
          break
        case 'Escape':
          setShowSuggestions(false)
          setSelectedSuggestionIndex(-1)
          inputRef.current?.blur()
          break
      }
    },
    [showSuggestions, filteredSuggestions, selectedSuggestionIndex]
  )

  // 제안 선택 처리
  const handleSuggestionSelect = useCallback(
    (suggestion: SearchSuggestion) => {
      setLocalValue(suggestion.text)
      onChange(suggestion.text)
      setShowSuggestions(false)
      setSelectedSuggestionIndex(-1)

      // 검색 기록에 저장 (검색 기록 자체가 아닌 경우에만)
      if (enableHistory && suggestion.type !== 'recent' && suggestion.text.trim()) {
        searchHistoryUtils.addToHistory(suggestion.text, historyKey, maxHistoryItems)
        // 검색 기록 상태 업데이트
        const updatedHistory = searchHistoryUtils.getHistory(historyKey)
        setSearchHistory(updatedHistory)
      }

      onSuggestionSelect?.(suggestion)
      inputRef.current?.blur()
    },
    [onChange, onSuggestionSelect, enableHistory, historyKey, maxHistoryItems]
  )

  // 텍스트 하이라이트 함수
  const highlightText = useCallback(
    (text: string, query: string) => {
      if (!enableHighlight || !query.trim()) return text

      const parts = text.split(new RegExp(`(${query})`, 'gi'))
      return parts.map((part, index) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={index} className="bg-yellow-200 text-gray-900 rounded-sm px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      )
    },
    [enableHighlight]
  )

  // 외부 클릭 시 제안 목록 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        suggestionListRef.current &&
        !suggestionListRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
        setSelectedSuggestionIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleClear = () => {
    setLocalValue('')
    onChange('')
    setShowSuggestions(false)
    setSelectedSuggestionIndex(-1)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value)
  }

  const handleInputFocus = () => {
    if (enableAutoComplete && filteredSuggestions.length > 0) {
      setShowSuggestions(true)
    }
  }

  return (
    <div className="relative animate-fadeIn">
      <div
        className="search-input-wrapper"
        style={{
          position: 'relative',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          height: '48px',
          borderRadius: '999px',
          border: '1px solid var(--border, #e0e0e0)',
          background: 'var(--surface, #f6f9ff)',
          padding: '0 48px',
          transition: 'border-color 0.2s ease',
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className="search-input"
          style={{
            width: '100%',
            height: '48px',
            padding: '0',
            background: 'transparent',
            border: 'none',
            fontSize: '15px',
            fontWeight: '500',
            color: 'var(--text, #101828)',
            outline: 'none',
            transition: 'all 0.3s ease',
            fontFamily: 'Noto Sans KR, system-ui, -apple-system, sans-serif',
          }}
          role="combobox"
          aria-expanded={showSuggestions}
          aria-autocomplete="list"
          aria-controls={showSuggestions ? 'search-suggestions' : undefined}
          aria-activedescendant={
            selectedSuggestionIndex >= 0 ? `suggestion-${selectedSuggestionIndex}` : undefined
          }
        />
        <div
          className="search-icon"
          style={{
            position: 'absolute',
            left: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--muted, #667085)"
            strokeWidth="2.5"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </div>
        {showCancel && localValue && (
          <button
            onClick={handleClear}
            style={{
              position: 'absolute',
              right: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              background: 'var(--muted, #667085)',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              border: 'none',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--text, #101828)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--muted, #667085)'
            }}
            aria-label="검색어 지우기"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div
          ref={suggestionListRef}
          id="search-suggestions"
          role="listbox"
          style={{
            position: 'absolute',
            top: '100%',
            left: '0',
            right: '0',
            marginTop: '4px',
            background: 'var(--card, #ffffff)',
            border: '1px solid var(--border, #e0e0e0)',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-lg, 0 10px 25px rgba(0, 0, 0, 0.1))',
            zIndex: 50,
            maxHeight: '240px',
            overflowY: 'auto',
            transition: 'all 0.3s ease',
          }}
        >
          {filteredSuggestions.map((suggestion, index) => (
            <div
              key={suggestion.id}
              id={`suggestion-${index}`}
              role="option"
              aria-selected={selectedSuggestionIndex === index}
              onClick={() => handleSuggestionSelect(suggestion)}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                borderBottom:
                  index < filteredSuggestions.length - 1
                    ? '1px solid var(--border, #e0e0e0)'
                    : 'none',
                transition: 'all 0.2s ease',
                background:
                  selectedSuggestionIndex === index ? 'var(--bg, #F6F9FF)' : 'transparent',
                color: 'var(--text, #101828)',
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
              }}
              onMouseEnter={e => {
                if (selectedSuggestionIndex !== index) {
                  e.currentTarget.style.background = 'var(--bg, #F6F9FF)'
                }
              }}
              onMouseLeave={e => {
                if (selectedSuggestionIndex !== index) {
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Type Icon */}
                    <div style={{ flexShrink: 0 }}>
                      {suggestion.type === 'site' && (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="var(--brand, #1A254F)"
                          strokeWidth="2"
                        >
                          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                      )}
                      {suggestion.type === 'recent' && (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="var(--muted, #667085)"
                          strokeWidth="2"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12,6 12,12 16,14" />
                        </svg>
                      )}
                      {suggestion.type === 'popular' && (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="var(--num, #0068FE)"
                          strokeWidth="2"
                        >
                          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                        </svg>
                      )}
                    </div>

                    {/* Text with Highlighting */}
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: 'var(--text, #101828)',
                      }}
                    >
                      {highlightText(suggestion.text, localValue)}
                    </span>
                  </div>

                  {/* Type Label */}
                  <div style={{ marginTop: '4px' }}>
                    <span
                      style={{
                        fontSize: '12px',
                        color: 'var(--muted, #667085)',
                        fontWeight: '400',
                      }}
                    >
                      {suggestion.type === 'site' && '현장'}
                      {suggestion.type === 'recent' && '최근 검색'}
                      {suggestion.type === 'popular' && '인기 검색'}
                    </span>
                  </div>
                </div>

                {/* Count Badge */}
                {suggestion.count !== undefined && (
                  <div style={{ flexShrink: 0, marginLeft: '8px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2px 8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: 'var(--bg, #F6F9FF)',
                        color: 'var(--muted, #667085)',
                        borderRadius: '12px',
                        minWidth: '20px',
                        height: '20px',
                      }}
                    >
                      {suggestion.count}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search State Indicator */}
      {localValue && !showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-1 text-xs text-[var(--muted)] animate-fadeIn">
          &ldquo;{localValue}&rdquo; 검색 중...
        </div>
      )}
    </div>
  )
}
