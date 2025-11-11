'use client'

import { useMemo, useState } from 'react'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'

interface SiteOption {
  id: string
  name: string | null
}

interface InventorySiteFilterSelectProps {
  sites: SiteOption[]
  name?: string
  defaultValue?: string
  placeholder?: string
}

export default function InventorySiteFilterSelect({
  sites,
  name = 'site_id',
  defaultValue,
  placeholder = '전체 현장',
}: InventorySiteFilterSelectProps) {
  const normalizedSites = useMemo(() => {
    const seen = new Set<string>()
    return sites.filter(site => {
      if (!site?.id || seen.has(site.id)) return false
      seen.add(site.id)
      return true
    })
  }, [sites])

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
          <CustomSelectItem value="all">전체 현장</CustomSelectItem>
          {normalizedSites.map(site => (
            <CustomSelectItem key={site.id} value={site.id}>
              {site.name || '이름 미정'}
            </CustomSelectItem>
          ))}
        </CustomSelectContent>
      </CustomSelect>
    </>
  )
}
