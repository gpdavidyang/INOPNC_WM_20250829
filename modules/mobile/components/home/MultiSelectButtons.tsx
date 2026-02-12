'use client'

import React, { useEffect, useMemo, useState } from 'react'

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
  className = '',
}) => {
  const [customInput, setCustomInput] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)

  const optionValues = useMemo(() => options.map(option => option.value), [options])

  useEffect(() => {
    if (selectedValues.includes('other')) {
      setShowCustomInput(true)
      const existingCustom = selectedValues.find(
        value => value !== 'other' && !optionValues.includes(value)
      )

      if (existingCustom) {
        const normalized = existingCustom.replace(/^기타[:\s]*/, '').trim()
        if (normalized && normalized !== customInput) {
          setCustomInput(normalized)
        }
      }
    } else if (showCustomInput) {
      setShowCustomInput(false)
      setCustomInput('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedValues, optionValues])

  const removeCustomEntries = (values: string[]) =>
    values.filter(value => value === 'other' || optionValues.includes(value))

  const formatCustomValue = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return ''
    return trimmed.startsWith('기타') ? trimmed : `기타: ${trimmed}`
  }

  const handleButtonClick = (value: string) => {
    if (value === 'other') {
      if (selectedValues.includes('other')) {
        // 기타 선택 해제 + 커스텀 값 제거
        const cleanedValues = removeCustomEntries(selectedValues).filter(v => v !== 'other')
        onChange(cleanedValues)
        setShowCustomInput(false)
        setCustomInput('')
      } else {
        // 기타 선택
        const cleanedValues = removeCustomEntries(selectedValues).filter(v => v !== 'other')
        const nextValues = [...cleanedValues, 'other']
        if (customInput.trim()) {
          const customValue = formatCustomValue(customInput)
          if (customValue) nextValues.push(customValue)
        }
        onChange(nextValues)
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
      const baseValues = removeCustomEntries(selectedValues)
      const customValue = formatCustomValue(value)
      if (customValue) {
        const withoutOther = baseValues.filter(v => v !== 'other')
        onChange([...withoutOther, 'other', customValue])
      } else {
        onChange(baseValues)
      }
    }
  }

  const handleCustomInputBlur = () => {
    if (!customInput.trim() && selectedValues.includes('other')) {
      // 입력값이 없으면 기타 선택 해제
      const cleanedValues = removeCustomEntries(selectedValues).filter(v => v !== 'other')
      onChange(cleanedValues)
      setShowCustomInput(false)
    }
  }

  return (
    <div className={`form-group ${className}`}>
      <label className="form-label">{label}</label>
      <div className="button-group">
        {options.map(option => (
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
          onChange={e => handleCustomInputChange(e.target.value)}
          onBlur={handleCustomInputBlur}
          autoFocus
        />
      )}
    </div>
  )
}
