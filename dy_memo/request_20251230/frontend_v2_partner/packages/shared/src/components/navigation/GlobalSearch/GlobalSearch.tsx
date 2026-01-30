import React, { useState, useEffect, useRef } from 'react'
import { X, Camera, Map as MapIcon, FileText, ArrowLeft, Clock, ChevronRight } from 'lucide-react'
import { searchService } from '../../../services/searchService'
import { SearchRecord, SearchType } from '../../../types'

export interface GlobalSearchProps {
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
            <span key={i} className="text-[#31a3fa] font-extrabold">
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
    <div className="fixed inset-0 z-50 flex flex-col bg-[#f2f4f6] dark:bg-[#0f172a] transition-colors duration-200">
      {/* Search Header */}
      <div className="h-[70px] bg-white dark:bg-[#1e293b] border-b border-[#e2e8f0] dark:border-[#334155] flex items-center px-4 gap-3 shrink-0 transition-colors duration-200">
        <button onClick={onClose} className="p-1">
          <ArrowLeft className="text-[#111111] dark:text-white" size={24} />
        </button>

        <div className="flex-1 relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            className="w-full h-[50px] rounded-full bg-[#f1f5f9] dark:bg-[#334155] border border-[#e2e8f0] dark:border-[#475569] px-5 pr-10 text-[17px] text-[#111111] dark:text-white font-medium placeholder-[#94a3b8] focus:bg-white dark:focus:bg-[#1e293b] focus:border-[#31a3fa] dark:focus:border-[#31a3fa] focus:ring-[3px] focus:ring-[#31a3fa]/15 outline-none transition-all"
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
              className="absolute right-3 w-6 h-6 bg-[#cbd5e1] dark:bg-[#64748b] text-white rounded-full flex items-center justify-center"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Filter Chips - Added w-full to prevent mobile cutoff */}
      <div className="w-full bg-white dark:bg-[#1e293b] px-4 py-3 border-b border-[#e2e8f0] dark:border-[#334155] overflow-x-auto no-scrollbar whitespace-nowrap shrink-0 flex gap-2 transition-colors duration-200">
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
            <h3 className="text-[15px] font-bold text-[#475569] dark:text-[#94a3b8] mb-3">
              최근 검색어
            </h3>
            {recentSearches.length === 0 ? (
              <div className="text-center py-10 text-[#94a3b8] dark:text-[#64748b]">
                최근 검색 내역이 없습니다.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {recentSearches.map((term, idx) => (
                  <button
                    key={idx}
                    onClick={() => setQuery(term)}
                    className="flex items-center justify-between p-3 bg-white dark:bg-[#1e293b] rounded-xl shadow-sm border border-transparent active:scale-[0.98] transition-all text-left hover:bg-gray-50 dark:hover:bg-[#334155]"
                  >
                    <div className="flex items-center gap-3 text-[#111111] dark:text-white">
                      <Clock size={16} className="text-[#94a3b8] dark:text-[#64748b]" />
                      <span className="font-medium">{term}</span>
                    </div>
                    <ChevronRight size={16} className="text-[#cbd5e1] dark:text-[#475569]" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* State 2: Results */}
        {query && (
          <div className="animate-fade-in">
            <h3 className="text-[15px] font-bold text-[#475569] dark:text-[#94a3b8] mb-3 flex justify-between">
              <span>검색 결과</span>
              <span className="text-[#31a3fa]">{results.length}건</span>
            </h3>

            {results.length === 0 ? (
              <div className="text-center py-12 text-[#94a3b8] dark:text-[#64748b]">
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
        ? 'bg-[#31a3fa] text-white border-[#31a3fa] shadow-md shadow-blue-200 dark:shadow-none'
        : 'bg-white dark:bg-[#334155] text-[#475569] dark:text-[#cbd5e1] border-[#e2e8f0] dark:border-[#475569]'
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
      className={`bg-white dark:bg-[#1e293b] rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.08)] border transition-all cursor-pointer relative overflow-hidden group
      ${
        selected
          ? 'border-[#31a3fa] ring-2 ring-[#31a3fa]/20'
          : 'border-transparent hover:border-[#31a3fa]/50 dark:hover:border-[#31a3fa]/50'
      } active:scale-[0.98]`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0 pr-2">
          <h4 className="text-[18px] font-[800] text-[#111111] dark:text-white leading-tight truncate mb-1">
            {highlighter(item.title, query)}
          </h4>
          <p className="text-[14px] font-medium text-[#475569] dark:text-[#94a3b8] truncate">
            {item.subtitle}
          </p>
        </div>
        <span className="bg-[#eaf6ff] dark:bg-[#334155] text-[#31a3fa] dark:text-[#31a3fa] text-[12px] font-bold px-2.5 py-1 rounded-md shrink-0">
          {item.type}
        </span>
      </div>

      <div className="flex justify-between items-end border-t border-dashed border-[#e2e8f0] dark:border-[#334155] pt-3 mt-1">
        <span className="text-[13px] text-[#94a3b8] dark:text-[#64748b] font-medium">
          {item.meta}
        </span>

        {/* Data Icons - Using Tailwind classes for color instead of hardcoded hex prop to support Dark Mode */}
        <div className="flex gap-3">
          <div
            className={
              item.flags.hasDoc
                ? 'text-[#1a254f] dark:text-[#e2e8f0]'
                : 'text-[#cbd5e1] dark:text-[#475569]'
            }
          >
            <FileText size={18} strokeWidth={item.flags.hasDoc ? 2.5 : 2} />
          </div>
          <div
            className={
              item.flags.hasDraw
                ? 'text-[#1a254f] dark:text-[#e2e8f0]'
                : 'text-[#cbd5e1] dark:text-[#475569]'
            }
          >
            <MapIcon size={18} strokeWidth={item.flags.hasDraw ? 2.5 : 2} />
          </div>
          <div
            className={
              item.flags.hasPhoto
                ? 'text-[#1a254f] dark:text-[#e2e8f0]'
                : 'text-[#cbd5e1] dark:text-[#475569]'
            }
          >
            <Camera size={18} strokeWidth={item.flags.hasPhoto ? 2.5 : 2} />
          </div>
        </div>
      </div>
    </div>
  )
}
