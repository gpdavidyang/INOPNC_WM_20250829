import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
}

interface SelectBoxProps {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

const SelectBox: React.FC<SelectBoxProps> = ({
  options,
  value,
  onChange,
  placeholder = '옵션을 선택하세요',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const selectRef = useRef<HTMLDivElement>(null)
  const selectElementRef = useRef<HTMLSelectElement>(null)

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setFocused(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(opt => opt.value === value)

  const handleSelectChange = (newValue: string) => {
    onChange(newValue)
    setIsOpen(false)
    setFocused(false)
  }

  const handleFocus = () => {
    setFocused(true)
  }

  const handleBlur = () => {
    // 포커스가 옵션 리스트로 이동할 수 있으므로 약간의 지연
    setTimeout(() => {
      if (!selectRef.current?.contains(document.activeElement)) {
        setFocused(false)
      }
    }, 100)
  }

  return (
    <div ref={selectRef} className={`relative ${className}`}>
      {/* 실제 select 요소 (접근성 및 폼 제출용) */}
      <select
        ref={selectElementRef}
        value={value}
        onChange={e => handleSelectChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="sr-only"
        aria-label={placeholder}
      >
        <option value="">{placeholder}</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* 커스텀 드롭다운 UI */}
      <div
        className={`
          relative w-full h-[54px] rounded-xl
          bg-white border border-[#E2E8F0]
          shadow-[0_4px_20px_rgba(0,0,0,0.05)]
          transition-all duration-200
          cursor-pointer
          ${focused || isOpen ? 'border-[#31A3FA] ring-[3px] ring-[#31A3FA]/20' : ''}
          dark:bg-[#1E293B] dark:border-[#334155]
        `}
        onClick={() => setIsOpen(!isOpen)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        role="button"
        tabIndex={0}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {/* 선택된 값 표시 */}
        <div className="h-full flex items-center px-4">
          <span
            className={`
              flex-1 text-left text-[17px]
              font-bold leading-tight
              ${selectedOption ? 'text-[#111111]' : 'text-[#94A3B8]'}
              dark:text-[#F1F5F9] dark:font-semibold
            `}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>

          {/* ChevronDown 아이콘 */}
          <ChevronDown
            size={20}
            className={`
              ml-2 flex-shrink-0 transition-transform duration-200
              ${isOpen ? 'transform rotate-180' : ''}
              ${focused || isOpen ? 'text-[#31A3FA]' : 'text-[#64748B]'}
              dark:text-[#94A3B8]
            `}
            style={{ marginRight: '16px' }}
          />
        </div>

        {/* 드롭다운 옵션 리스트 */}
        {isOpen && (
          <div
            className={`
              absolute top-[62px] left-0 right-0 z-50
              bg-white border border-[#E2E8F0] rounded-xl
              shadow-[0_10px_25px_rgba(0,0,0,0.15)]
              max-h-[300px] overflow-y-auto
              dark:bg-[#1E293B] dark:border-[#334155]
            `}
            role="listbox"
          >
            {options.map(option => (
              <div
                key={option.value}
                className={`
                  px-4 py-[14px] cursor-pointer
                  text-[17px] font-bold
                  transition-colors duration-100
                  border-b border-[#E2E8F0] last:border-b-0
                  hover:bg-[#F2F4F6]
                  ${value === option.value ? 'bg-[#EAF6FF] text-[#31A3FA]' : 'text-[#111111]'}
                  dark:border-[#334155] dark:hover:bg-[#0F172A]
                  dark:text-[#F1F5F9] dark:font-semibold
                  ${value === option.value ? 'dark:bg-[#0C4A6E] dark:text-[#7DD3FC]' : ''}
                `}
                onClick={e => {
                  e.stopPropagation()
                  handleSelectChange(option.value)
                }}
                role="option"
                aria-selected={value === option.value}
              >
                {option.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SelectBox
