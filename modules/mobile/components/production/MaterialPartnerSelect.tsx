'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectValue,
  PhSelectTrigger,
} from '@/components/ui/custom-select'
import { cn } from '@/lib/utils'
import type { MaterialPartnerOption } from '@/modules/mobile/types/material-partner'

interface MaterialPartnerSelectProps {
  name: string
  options: MaterialPartnerOption[]
  placeholder?: string
  required?: boolean
  defaultValue?: string
  className?: string
  disabled?: boolean
}

const STATUS_LABEL: Record<string, string> = {
  active: '사용 중',
  inactive: '중지',
}

export function MaterialPartnerSelect({
  name,
  options,
  placeholder = '자재거래처 선택',
  required = false,
  defaultValue = '',
  className,
  disabled = false,
}: MaterialPartnerSelectProps) {
  const [value, setValue] = useState<string>(defaultValue)

  useEffect(() => {
    setValue(defaultValue)
  }, [defaultValue])

  const resolvedOptions = useMemo<MaterialPartnerOption[]>(() => {
    if (options.length > 0) return options
    return [
      {
        value: '__empty__',
        label: '등록된 자재거래처가 없습니다',
        disabled: true,
      },
    ]
  }, [options])

  const effectiveDisabled = disabled

  const findLabel = (val: string) => resolvedOptions.find(opt => opt.value === val)?.label

  const renderStatus = (status?: string | null) => {
    if (!status) return null
    const key = status.toLowerCase()
    return STATUS_LABEL[key] || status
  }

  const partnerLabelValue = findLabel(value) || ''

  return (
    <div className={cn('relative', className)}>
      <input
        type="text"
        name={name}
        value={value}
        readOnly
        required={required}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only absolute w-px h-px -m-px overflow-hidden"
      />
      <input type="hidden" name={`${name}_label`} value={partnerLabelValue} />
      <CustomSelect value={value} onValueChange={setValue} disabled={effectiveDisabled}>
        <PhSelectTrigger className="w-full h-10 rounded-[14px] border border-[#E5EAF3] bg-white">
          <CustomSelectValue placeholder={placeholder}>
            {findLabel(value) || placeholder}
          </CustomSelectValue>
        </PhSelectTrigger>
        <CustomSelectContent className="custom-select-content max-h-64 overflow-auto">
          {resolvedOptions.map(option => (
            <CustomSelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              className="py-2"
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-sm">{option.label}</span>
                {(option.description || option.status) && (
                  <span className="text-[11px] text-muted-foreground">
                    {option.description}
                    {option.description && option.status ? ' · ' : ''}
                    {renderStatus(option.status)}
                  </span>
                )}
              </div>
            </CustomSelectItem>
          ))}
        </CustomSelectContent>
      </CustomSelect>
    </div>
  )
}

export default MaterialPartnerSelect
