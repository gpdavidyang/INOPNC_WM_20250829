'use client'

import React, { useEffect, useState } from 'react'

interface QuantityStepperProps {
  name: string
  defaultValue?: number
  step?: number
  min?: number
  disabled?: boolean
}

export const QuantityStepper: React.FC<QuantityStepperProps> = ({
  name,
  defaultValue = 0,
  step = 10,
  min = 0,
  disabled = false,
}) => {
  const [value, setValue] = useState<number>(defaultValue)

  useEffect(() => {
    setValue(defaultValue)
  }, [defaultValue])

  const inc = () => setValue(v => Math.max(min, v + step))
  const dec = () => setValue(v => Math.max(min, v - step))

  return (
    <div className="qty" aria-label="수량 입력">
      <button type="button" onClick={dec} aria-label="감소" disabled={disabled}>
        −
      </button>
      <input
        type="number"
        name={name}
        min={min}
        step={step}
        value={value}
        onChange={e => setValue(parseInt(e.target.value || '0', 10))}
        aria-label="수량"
        disabled={disabled}
      />
      <button type="button" onClick={inc} aria-label="증가" disabled={disabled}>
        +
      </button>
    </div>
  )
}
