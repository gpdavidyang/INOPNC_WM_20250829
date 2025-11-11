'use client'

import { useMemo, useState } from 'react'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'

interface MaterialOption {
  id: string
  name?: string | null
  code?: string | null
}

interface MaterialFilterSelectProps {
  options: MaterialOption[]
  name?: string
  defaultValue?: string
  placeholder?: string
}

export default function MaterialFilterSelect({
  options,
  name = 'material_name',
  defaultValue,
  placeholder = '전체 자재',
}: MaterialFilterSelectProps) {
  const normalized = useMemo(() => {
    return options
      .map(option => {
        const label = option.name?.trim() || option.code?.trim() || '이름 미정'
        const value = option.name?.trim() || option.code?.trim() || option.id
        return {
          id: option.id,
          label,
          code: option.code,
          value,
        }
      })
      .filter(option => option.value)
  }, [options])

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
          <CustomSelectItem value="all">전체 자재</CustomSelectItem>
          {normalized.map(option => (
            <CustomSelectItem key={`${option.id}-${option.value}`} value={option.value}>
              {option.label}
              {option.code && option.code !== option.label ? ` (${option.code})` : ''}
            </CustomSelectItem>
          ))}
        </CustomSelectContent>
      </CustomSelect>
    </>
  )
}
