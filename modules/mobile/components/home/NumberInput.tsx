'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { FALLBACK_LABOR_HOUR_OPTIONS } from '@/lib/labor/labor-hour-options'

const DEFAULT_MANPOWER_VALUES = Array.from(FALLBACK_LABOR_HOUR_OPTIONS)

interface NumberInputProps {
  value: number
  onChange: (value: number) => void
  values?: readonly number[] // 선택 가능한 값들
  min?: number
  max?: number
  step?: number
  label?: string
  className?: string
}

export const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  values = DEFAULT_MANPOWER_VALUES,
  min,
  max,
  step = 0.5,
  label,
  className = '',
}) => {
  const normalizedValues = useMemo(
    () => (values.length > 0 ? Array.from(values) : Array.from(DEFAULT_MANPOWER_VALUES)),
    [values]
  )
  const minValue = min ?? normalizedValues[0]
  const maxValue = max ?? normalizedValues[normalizedValues.length - 1]
  const [currentIndex, setCurrentIndex] = useState(0)

  // 현재 값에 맞는 인덱스 찾기
  useEffect(() => {
    const index = normalizedValues.findIndex(v => v === value)
    if (index !== -1) {
      setCurrentIndex(index)
    }
  }, [value, normalizedValues])

  const handleDecrease = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1
      setCurrentIndex(newIndex)
      onChange(normalizedValues[newIndex])
    }
  }

  const handleIncrease = () => {
    if (currentIndex < normalizedValues.length - 1) {
      const newIndex = currentIndex + 1
      setCurrentIndex(newIndex)
      onChange(normalizedValues[newIndex])
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = parseFloat(e.target.value)
    if (Number.isNaN(inputValue) || inputValue < minValue || inputValue > maxValue) return

    const matchingIndex = normalizedValues.findIndex(v => v === inputValue)
    if (matchingIndex !== -1) {
      setCurrentIndex(matchingIndex)
      onChange(normalizedValues[matchingIndex])
      return
    }

    let closestIndex = 0
    let minDiff = Math.abs(normalizedValues[0] - inputValue)
    normalizedValues.forEach((v, i) => {
      const diff = Math.abs(v - inputValue)
      if (diff < minDiff) {
        minDiff = diff
        closestIndex = i
      }
    })
    setCurrentIndex(closestIndex)
    onChange(normalizedValues[closestIndex])
  }

  return (
    <div className={`number-input-container ${className}`}>
      {label && <label className="form-label">{label}</label>}
      <div className="number-input">
        <button
          type="button"
          className="number-btn minus"
          onClick={handleDecrease}
          disabled={currentIndex === 0}
          aria-label="감소"
        >
          -
        </button>
        <input
          type="number"
          className="number-field"
          value={value}
          onChange={handleInputChange}
          min={minValue}
          max={maxValue}
          step={step}
        />
        <button
          type="button"
          className="number-btn plus"
          onClick={handleIncrease}
          disabled={currentIndex === values.length - 1}
          aria-label="증가"
        >
          +
        </button>
      </div>
    </div>
  )
}

export default NumberInput
