'use client'

import React, { useState, useEffect } from 'react'

interface WorkLogSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  showCancel?: boolean
}

export const WorkLogSearch: React.FC<WorkLogSearchProps> = ({
  value,
  onChange,
  placeholder = '현장명으로 검색',
  showCancel = true,
}) => {
  const [localValue, setLocalValue] = useState(value)

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

  const handleClear = () => {
    setLocalValue('')
    onChange('')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value)
  }

  return (
    <div className="relative animate-fadeIn">
      <div className="relative">
        <input
          type="text"
          value={localValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full h-12 pl-12 pr-12 border border-[var(--line)] rounded-[var(--radius)] bg-[var(--card)] text-[var(--text)] text-base font-medium placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--num)] focus:border-transparent transition-all duration-200 mobile-button touch-optimized"
          style={{ fontSize: 'max(16px, 1rem)' }}
        />
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-[var(--muted)]"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </div>
        {showCancel && localValue && (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-[var(--muted)] hover:bg-[var(--text)] transition-all duration-200 mobile-button touch-optimized"
            aria-label="검색어 지우기"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="text-white"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Search State Indicator */}
      {localValue && (
        <div className="absolute top-full left-0 right-0 mt-1 text-xs text-[var(--muted)] animate-fadeIn">
          "{localValue}" 검색 중...
        </div>
      )}
    </div>
  )
}
