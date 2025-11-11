'use client'

import { useState } from 'react'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import { MATERIAL_PRIORITY_OPTIONS, MATERIAL_PRIORITY_LABELS } from '@/lib/materials/priorities'

interface PriorityFilterSelectProps {
  name?: string
  defaultValue?: string
  placeholder?: string
}

export default function PriorityFilterSelect({
  name = 'priority',
  defaultValue,
  placeholder = '전체 긴급도',
}: PriorityFilterSelectProps) {
  const initialValue = defaultValue && defaultValue.trim() ? defaultValue : 'all'
  const [value, setValue] = useState(initialValue)

  return (
    <>
      <input type="hidden" name={name} value={value === 'all' ? '' : value} />
      <CustomSelect value={value} onValueChange={setValue}>
        <CustomSelectTrigger className="rounded-lg h-11">
          <CustomSelectValue placeholder={placeholder} />
        </CustomSelectTrigger>
        <CustomSelectContent align="start">
          <CustomSelectItem value="all">전체 긴급도</CustomSelectItem>
          {MATERIAL_PRIORITY_OPTIONS.map(option => (
            <CustomSelectItem key={option.value} value={option.value}>
              {MATERIAL_PRIORITY_LABELS[option.value]}
            </CustomSelectItem>
          ))}
        </CustomSelectContent>
      </CustomSelect>
    </>
  )
}
