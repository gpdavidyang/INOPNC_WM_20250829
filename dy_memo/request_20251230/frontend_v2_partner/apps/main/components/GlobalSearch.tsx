import React, { useState, useEffect, useRef } from 'react'
import { X, Camera, Map as MapIcon, FileText, ArrowLeft, Clock, ChevronRight } from 'lucide-react'
import { searchService } from '@inopnc/shared/services/searchService'
import { SearchRecord, SearchType } from '@inopnc/shared/types'

interface GlobalSearchProps {
  isOpen: boolean
  onClose: () => void
}

const HISTORY_KEY = 'inopnc_search_history'

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchRecord[]>([])
  const [filter, setFilter] = useState<SearchType>('ALL')
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  // 1. Load History on Mount
  useEffect(() => {
    const saved = localStorage.getItem(HISTORY_KEY)
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  // 2. Auto Focus & Reset
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setSelectedIndex(-1)
    }
  }, [isOpen])

  // 3. Search Execution (Debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!query.trim()) {
        setResults([])
        return
      }
      const hits = searchService.search(query, filter, 50)
      setResults(hits)
      setSelectedIndex(-1)
    }, 150)

    return () => clearTimeout(timeoutId)
  }, [query, filter])

  const addToHistory = (text: string) => {
    if (!text.trim()) return
    const newHistory = [text, ...recentSearches.filter(s => s !== text)].slice(0, 5)
    setRecentSearches(newHistory)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex >= 0 && results[selectedIndex]) {
        handleResultClick(results[selectedIndex])
      } else if (query) {
        addToHistory(query)
      }
    }
  }

  const handleResultClick = (record: SearchRecord) => {
    addToHistory(query)
    console.log(`Navigating to ${record.id} (${record.type})`)
    alert(`이동: ${record.title}`)
    onClose()
  }

  const handleFilterChange = (type: SearchType) => {
    setFilter(type)
    inputRef.current?.focus()
  }

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'))
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span key={i} className="text-[var(--primary)] font-extrabold">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--bg-body)] transition-colors duration-200">
      {/* Search Header */}
      <div className="h-[70px] bg-[var(--bg-surface)] border-b border-[var(--border)] flex items-center px-4 gap-3 shrink-0 transition-colors duration-200">
        <button onClick={onClose} className="p-1">
          <ArrowLeft className="text-[var(--text-main)]" size={24} />
        </button>

        <div className="flex-1 relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            className="w-full h-[50px] rounded-full bg-[var(--bg-input)] border border-[var(--border)] px-5 pr-10 text-[17px] text-[var(--text-main)] font-medium placeholder-[var(--text-placeholder)] focus:bg-[var(--bg-surface)] focus:border-[var(--primary)] focus:ring-[3px] focus:ring-[var(--primary)]/15 outline-none transition-all"
            placeholder="검색어를 입력하세요"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {query && (
            <button
              onClick={() => {
                setQuery('')
                inputRef.current?.focus()
              }}
              className="absolute right-3 w-6 h-6 bg-[var(--btn-clear-bg)] text-white rounded-full flex items-center justify-center"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Filter Chips - Added w-full to prevent mobile cutoff */}
      <div className="w-full bg-[var(--bg-surface)] px-4 py-3 border-b border-[var(--border)] overflow-x-auto no-scrollbar whitespace-nowrap shrink-0 flex gap-2 transition-colors duration-200">
        <FilterChip
          label="전체"
          active={filter === 'ALL'}
          onClick={() => handleFilterChange('ALL')}
        />
        <FilterChip
          label="현장"
          active={filter === 'SITE'}
          onClick={() => handleFilterChange('SITE')}
        />
        <FilterChip
          label="작업일지"
          active={filter === 'LOG'}
          onClick={() => handleFilterChange('LOG')}
        />
        <FilterChip
          label="문서"
          active={filter === 'DOC'}
          onClick={() => handleFilterChange('DOC')}
        />
        <FilterChip
          label="사진"
          active={filter === 'PHOTO'}
          onClick={() => handleFilterChange('PHOTO')}
        />
        <FilterChip
          label="도면"
          active={filter === 'DRAWING'}
          onClick={() => handleFilterChange('DRAWING')}
        />
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 scroll-smooth">
        {/* State 1: No Query -> Recent Searches */}
        {!query && (
          <div className="animate-fade-in">
            <h3 className="text-[15px] font-bold text-[var(--text-sub)] mb-3">최근 검색어</h3>
            {recentSearches.length === 0 ? (
              <div className="text-center py-10 text-[var(--text-placeholder)]">
                최근 검색 내역이 없습니다.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {recentSearches.map((term, idx) => (
                  <button
                    key={idx}
                    onClick={() => setQuery(term)}
                    className="flex items-center justify-between p-3 bg-[var(--bg-surface)] rounded-xl shadow-sm border border-transparent active:scale-[0.98] transition-all text-left hover:bg-[var(--bg-body)]"
                  >
                    <div className="flex items-center gap-3 text-[var(--text-main)]">
                      <Clock size={16} className="text-[var(--text-placeholder)]" />
                      <span className="font-medium">{term}</span>
                    </div>
                    <ChevronRight size={16} className="text-[var(--text-placeholder)]" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* State 2: Results */}
        {query && (
          <div className="animate-fade-in">
            <h3 className="text-[15px] font-bold text-[var(--text-sub)] mb-3 flex justify-between">
              <span>검색 결과</span>
              <span className="text-[var(--primary)]">{results.length}건</span>
            </h3>

            {results.length === 0 ? (
              <div className="text-center py-12 text-[var(--text-placeholder)]">
                검색 결과가 없습니다.
              </div>
            ) : (
              <div className="flex flex-col gap-3 pb-20">
                {results.map((item, idx) => (
                  <ResultCard
                    key={item.id}
                    item={item}
                    query={query}
                    selected={idx === selectedIndex}
                    onClick={() => handleResultClick(item)}
                    highlighter={highlightText}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Sub-components

const FilterChip: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({
  label,
  active,
  onClick,
}) => (
  <button
    onClick={onClick}
    className={`px-3.5 py-1.5 rounded-full text-[14px] font-bold border transition-all ${
      active
        ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-md shadow-blue-200'
        : 'bg-[var(--bg-surface)] text-[var(--text-sub)] border-[var(--border)]'
    }`}
  >
    {label}
  </button>
)

const ResultCard: React.FC<{
  item: SearchRecord
  query: string
  selected: boolean
  onClick: () => void
  highlighter: (t: string, h: string) => React.ReactNode
}> = ({ item, query, selected, onClick, highlighter }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-[var(--bg-surface)] rounded-2xl p-5 shadow-[var(--shadow-soft)] border transition-all cursor-pointer relative overflow-hidden group
      ${
        selected
          ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/20'
          : 'border-transparent hover:border-[var(--primary)]/50'
      } active:scale-[0.98]`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0 pr-2">
          <h4 className="text-[18px] font-[800] text-[var(--text-main)] leading-tight truncate mb-1">
            {highlighter(item.title, query)}
          </h4>
          <p className="text-[14px] font-medium text-[var(--text-sub)] truncate">{item.subtitle}</p>
        </div>
        <span className="bg-[var(--primary-bg)] text-[var(--primary)] text-[12px] font-bold px-2.5 py-1 rounded-md shrink-0">
          {item.type}
        </span>
      </div>

      <div className="flex justify-between items-end border-t border-dashed border-[var(--border)] pt-3 mt-1">
        <span className="text-[13px] text-[var(--text-placeholder)] font-medium">{item.meta}</span>

        {/* Data Icons - Using CSS variables for color to support Dark Mode */}
        <div className="flex gap-3">
          <div
            className={
              item.flags.hasDoc ? 'text-[var(--header-navy)]' : 'text-[var(--text-placeholder)]'
            }
          >
            <FileText size={18} strokeWidth={item.flags.hasDoc ? 2.5 : 2} />
          </div>
          <div
            className={
              item.flags.hasDraw ? 'text-[var(--header-navy)]' : 'text-[var(--text-placeholder)]'
            }
          >
            <MapIcon size={18} strokeWidth={item.flags.hasDraw ? 2.5 : 2} />
          </div>
          <div
            className={
              item.flags.hasPhoto ? 'text-[var(--header-navy)]' : 'text-[var(--text-placeholder)]'
            }
          >
            <Camera size={18} strokeWidth={item.flags.hasPhoto ? 2.5 : 2} />
          </div>
        </div>
      </div>
    </div>
  )
}
