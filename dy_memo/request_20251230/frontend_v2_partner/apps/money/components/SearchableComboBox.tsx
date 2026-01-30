import React, { useState, useEffect, useRef } from 'react'
import { ChevronDown, Check } from 'lucide-react'

interface SearchableComboBoxProps {
  items: string[]
  placeholder: string
  selectedItem: string
  onSelect: (item: string) => void
}

const SearchableComboBox: React.FC<SearchableComboBoxProps> = ({
  items,
  placeholder,
  selectedItem,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Filter items based on search term (fuzzy match)
  // Ensure "전체 현장" is always available if the search is empty or matches
  const filteredItems = items.filter(item =>
    item === '' ? false : item.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Handle Double Scroll Prevention
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('') // Reset search when closing
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

  const displayText = selectedItem || '현장 선택'

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger Area (mimics the original select box) */}
      <div
        className={`
          w-full h-[54px] bg-white border rounded-xl px-[18px] pr-[40px]
          flex items-center cursor-pointer transition-all duration-200
          ${isOpen ? 'border-primary shadow-[0_0_0_3px_rgba(49,163,250,0.15)]' : 'border-[#e2e8f0] hover:border-[#cbd5e1]'}
          dark:bg-[#0f172a] dark:border-[#334155] dark:text-white
        `}
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 50)
          }
        }}
      >
        <span
          className={`font-main text-[17px] font-semibold ${selectedItem ? 'text-[#111111] dark:text-white' : 'text-[#111111] dark:text-white'}`}
        >
          {displayText}
        </span>
        <ChevronDown className="absolute right-4 text-[#333333] dark:text-[#94a3b8]" size={20} />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-[#1e293b] border border-gray-100 dark:border-[#334155] rounded-xl shadow-lg overflow-hidden animate-fadeIn">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-100 dark:border-[#334155]">
            <input
              ref={inputRef}
              type="text"
              className="w-full h-10 px-3 bg-gray-50 dark:bg-[#0f172a] rounded-lg text-sm outline-none border border-transparent focus:border-primary transition-colors dark:text-white"
              placeholder="현장 검색..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onClick={e => e.stopPropagation()} // Prevent closing when clicking input
            />
          </div>

          {/* Options List */}
          <div className="max-h-[250px] overflow-y-auto overscroll-contain">
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
              <div className="px-4 py-6 text-center text-sm text-gray-400">
                검색 결과가 없습니다.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchableComboBox
