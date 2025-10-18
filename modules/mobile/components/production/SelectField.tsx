'use client'

import React, { useState, useEffect } from 'react'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
  PhSelectTrigger,
} from '@/components/ui/custom-select'

export interface OptionItem {
  value: string
  label: string
}

interface SelectFieldProps {
  name: string
  options: OptionItem[]
  placeholder?: string
  required?: boolean
  className?: string
  defaultValue?: string
}

export const SelectField: React.FC<SelectFieldProps> = ({
  name,
  options,
  placeholder = '선택',
  required = false,
  className,
  defaultValue = '',
}) => {
  const [value, setValue] = useState<string>(defaultValue)

  useEffect(() => {
    setValue(defaultValue)
  }, [defaultValue])

  return (
    <div className={className}>
      <input type="hidden" name={name} value={value} required={required} />
      <CustomSelect value={value} onValueChange={setValue}>
        <PhSelectTrigger>
          <CustomSelectValue placeholder={placeholder}>
            {options.find(o => o.value === value)?.label || placeholder}
          </CustomSelectValue>
        </PhSelectTrigger>
        <CustomSelectContent align="start" className="custom-select-content">
          {options.length === 0 ? (
            <CustomSelectItem value="__empty__" disabled>
              항목이 없습니다
            </CustomSelectItem>
          ) : (
            options.map(opt => (
              <CustomSelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </CustomSelectItem>
            ))
          )}
        </CustomSelectContent>
      </CustomSelect>
    </div>
  )
}
