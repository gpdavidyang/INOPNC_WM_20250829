import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
}

interface SelectBoxProps {
  options: SelectOption[]
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
}

const SelectBox: React.FC<SelectBoxProps> = ({
  options,
  value = '',
  onChange,
  placeholder = '옵션을 선택하세요',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedValue, setSelectedValue] = useState(value)
  const selectRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSelectedValue(value)
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (optionValue: string) => {
    setSelectedValue(optionValue)
    setIsOpen(false)
    if (onChange) {
      onChange(optionValue)
    }
  }

  const selectedLabel = selectedValue
    ? options.find(opt => opt.value === selectedValue)?.label || placeholder
    : placeholder

  return (
    <div ref={selectRef} className={`custom-select-box-wrapper ${className}`}>
      <button
        type="button"
        className={`custom-select-box ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="custom-select-text">{selectedLabel}</span>
        <ChevronDown className={`custom-select-icon ${isOpen ? 'rotated' : ''}`} size={20} />
      </button>
      {isOpen && (
        <div className="custom-select-dropdown">
          {options.map(option => (
            <div
              key={option.value}
              className={`custom-select-option ${selectedValue === option.value ? 'selected' : ''}`}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SelectBox
