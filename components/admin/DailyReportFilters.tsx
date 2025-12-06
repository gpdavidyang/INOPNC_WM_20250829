'use client'

import React from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'

type SiteOption = {
  id: string
  name: string
}

interface DailyReportFiltersProps {
  siteOptions: SiteOption[]
  initialSiteId?: string
  initialSearch?: string
  initialStatus?: string
  initialDateFrom?: string
  initialDateTo?: string
}

export function DailyReportFilters({
  siteOptions,
  initialSiteId,
  initialSearch = '',
  initialStatus = '',
  initialDateFrom = '',
  initialDateTo = '',
}: DailyReportFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [siteId, setSiteId] = React.useState<string>(initialSiteId || '')
  const [search, setSearch] = React.useState(initialSearch)
  const [status, setStatus] = React.useState(initialStatus || '')
  const [dateFrom, setDateFrom] = React.useState(initialDateFrom || '')
  const [dateTo, setDateTo] = React.useState(initialDateTo || '')

  const siteDisplayLabel =
    siteId !== ''
      ? siteOptions.find(option => option.id === siteId)?.name || '현장 선택'
      : '전체 현장'

  const statusDisplayLabel =
    status === 'draft' ? '임시저장' : status === 'submitted' ? '제출' : '전체 상태'

  const applyFilters = React.useCallback(() => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    params.set('page', '1')

    if (siteId) {
      params.set('site_id', siteId)
    } else {
      params.delete('site_id')
    }

    if (search.trim()) {
      params.set('search', search.trim())
    } else {
      params.delete('search')
    }

    if (status) {
      params.set('status', status)
    } else {
      params.delete('status')
    }

    if (dateFrom) {
      params.set('date_from', dateFrom)
    } else {
      params.delete('date_from')
    }

    if (dateTo) {
      params.set('date_to', dateTo)
    } else {
      params.delete('date_to')
    }

    router.push(`${pathname}?${params.toString()}`)
  }, [dateFrom, dateTo, pathname, router, search, searchParams, siteId, status])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    applyFilters()
  }

  const handleReset = () => {
    router.push(pathname)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end"
      noValidate
    >
      <div>
        <label className="block text-sm text-muted-foreground mb-1">현장명</label>
        <CustomSelect
          value={siteId || '__all__'}
          onValueChange={value => setSiteId(value === '__all__' ? '' : value)}
        >
          <CustomSelectTrigger className="h-10 w-full">
            <CustomSelectValue>{siteDisplayLabel}</CustomSelectValue>
          </CustomSelectTrigger>
          <CustomSelectContent>
            <CustomSelectItem value="__all__">전체 현장</CustomSelectItem>
            {siteOptions.map(option => (
              <CustomSelectItem key={option.id} value={option.id}>
                {option.name}
              </CustomSelectItem>
            ))}
          </CustomSelectContent>
        </CustomSelect>
      </div>
      <div>
        <label className="block text-sm text-muted-foreground mb-1">검색어</label>
        <Input
          name="search"
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder="작성자/공종/특이사항 등"
        />
      </div>
      <div>
        <label className="block text-sm text-muted-foreground mb-1">상태</label>
        <CustomSelect
          value={status || '__all__'}
          onValueChange={value => setStatus(value === '__all__' ? '' : value)}
        >
          <CustomSelectTrigger className="h-10 w-full">
            <CustomSelectValue>{statusDisplayLabel}</CustomSelectValue>
          </CustomSelectTrigger>
          <CustomSelectContent>
            <CustomSelectItem value="__all__">전체 상태</CustomSelectItem>
            <CustomSelectItem value="draft">임시저장</CustomSelectItem>
            <CustomSelectItem value="submitted">제출</CustomSelectItem>
          </CustomSelectContent>
        </CustomSelect>
      </div>
      <div>
        <label className="block text-sm text-muted-foreground mb-1">시작일</label>
        <Input
          type="date"
          name="date_from"
          value={dateFrom}
          onChange={event => setDateFrom(event.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm text-muted-foreground mb-1">종료일</label>
        <Input
          type="date"
          name="date_to"
          value={dateTo}
          onChange={event => setDateTo(event.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" variant="outline">
          적용
        </Button>
        <Button type="button" variant="outline" onClick={handleReset}>
          초기화
        </Button>
      </div>
    </form>
  )
}
