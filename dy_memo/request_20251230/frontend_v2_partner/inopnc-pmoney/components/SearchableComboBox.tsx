import React, { useState, useEffect, useRef } from 'react'
import { ChevronDown, Check } from 'lucide-react'

interface SearchableComboBoxProps {
  items: string[]
  placeholder: string
  selectedItem: string
  onSelect: (item: string) => void
  className?: string // Allow passing external classes
}

const SearchableComboBox: React.FC<SearchableComboBoxProps> = ({
  items,
  placeholder,
  selectedItem,
  onSelect,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filteredItems = items.filter(item =>
    item === '' ? false : item.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Prevent double scrolling
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (item: string) => {
    onSelect(item)
    setIsOpen(false)
    setSearchTerm('')
  }

  const displayText = selectedItem === '' ? placeholder : selectedItem

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger Area - matching .form-select styles from global CSS */}
      <div
        className={`form-select flex items-center justify-between ${className || ''}`}
        style={{ backgroundImage: 'none', paddingRight: '18px' }} // Override CSS background image to use Lucide
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 50)
          }
        }}
      >
        <span
          className={`${selectedItem ? 'text-[#111111] dark:text-white' : 'text-[#111111] dark:text-white'}`}
        >
          {displayText}
        </span>
        <ChevronDown className="text-[#333333] dark:text-[#94a3b8]" size={20} />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-[#1e293b] border border-gray-100 dark:border-[#334155] rounded-xl shadow-lg overflow-hidden animate-fadeIn">
          <div className="p-2 border-b border-gray-100 dark:border-[#334155]">
            <input
              ref={inputRef}
              type="text"
              className="w-full h-10 px-3 bg-gray-50 dark:bg-[#0f172a] rounded-lg text-sm outline-none border border-transparent focus:border-primary transition-colors dark:text-white"
              placeholder="검색..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
          </div>

          <div className="max-h-[250px] overflow-y-auto overscroll-contain">
            <div
              className={`px-4 py-3 text-[15px] font-medium cursor-pointer flex items-center justify-between hover:bg-[#eaf6ff] dark:hover:bg-[#334155] dark:text-gray-200
                  ${selectedItem === '' ? 'text-primary bg-[#eaf6ff] dark:bg-[#1e293b]' : 'text-gray-700'}
                `}
              onClick={() => handleSelect('')}
            >
              <span>{placeholder}</span>
              {selectedItem === '' && <Check size={16} className="text-primary" />}
            </div>

            {filteredItems.map((item, idx) => (
              <div
                key={`${item}-${idx}`}
                className={`px-4 py-3 text-[15px] font-medium cursor-pointer flex items-center justify-between hover:bg-[#eaf6ff] dark:hover:bg-[#334155] dark:text-gray-200
                  ${selectedItem === item ? 'text-primary bg-[#eaf6ff] dark:bg-[#1e293b]' : 'text-gray-700'}
                `}
                onClick={() => handleSelect(item)}
              >
                <span>{item}</span>
                {selectedItem === item && <Check size={16} className="text-primary" />}
              </div>
            ))}

            {filteredItems.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-gray-400">결과 없음</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchableComboBox
