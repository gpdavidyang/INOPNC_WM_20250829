'use client'

import React, { useState, useEffect } from 'react'

interface WorkLogSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export const WorkLogSearch: React.FC<WorkLogSearchProps> = ({
  value,
  onChange,
  placeholder = '현장명으로 검색',
}) => {
  const [localValue, setLocalValue] = useState(value)

  // 디바운싱 처리
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue)
    }, 300)

    return () => clearTimeout(timer)
  }, [localValue])

  const handleClear = () => {
    setLocalValue('')
    onChange('')
  }

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={localValue}
          onChange={e => setLocalValue(e.target.value)}
          placeholder={placeholder}
          className="w-full h-10 pl-10 pr-10 border border-[#e6eaf2] rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0068FE] focus:border-transparent"
        />
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-gray-400"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </div>
        {localValue && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-gray-400 hover:text-gray-600"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
