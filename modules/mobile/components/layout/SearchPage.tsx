'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Search, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SearchPageProps {
  isOpen: boolean
  onClose: () => void
}

export const SearchPage: React.FC<SearchPageProps> = ({ isOpen, onClose }) => {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<string[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // 검색 키워드 목록 (데모용)
  const keywords = [
    'INOPNC 프로젝트',
    '현장 관리',
    '작업 일지',
    '출력 현황',
    '문서 관리',
    '사용자 설정',
    '알림 설정',
    '데이터 분석',
    '일일 보고서',
    '작업자 관리',
    '자재 관리',
    '안전 관리',
    '품질 관리',
    '공정 관리',
    '예산 관리',
    '일정 관리',
  ]

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

  // 검색 처리
  const handleSearch = (query: string) => {
    if (!query.trim()) return

    // 검색 결과 필터링
    const results = keywords.filter(keyword => keyword.toLowerCase().includes(query.toLowerCase()))
    setSearchResults(results)

    // 최근 검색어 저장
    const newRecent = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5)
    setRecentSearches(newRecent)
    localStorage.setItem('inopnc_recent_searches', JSON.stringify(newRecent))
  }

  // 검색어 입력 처리
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    if (query) {
      handleSearch(query)
    } else {
      setSearchResults([])
    }
  }

  // 검색어 클릭 처리
  const handleResultClick = (result: string) => {
    console.log('검색 결과 클릭:', result)
    // 실제 구현 시 해당 페이지로 이동하거나 관련 기능 실행
    onClose()
  }

  // 최근 검색어 삭제
  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem('inopnc_recent_searches')
  }

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
                handleSearch(searchQuery)
              }
            }}
          />
          {searchQuery && (
            <button
              className="clear-btn"
              onClick={() => {
                setSearchQuery('')
                setSearchResults([])
                inputRef.current?.focus()
              }}
            >
              <X className="w-4 h-4" />
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
                <button
                  key={index}
                  className="recent-item"
                  onClick={() => {
                    setSearchQuery(search)
                    handleSearch(search)
                  }}
                >
                  <Search className="w-4 h-4" />
                  <span>{search}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {searchQuery && searchResults.length > 0 && (
          <div className="search-results">
            <div className="section-header">
              <h3>검색 결과</h3>
              <span>{searchResults.length}건</span>
            </div>
            <div className="results-list">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  className="result-item"
                  onClick={() => handleResultClick(result)}
                >
                  <Search className="w-4 h-4" />
                  <span>{result}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {searchQuery && searchResults.length === 0 && (
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
          width: 20px;
          height: 20px;
          color: var(--muted-ink);
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

        .search-input:focus {
          border-color: var(--tag-blue);
          background: var(--surface);
        }

        .clear-btn {
          position: absolute;
          right: 12px;
          background: transparent;
          border: none;
          padding: 4px;
          cursor: pointer;
          color: var(--muted-ink);
          border-radius: 50%;
          transition: background 0.2s;
        }

        .clear-btn:hover {
          background: rgba(0, 0, 0, 0.05);
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
