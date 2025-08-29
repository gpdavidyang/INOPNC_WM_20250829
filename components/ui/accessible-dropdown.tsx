'use client'

import React, { forwardRef, useState, useRef, useEffect, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useFontSize, getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'
import { useKeyboardNavigation } from '@/hooks/use-keyboard-navigation'
import { ChevronDown, Check } from 'lucide-react'

export interface DropdownOption {
  value: string
  label: string
  disabled?: boolean
  description?: string
}

export interface AccessibleDropdownProps {
  options: DropdownOption[]
  value?: string
  placeholder?: string
  onSelect: (value: string) => void
  disabled?: boolean
  error?: boolean
  className?: string
  id?: string
  'aria-label'?: string
  'aria-describedby'?: string
  'aria-labelledby'?: string
  searchable?: boolean
}

export const AccessibleDropdown = forwardRef<HTMLButtonElement, AccessibleDropdownProps>(
  ({ 
    options, 
    value, 
    placeholder = "선택하세요", 
    onSelect, 
    disabled = false,
    error = false,
    className,
    id,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    'aria-labelledby': ariaLabelledBy,
    searchable = false,
    ...props 
  }, ref) => {
    const { isLargeFont } = useFontSize()
    const { touchMode } = useTouchMode()
    const [isOpen, setIsOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const dropdownRef = useRef<HTMLDivElement>(null)
    const searchInputRef = useRef<HTMLInputElement>(null)
    
    const selectedOption = options.find(option => option.value === value)
    
    // Filter options based on search query
    const filteredOptions = searchable 
      ? options.filter(option => 
          option.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : options

    const { currentIndex, handleKeyDown } = useKeyboardNavigation({
      items: filteredOptions,
      onSelect: (index) => {
        const option = filteredOptions[index]
        if (option && !option.disabled) {
          onSelect(option.value)
          setIsOpen(false)
          setSearchQuery('')
        }
      },
      currentValue: value,
      orientation: 'vertical'
    })

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false)
          setSearchQuery('')
        }
      }

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
      }
    }, [isOpen])

    // Focus search input when dropdown opens
    useEffect(() => {
      if (isOpen && searchable && searchInputRef.current) {
        searchInputRef.current.focus()
      }
    }, [isOpen, searchable])

    const getButtonSize = () => {
      if (touchMode === 'glove') return 'min-h-[56px] px-5 py-4'
      if (touchMode === 'precision') return 'min-h-[44px] px-3 py-2'
      return 'min-h-[48px] px-4 py-3'
    }

    const getOptionSize = () => {
      if (touchMode === 'glove') return 'px-5 py-4'
      if (touchMode === 'precision') return 'px-3 py-2'
      return 'px-4 py-3'
    }

    const handleToggle = () => {
      if (!disabled) {
        setIsOpen(!isOpen)
        if (!isOpen) {
          setSearchQuery('')
        }
      }
    }

    const handleOptionSelect = (option: DropdownOption) => {
      if (!option.disabled) {
        onSelect(option.value)
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    return (
      <div ref={dropdownRef} className={cn('relative', className)}>
        <button
          ref={ref}
          type="button"
          id={id}
          onClick={handleToggle}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy}
          aria-labelledby={ariaLabelledBy}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className={cn(
            'w-full text-left border rounded-lg transition-colors',
            'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500',
            getButtonSize(),
            getFullTypographyClass('body', 'base', isLargeFont),
            error 
              ? 'border-red-300 text-red-900 focus-visible:ring-red-500' 
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500',
            disabled 
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed' 
              : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
          )}
          {...props}
        >
          <div className="flex items-center justify-between">
            <span className={selectedOption ? '' : 'text-gray-500'}>
              {selectedOption?.label || placeholder}
            </span>
            <ChevronDown 
              className={cn(
                'h-4 w-4 text-gray-400 transition-transform',
                isOpen && 'rotate-180'
              )}
              aria-hidden="true"
            />
          </div>
        </button>

        {isOpen && (
          <div className={cn(
            'absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg',
            'max-h-60 overflow-auto'
          )}>
            {searchable && (
              <div className="p-2 border-b border-gray-200 dark:border-gray-600">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="검색..."
                  className={cn(
                    'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded',
                    'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
                    'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                    getFullTypographyClass('body', 'sm', isLargeFont)
                  )}
                  aria-label="옵션 검색"
                />
              </div>
            )}
            
            <ul
              role="listbox"
              aria-label={ariaLabel || "옵션 목록"}
              onKeyDown={handleKeyDown}
              className="py-1"
            >
              {filteredOptions.map((option, index) => (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={option.value === value}
                  aria-disabled={option.disabled}
                  className={cn(
                    'cursor-pointer transition-colors',
                    getOptionSize(),
                    getFullTypographyClass('body', 'base', isLargeFont),
                    option.disabled
                      ? 'text-gray-400 cursor-not-allowed'
                      : cn(
                          'text-gray-900 dark:text-gray-100',
                          currentIndex === index && 'bg-blue-50 dark:bg-blue-900/20',
                          option.value === value && 'bg-blue-100 dark:bg-blue-900/40'
                        )
                  )}
                  onClick={() => handleOptionSelect(option)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div>{option.label}</div>
                      {option.description && (
                        <div className={cn(
                          'text-gray-500 dark:text-gray-400',
                          getFullTypographyClass('caption', 'sm', isLargeFont)
                        )}>
                          {option.description}
                        </div>
                      )}
                    </div>
                    {option.value === value && (
                      <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                    )}
                  </div>
                </li>
              ))}
              
              {filteredOptions.length === 0 && (
                <li className={cn(
                  'text-gray-500 dark:text-gray-400 text-center',
                  getOptionSize(),
                  getFullTypographyClass('body', 'base', isLargeFont)
                )}>
                  검색 결과가 없습니다
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    )
  }
)

AccessibleDropdown.displayName = 'AccessibleDropdown'