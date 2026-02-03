'use client'

import { cn } from '@/lib/utils'
import { useEffect, useMemo, useState } from 'react'

interface MultiSelectOption {
  value: string
  label: string
}

interface PremiumMultiSelectProps {
  label: string
  options: MultiSelectOption[]
  selectedValues: string[]
  onChange: (values: string[]) => void
  customInputPlaceholder?: string
  className?: string
}

export function PremiumMultiSelect({
  label,
  options,
  selectedValues,
  onChange,
  customInputPlaceholder = '직접 입력하세요',
  className,
}: PremiumMultiSelectProps) {
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
  }, [selectedValues, optionValues, showCustomInput, customInput])

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
        const cleanedValues = removeCustomEntries(selectedValues).filter(v => v !== 'other')
        onChange(cleanedValues)
        setShowCustomInput(false)
        setCustomInput('')
      } else {
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
      if (selectedValues.includes(value)) {
        onChange(selectedValues.filter(v => v !== value))
      } else {
        onChange([...selectedValues, value])
      }
    }
  }

  return (
    <div className={cn('space-y-3', className)}>
      <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest ml-1">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map(option => {
          const isActive = selectedValues.includes(option.value)
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleButtonClick(option.value)}
              className={cn(
                'px-5 py-3 rounded-2xl text-sm font-bold transition-all border-2',
                isActive
                  ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20 scale-105'
                  : 'bg-gray-50/50 border-gray-100 text-foreground hover:bg-gray-100'
              )}
            >
              {option.label}
            </button>
          )
        })}
      </div>
      {showCustomInput && (
        <input
          type="text"
          className="w-full h-12 rounded-2xl border-2 border-blue-100 bg-blue-50/30 px-5 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-bold animate-in slide-in-from-top-2"
          placeholder={customInputPlaceholder}
          value={customInput}
          onChange={e => {
            setCustomInput(e.target.value)
            if (selectedValues.includes('other')) {
              const baseValues = removeCustomEntries(selectedValues)
              const customValue = formatCustomValue(e.target.value)
              const withoutOther = baseValues.filter(v => v !== 'other')
              onChange(customValue ? [...withoutOther, 'other', customValue] : baseValues)
            }
          }}
          autoFocus
        />
      )}
    </div>
  )
}
