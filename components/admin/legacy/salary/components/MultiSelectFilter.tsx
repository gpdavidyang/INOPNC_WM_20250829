'use client'

import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check, X } from 'lucide-react'

interface Option {
  value: string
  label: string
  group?: string
}

interface MultiSelectFilterProps {
  label: string
  options: Option[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  grouped?: boolean
}

export default function MultiSelectFilter({
  label,
  options,
  selected,
  onChange,
  placeholder = '선택하세요',
  grouped = false,
}: MultiSelectFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      })
    }
  }, [isOpen])

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const groupedOptions = grouped
    ? filteredOptions.reduce(
        (acc, option) => {
          const group = option.group || '기타'
          if (!acc[group]) acc[group] = []
          acc[group].push(option)
          return acc
        },
        {} as Record<string, Option[]>
      )
    : { '': filteredOptions }

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  const toggleAll = () => {
    if (selected.length === options.length) {
      onChange([])
    } else {
      onChange(options.map(o => o.value))
    }
  }

  const clearSelection = () => {
    onChange([])
    setSearchTerm('')
  }

  const selectedLabels = selected
    .map(value => options.find(o => o.value === value)?.label)
    .filter(Boolean)

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>

      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-left flex items-center justify-between hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
      >
        <span className="text-sm text-gray-900 dark:text-gray-100 truncate">
          {selected.length === 0
            ? placeholder
            : selected.length === options.length
              ? '전체 선택됨'
              : `${selectedLabels.slice(0, 2).join(', ')}${
                  selected.length > 2 ? ` 외 ${selected.length - 2}개` : ''
                }`}
        </span>
        <div className="flex items-center gap-1">
          {selected.length > 0 && (
            <button
              onClick={e => {
                e.stopPropagation()
                clearSelection()
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
            >
              <X className="h-3 w-3 text-gray-500" />
            </button>
          )}
          <ChevronDown
            className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {isOpen &&
        typeof window !== 'undefined' &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed !bg-white dark:!bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl max-h-60 overflow-auto"
            style={{
              backgroundColor: 'white',
              zIndex: 100000,
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
            }}
          >
            {/* Search */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-2">
              <input
                type="text"
                placeholder="검색..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                onClick={e => e.stopPropagation()}
              />
            </div>

            {/* Select All */}
            <div className="sticky top-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={toggleAll}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <div
                  className={`w-4 h-4 border rounded flex items-center justify-center ${
                    selected.length === options.length
                      ? 'bg-blue-600 border-blue-600'
                      : selected.length > 0
                        ? 'bg-blue-100 border-blue-600'
                        : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {selected.length === options.length && <Check className="h-3 w-3 text-white" />}
                  {selected.length > 0 && selected.length < options.length && (
                    <div className="w-2 h-0.5 bg-blue-600" />
                  )}
                </div>
                <span className="font-medium text-gray-900 dark:text-gray-100">전체 선택</span>
              </button>
            </div>

            {/* Options */}
            <div className="py-1">
              {Object.entries(groupedOptions).map(([group, groupOptions]) => (
                <div key={group}>
                  {group && (
                    <div className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      {group}
                    </div>
                  )}
                  {groupOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => toggleOption(option.value)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <div
                        className={`w-4 h-4 border rounded flex items-center justify-center ${
                          selected.includes(option.value)
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        {selected.includes(option.value) && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <span className="text-gray-900 dark:text-gray-100">{option.label}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>

            {filteredOptions.length === 0 && (
              <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                검색 결과가 없습니다
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  )
}
