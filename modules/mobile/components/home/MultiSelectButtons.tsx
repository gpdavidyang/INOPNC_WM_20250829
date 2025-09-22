'use client'

import React, { useState } from 'react'

interface MultiSelectOption {
  value: string
  label: string
}

interface MultiSelectButtonsProps {
  label: string
  options: MultiSelectOption[]
  selectedValues: string[]
  onChange: (values: string[]) => void
  customInputPlaceholder?: string
  className?: string
}

export const MultiSelectButtons: React.FC<MultiSelectButtonsProps> = ({
  label,
  options,
  selectedValues,
  onChange,
  customInputPlaceholder = '직접 입력하세요',
  className = ''
}) => {
  const [customInput, setCustomInput] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)

  const handleButtonClick = (value: string) => {
    if (value === 'other') {
      if (selectedValues.includes('other')) {
        // 기타 선택 해제
        const newValues = selectedValues.filter(v => v !== 'other')
        onChange(newValues)
        setShowCustomInput(false)
        setCustomInput('')
      } else {
        // 기타 선택
        const newValues = [...selectedValues, 'other']
        onChange(newValues)
        setShowCustomInput(true)
      }
    } else {
      // 일반 옵션 토글
      if (selectedValues.includes(value)) {
        const newValues = selectedValues.filter(v => v !== value)
        onChange(newValues)
      } else {
        const newValues = [...selectedValues, value]
        onChange(newValues)
      }
    }
  }

  const handleCustomInputChange = (value: string) => {
    setCustomInput(value)
    // 기타가 선택되어 있고 입력값이 있는 경우만 상태에 반영
    if (selectedValues.includes('other')) {
      const otherValues = selectedValues.filter(v => v !== 'other')
      if (value.trim()) {
        onChange([...otherValues, 'other', value.trim()])
      } else {
        onChange([...otherValues, 'other'])
      }
    }
  }

  const handleCustomInputBlur = () => {
    if (!customInput.trim() && selectedValues.includes('other')) {
      // 입력값이 없으면 기타 선택 해제
      const newValues = selectedValues.filter(v => v !== 'other')
      onChange(newValues)
      setShowCustomInput(false)
    }
  }

  return (
    <div className={`form-group ${className}`}>
      <label className="form-label">{label}</label>
      <div className="button-group">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`option-btn ${selectedValues.includes(option.value) ? 'active' : ''}`}
            onClick={() => handleButtonClick(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      {showCustomInput && (
        <input
          type="text"
          className="form-input custom-input"
          placeholder={customInputPlaceholder}
          value={customInput}
          onChange={(e) => handleCustomInputChange(e.target.value)}
          onBlur={handleCustomInputBlur}
          style={{
            display: 'block',
            marginTop: '8px',
            borderRadius: '14px'
          }}
          autoFocus
        />
      )}
    </div>
  )
}