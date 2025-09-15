'use client'

import React, { useState, useEffect } from 'react'
import { ChevronLeft, Search } from 'lucide-react'

interface SearchOverlayProps {
  isOpen: boolean
  onClose: () => void
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem('inopnc_recent_searches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [isOpen])

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Add to recent searches
      const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 10)
      setRecentSearches(updated)
      localStorage.setItem('inopnc_recent_searches', JSON.stringify(updated))

      // TODO: Implement actual search functionality
      console.log('Searching for:', searchQuery)

      // Close overlay after search
      onClose()
    }
  }

  const handleRecentClick = (search: string) => {
    setSearchQuery(search)
    handleSearch()
  }

  if (!isOpen) return null

  return (
    <div id="searchPage" className="search-page show" role="dialog" aria-modal="true">
      <div className="sp-head">
        <button id="spBack" className="sp-back" aria-label="뒤로" onClick={onClose}>
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="sp-input-wrap">
          <input
            id="spInput"
            className="sp-input"
            type="search"
            placeholder="현장명을 검색하세요."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSearch()}
            autoFocus
          />
          <Search className="sp-icon" />
        </div>
      </div>

      <div className="sp-body">
        <div className="sp-section-title">최근 검색어</div>
        <div className="sp-list" id="spList">
          {recentSearches.length === 0 ? (
            <div className="sp-empty">최근 검색어가 없습니다.</div>
          ) : (
            recentSearches.map((search, index) => (
              <div key={index} className="sp-row" onClick={() => handleRecentClick(search)}>
                <span className="sp-num">{index + 1}</span>
                <span className="sp-item">{search}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <style jsx>{`
        .sp-body {
          padding: 18px 20px 80px;
        }

        .sp-section-title {
          font: 700 13px var(--font);
          color: #98a2b3;
          margin: 8px 0 10px;
        }

        .sp-list {
          display: block;
        }

        .sp-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 10px 4px;
          border-bottom: 1px solid #f0f2f6;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .sp-row:hover {
          background: #f9fafb;
        }

        .sp-num {
          width: 20px;
          text-align: right;
          font: 800 14px var(--font);
          color: var(--num);
        }

        .sp-item {
          font:
            400 15px 'Noto Sans KR',
            system-ui,
            -apple-system,
            'Segoe UI',
            Roboto,
            sans-serif;
          color: #3b4658;
        }

        .sp-empty {
          padding: 40px 20px;
          text-align: center;
          color: #9ca3af;
          font-size: 14px;
        }

        [data-theme='dark'] .sp-row {
          border-bottom: 1px solid var(--line-soft) !important;
        }

        [data-theme='dark'] .sp-row:hover {
          background: rgba(255, 255, 255, 0.02);
        }

        [data-theme='dark'] .sp-item {
          color: #e6e9f1;
        }
      `}</style>
    </div>
  )
}
