'use client'

import React, { useState, useEffect } from 'react'
import { MANPOWER_VALUES } from '@/types/worklog'

const DEFAULT_MANPOWER_VALUES = Array.from(MANPOWER_VALUES)

interface NumberInputProps {
  value: number
  onChange: (value: number) => void
  values?: number[] // 선택 가능한 값들
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
  min = DEFAULT_MANPOWER_VALUES[0],
  max = DEFAULT_MANPOWER_VALUES[DEFAULT_MANPOWER_VALUES.length - 1],
  step = 0.5,
  label,
  className = '',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  // 현재 값에 맞는 인덱스 찾기
  useEffect(() => {
    const index = values.findIndex(v => v === value)
    if (index !== -1) {
      setCurrentIndex(index)
    }
  }, [value, values])

  const handleDecrease = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1
      setCurrentIndex(newIndex)
      onChange(values[newIndex])
    }
  }

  const handleIncrease = () => {
    if (currentIndex < values.length - 1) {
      const newIndex = currentIndex + 1
      setCurrentIndex(newIndex)
      onChange(values[newIndex])
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = parseFloat(e.target.value)
    if (Number.isNaN(inputValue) || inputValue < min || inputValue > max) return

    const matchingIndex = values.findIndex(v => v === inputValue)
    if (matchingIndex !== -1) {
      setCurrentIndex(matchingIndex)
      onChange(values[matchingIndex])
      return
    }

    let closestIndex = 0
    let minDiff = Math.abs(values[0] - inputValue)
    values.forEach((v, i) => {
      const diff = Math.abs(v - inputValue)
      if (diff < minDiff) {
        minDiff = diff
        closestIndex = i
      }
    })
    setCurrentIndex(closestIndex)
    onChange(values[closestIndex])
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
          min={min}
          max={max}
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
