import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from 'react/jsx-runtime'
import { useState, useEffect, useRef } from 'react'
import { X, Camera, Map as MapIcon, FileText, ArrowLeft, Clock, ChevronRight } from 'lucide-react'
import { searchService } from '../../../services/searchService'
const HISTORY_KEY = 'inopnc_search_history'
export const GlobalSearch = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [filter, setFilter] = useState('ALL')
  const [recentSearches, setRecentSearches] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef(null)
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
  const addToHistory = text => {
    if (!text.trim()) return
    const newHistory = [text, ...recentSearches.filter(s => s !== text)].slice(0, 5)
    setRecentSearches(newHistory)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory))
  }
  const handleKeyDown = e => {
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
  const handleResultClick = record => {
    addToHistory(query)
    console.log(`Navigating to ${record.id} (${record.type})`)
    alert(`이동: ${record.title}`)
    onClose()
  }
  const handleFilterChange = type => {
    setFilter(type)
    inputRef.current?.focus()
  }
  const highlightText = (text, highlight) => {
    if (!highlight.trim()) return text
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'))
    return _jsx(_Fragment, {
      children: parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase()
          ? _jsx('span', { className: 'text-[#31a3fa] font-extrabold', children: part }, i)
          : part
      ),
    })
  }
  if (!isOpen) return null
  return _jsxs('div', {
    className:
      'fixed inset-0 z-50 flex flex-col bg-[#f2f4f6] dark:bg-[#0f172a] transition-colors duration-200',
    children: [
      _jsxs('div', {
        className:
          'h-[70px] bg-white dark:bg-[#1e293b] border-b border-[#e2e8f0] dark:border-[#334155] flex items-center px-4 gap-3 shrink-0 transition-colors duration-200',
        children: [
          _jsx('button', {
            onClick: onClose,
            className: 'p-1',
            children: _jsx(ArrowLeft, { className: 'text-[#111111] dark:text-white', size: 24 }),
          }),
          _jsxs('div', {
            className: 'flex-1 relative flex items-center',
            children: [
              _jsx('input', {
                ref: inputRef,
                type: 'text',
                className:
                  'w-full h-[50px] rounded-full bg-[#f1f5f9] dark:bg-[#334155] border border-[#e2e8f0] dark:border-[#475569] px-5 pr-10 text-[17px] text-[#111111] dark:text-white font-medium placeholder-[#94a3b8] focus:bg-white dark:focus:bg-[#1e293b] focus:border-[#31a3fa] dark:focus:border-[#31a3fa] focus:ring-[3px] focus:ring-[#31a3fa]/15 outline-none transition-all',
                placeholder: '\uAC80\uC0C9\uC5B4\uB97C \uC785\uB825\uD558\uC138\uC694',
                value: query,
                onChange: e => setQuery(e.target.value),
                onKeyDown: handleKeyDown,
              }),
              query &&
                _jsx('button', {
                  onClick: () => {
                    setQuery('')
                    inputRef.current?.focus()
                  },
                  className:
                    'absolute right-3 w-6 h-6 bg-[#cbd5e1] dark:bg-[#64748b] text-white rounded-full flex items-center justify-center',
                  children: _jsx(X, { size: 14 }),
                }),
            ],
          }),
        ],
      }),
      _jsxs('div', {
        className:
          'w-full bg-white dark:bg-[#1e293b] px-4 py-3 border-b border-[#e2e8f0] dark:border-[#334155] overflow-x-auto no-scrollbar whitespace-nowrap shrink-0 flex gap-2 transition-colors duration-200',
        children: [
          _jsx(FilterChip, {
            label: '\uC804\uCCB4',
            active: filter === 'ALL',
            onClick: () => handleFilterChange('ALL'),
          }),
          _jsx(FilterChip, {
            label: '\uD604\uC7A5',
            active: filter === 'SITE',
            onClick: () => handleFilterChange('SITE'),
          }),
          _jsx(FilterChip, {
            label: '\uC791\uC5C5\uC77C\uC9C0',
            active: filter === 'LOG',
            onClick: () => handleFilterChange('LOG'),
          }),
          _jsx(FilterChip, {
            label: '\uBB38\uC11C',
            active: filter === 'DOC',
            onClick: () => handleFilterChange('DOC'),
          }),
          _jsx(FilterChip, {
            label: '\uC0AC\uC9C4',
            active: filter === 'PHOTO',
            onClick: () => handleFilterChange('PHOTO'),
          }),
          _jsx(FilterChip, {
            label: '\uB3C4\uBA74',
            active: filter === 'DRAWING',
            onClick: () => handleFilterChange('DRAWING'),
          }),
        ],
      }),
      _jsxs('div', {
        className: 'flex-1 overflow-y-auto px-4 py-4 scroll-smooth',
        children: [
          !query &&
            _jsxs('div', {
              className: 'animate-fade-in',
              children: [
                _jsx('h3', {
                  className: 'text-[15px] font-bold text-[#475569] dark:text-[#94a3b8] mb-3',
                  children: '\uCD5C\uADFC \uAC80\uC0C9\uC5B4',
                }),
                recentSearches.length === 0
                  ? _jsx('div', {
                      className: 'text-center py-10 text-[#94a3b8] dark:text-[#64748b]',
                      children:
                        '\uCD5C\uADFC \uAC80\uC0C9 \uB0B4\uC5ED\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.',
                    })
                  : _jsx('div', {
                      className: 'flex flex-col gap-2',
                      children: recentSearches.map((term, idx) =>
                        _jsxs(
                          'button',
                          {
                            onClick: () => setQuery(term),
                            className:
                              'flex items-center justify-between p-3 bg-white dark:bg-[#1e293b] rounded-xl shadow-sm border border-transparent active:scale-[0.98] transition-all text-left hover:bg-gray-50 dark:hover:bg-[#334155]',
                            children: [
                              _jsxs('div', {
                                className: 'flex items-center gap-3 text-[#111111] dark:text-white',
                                children: [
                                  _jsx(Clock, {
                                    size: 16,
                                    className: 'text-[#94a3b8] dark:text-[#64748b]',
                                  }),
                                  _jsx('span', { className: 'font-medium', children: term }),
                                ],
                              }),
                              _jsx(ChevronRight, {
                                size: 16,
                                className: 'text-[#cbd5e1] dark:text-[#475569]',
                              }),
                            ],
                          },
                          idx
                        )
                      ),
                    }),
              ],
            }),
          query &&
            _jsxs('div', {
              className: 'animate-fade-in',
              children: [
                _jsxs('h3', {
                  className:
                    'text-[15px] font-bold text-[#475569] dark:text-[#94a3b8] mb-3 flex justify-between',
                  children: [
                    _jsx('span', { children: '\uAC80\uC0C9 \uACB0\uACFC' }),
                    _jsxs('span', {
                      className: 'text-[#31a3fa]',
                      children: [results.length, '\uAC74'],
                    }),
                  ],
                }),
                results.length === 0
                  ? _jsx('div', {
                      className: 'text-center py-12 text-[#94a3b8] dark:text-[#64748b]',
                      children: '\uAC80\uC0C9 \uACB0\uACFC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.',
                    })
                  : _jsx('div', {
                      className: 'flex flex-col gap-3 pb-20',
                      children: results.map((item, idx) =>
                        _jsx(
                          ResultCard,
                          {
                            item: item,
                            query: query,
                            selected: idx === selectedIndex,
                            onClick: () => handleResultClick(item),
                            highlighter: highlightText,
                          },
                          item.id
                        )
                      ),
                    }),
              ],
            }),
        ],
      }),
    ],
  })
}
// Sub-components
const FilterChip = ({ label, active, onClick }) =>
  _jsx('button', {
    onClick: onClick,
    className: `px-3.5 py-1.5 rounded-full text-[14px] font-bold border transition-all ${
      active
        ? 'bg-[#31a3fa] text-white border-[#31a3fa] shadow-md shadow-blue-200 dark:shadow-none'
        : 'bg-white dark:bg-[#334155] text-[#475569] dark:text-[#cbd5e1] border-[#e2e8f0] dark:border-[#475569]'
    }`,
    children: label,
  })
