'use client'

import React, { useState, useEffect } from 'react'
import { Search } from 'lucide-react'

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
        <button id="spBack" className="sp-back" aria-label="취소" onClick={onClose}>
          <span className="sp-back-text">취소</span>
        </button>
        <div className="sp-input-wrap">
          <input
            id="spInput"
            className="sp-input"
            type="search"
            placeholder="검색어를 입력하세요."
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
        <div className="sp-list recent-keywords" id="spList">
          {recentSearches.length === 0 ? (
            <div className="sp-empty">최근 검색어가 없습니다.</div>
          ) : (
            recentSearches.map((search, index) => (
              <button
                key={index}
                type="button"
                className="sp-row recent-keyword"
                onClick={() => handleRecentClick(search)}
              >
                <span className="sp-chip-text">{search}</span>
              </button>
            ))
          )}
        </div>
      </div>

      <style jsx>{`
        .sp-body {
          padding: 24px 20px;
          padding-top: 104px; /* 헤더 높이(80px) + 여백(24px) */
        }

        .sp-section-title {
          font-family:
            'Noto Sans KR',
            system-ui,
            -apple-system,
            'Segoe UI',
            Roboto,
            sans-serif;
          font-size: 20px;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0 0 16px 0;
          line-height: 1.4;
        }

        [data-theme='dark'] .sp-section-title {
          color: #ffffff;
        }

        .sp-list {
          display: block;
        }

        .recent-keywords {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .sp-row {
          display: flex;
          align-items: center;
        }

        .recent-keyword {
          height: 32px;
          padding: 0 16px;
          background-color: #f3f4f6; /* 회색 바탕 */
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .recent-keyword:hover {
          background-color: #e5e7eb;
          transform: translateY(-1px);
        }

        .sp-chip-text {
          font-family:
            'Noto Sans KR',
            system-ui,
            -apple-system,
            'Segoe UI',
            Roboto,
            sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: #0068fe; /* 파란색 폰트 */
          line-height: 1;
        }

        .sp-empty {
          padding: 40px 20px;
          text-align: center;
          color: #9ca3af;
          font-size: 14px;
        }

        [data-theme='dark'] .sp-empty {
          color: #a8b0bb;
        }

        [data-theme='dark'] .recent-keyword {
          background-color: rgba(255, 255, 255, 0.05);
          border-color: #4b5563;
        }

        [data-theme='dark'] .sp-chip-text {
          color: #31a3fa;
        }

        .sp-back-text {
          margin-left: 0;
          font-family:
            'Noto Sans KR',
            system-ui,
            -apple-system,
            'Segoe UI',
            Roboto,
            sans-serif;
          font-size: 16px;
          font-weight: 500;
          color: #6b7280;
          line-height: 1;
        }

        [data-theme='dark'] .sp-back-text {
          color: #ffffff;
        }
      `}</style>
    </div>
  )
}
