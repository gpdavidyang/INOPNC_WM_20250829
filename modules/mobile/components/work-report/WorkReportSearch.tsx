'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Search, X } from 'lucide-react'
import { debounce } from 'lodash'

interface WorkReportSearchProps {
  value: string
  onSearch: (query: string) => void
  placeholder?: string
}

export default function WorkReportSearch({
  value,
  onSearch,
  placeholder = '검색',
}: WorkReportSearchProps) {
  const [localValue, setLocalValue] = useState(value)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      onSearch(query)
    }, 300),
    [onSearch]
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)
    debouncedSearch(newValue)
  }

  const handleClear = () => {
    setLocalValue('')
    onSearch('')
  }

  return (
    <div className="work-report-search">
      <div className="search-container">
        <Search className="search-icon" size={20} />
        <input
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={localValue}
          onChange={handleChange}
        />
        {localValue && (
          <button className="clear-button" onClick={handleClear} aria-label="Clear search">
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  )
}