const ResultCard = ({ item, query, selected, onClick, highlighter }) => {
  return _jsxs('div', {
    onClick: onClick,
    className: `bg-white dark:bg-[#1e293b] rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.08)] border transition-all cursor-pointer relative overflow-hidden group
      ${
        selected
          ? 'border-[#31a3fa] ring-2 ring-[#31a3fa]/20'
          : 'border-transparent hover:border-[#31a3fa]/50 dark:hover:border-[#31a3fa]/50'
      } active:scale-[0.98]`,
    children: [
      _jsxs('div', {
        className: 'flex justify-between items-start mb-3',
        children: [
          _jsxs('div', {
            className: 'flex-1 min-w-0 pr-2',
            children: [
              _jsx('h4', {
                className:
                  'text-[18px] font-[800] text-[#111111] dark:text-white leading-tight truncate mb-1',
                children: highlighter(item.title, query),
              }),
              _jsx('p', {
                className: 'text-[14px] font-medium text-[#475569] dark:text-[#94a3b8] truncate',
                children: item.subtitle,
              }),
            ],
          }),
          _jsx('span', {
            className:
              'bg-[#eaf6ff] dark:bg-[#334155] text-[#31a3fa] dark:text-[#31a3fa] text-[12px] font-bold px-2.5 py-1 rounded-md shrink-0',
            children: item.type,
          }),
        ],
      }),
      _jsxs('div', {
        className:
          'flex justify-between items-end border-t border-dashed border-[#e2e8f0] dark:border-[#334155] pt-3 mt-1',
        children: [
          _jsx('span', {
            className: 'text-[13px] text-[#94a3b8] dark:text-[#64748b] font-medium',
            children: item.meta,
          }),
          _jsxs('div', {
            className: 'flex gap-3',
            children: [
              _jsx('div', {
                className: item.flags.hasDoc
                  ? 'text-[#1a254f] dark:text-[#e2e8f0]'
                  : 'text-[#cbd5e1] dark:text-[#475569]',
                children: _jsx(FileText, { size: 18, strokeWidth: item.flags.hasDoc ? 2.5 : 2 }),
              }),
              _jsx('div', {
                className: item.flags.hasDraw
                  ? 'text-[#1a254f] dark:text-[#e2e8f0]'
                  : 'text-[#cbd5e1] dark:text-[#475569]',
                children: _jsx(MapIcon, { size: 18, strokeWidth: item.flags.hasDraw ? 2.5 : 2 }),
              }),
              _jsx('div', {
                className: item.flags.hasPhoto
                  ? 'text-[#1a254f] dark:text-[#e2e8f0]'
                  : 'text-[#cbd5e1] dark:text-[#475569]',
                children: _jsx(Camera, { size: 18, strokeWidth: item.flags.hasPhoto ? 2.5 : 2 }),
              }),
            ],
          }),
        ],
      }),
    ],
  })
}
