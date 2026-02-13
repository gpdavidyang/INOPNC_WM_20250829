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
    <div className={`mb-3 ${className}`}>
      <label className="block text-[17px] font-bold text-text-sub mb-2">{label}</label>
      <div className="grid grid-cols-4 gap-2 mb-2">
        {options.map(option => {
          const isActive = selectedValues.includes(option.value)
          return (
            <button
              key={option.value}
              type="button"
              className={`h-[54px] rounded-xl border text-[17px] font-medium transition-all ${
                isActive
                  ? 'bg-[var(--bg-surface)] border-primary text-primary font-bold shadow-sm'
                  : 'bg-[var(--bg-input)] border-[var(--border)] text-text-sub'
              }`}
              style={
                isActive
                  ? {
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--primary)',
                      color: 'var(--primary)',
                    }
                  : {
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-sub)',
                    }
              }
              onClick={() => handleButtonClick(option.value)}
            >
              {option.label}
            </button>
          )
        })}
      </div>
      {showCustomInput && (
        <input
          type="text"
          className="w-full h-[54px] border border-[var(--border)] rounded-xl px-4 text-[17px] mt-1 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          placeholder={customInputPlaceholder}
          value={customInput}
          style={{
            border: '1px solid var(--border)',
            animation: 'slideDown 0.2s ease-out',
            background: 'var(--bg-surface)',
          }}
          onChange={e => handleCustomInputChange(e.target.value)}
          onBlur={handleCustomInputBlur}
          autoFocus
        />
      )}
    </div>
  )
}
