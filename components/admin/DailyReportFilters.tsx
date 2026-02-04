'use client'
// Force HMR refresh

import { Button } from '@/components/ui/button'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import { Input } from '@/components/ui/input'
import { Plus, Search } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'

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

  const [siteId, setSiteId] = useState(initialSiteId || '')
  const [search, setSearch] = useState(initialSearch)
  const [status, setStatus] = useState(initialStatus || '')
  const [dateFrom, setDateFrom] = useState(initialDateFrom || '')
  const [dateTo, setDateTo] = useState(initialDateTo || '')

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    params.set('page', '1')

    if (siteId) params.set('site_id', siteId)
    else params.delete('site_id')

    if (search.trim()) params.set('search', search.trim())
    else params.delete('search')

    if (status) params.set('status', status)
    else params.delete('status')

    if (dateFrom) params.set('date_from', dateFrom)
    else params.delete('date_from')

    if (dateTo) params.set('date_to', dateTo)
    else params.delete('date_to')

    router.push(`${pathname}?${params.toString()}`)
  }, [dateFrom, dateTo, pathname, router, search, searchParams, siteId, status])

  const handleReset = () => {
    setSiteId('')
    setSearch('')
    setStatus('')
    setDateFrom('')
    setDateTo('')
    router.push(pathname)
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm mb-6">
      <form
        onSubmit={e => {
          e.preventDefault()
          applyFilters()
        }}
        className="flex flex-wrap items-end gap-4"
      >
        <div className="space-y-1.5 w-full sm:w-[200px]">
          <label className="text-[11px] font-bold text-muted-foreground tracking-tight ml-1">
            현장
          </label>
          <CustomSelect
            value={siteId || '__all__'}
            onValueChange={v => setSiteId(v === '__all__' ? '' : v)}
          >
            <CustomSelectTrigger className="h-10 rounded-xl bg-gray-50 border-none px-4 text-sm">
              <CustomSelectValue placeholder="모든 현장" />
            </CustomSelectTrigger>
            <CustomSelectContent>
              <CustomSelectItem value="__all__">전체 현장</CustomSelectItem>
              {siteOptions.map(o => (
                <CustomSelectItem key={o.id} value={o.id}>
                  {o.name}
                </CustomSelectItem>
              ))}
            </CustomSelectContent>
          </CustomSelect>
        </div>

        <div className="space-y-1.5 w-full sm:w-[140px]">
          <label className="text-[11px] font-bold text-muted-foreground tracking-tight ml-1">
            상태
          </label>
          <CustomSelect
            value={status || '__all__'}
            onValueChange={v => setStatus(v === '__all__' ? '' : v)}
          >
            <CustomSelectTrigger className="h-10 rounded-xl bg-gray-50 border-none px-4 text-sm">
              <CustomSelectValue placeholder="모든 상태" />
            </CustomSelectTrigger>
            <CustomSelectContent>
              <CustomSelectItem value="__all__">전체 상태</CustomSelectItem>
              <CustomSelectItem value="draft">임시</CustomSelectItem>
              <CustomSelectItem value="submitted">제출</CustomSelectItem>
              <CustomSelectItem value="approved">승인</CustomSelectItem>
              <CustomSelectItem value="rejected">반려</CustomSelectItem>
            </CustomSelectContent>
          </CustomSelect>
        </div>

        <div className="space-y-1.5 flex-1 min-w-[200px]">
          <label className="text-[11px] font-bold text-muted-foreground tracking-tight ml-1">
            검색어
          </label>
          <div className="relative">
            <Input
              className="h-10 pl-10 rounded-xl bg-gray-50 border-none text-sm"
              placeholder="이름, 내용 등"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-1.5 w-full sm:w-[150px]">
          <label className="text-[11px] font-bold text-muted-foreground tracking-tight ml-1">
            시작일
          </label>
          <Input
            type="date"
            className="h-10 rounded-xl bg-gray-50 border-none px-4 text-sm"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
          />
        </div>

        <div className="space-y-1.5 w-full sm:w-[150px]">
          <label className="text-[11px] font-bold text-muted-foreground tracking-tight ml-1">
            종료일
          </label>
          <Input
            type="date"
            className="h-10 rounded-xl bg-gray-50 border-none px-4 text-sm"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 ml-auto sm:ml-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            className="h-10 px-4 rounded-xl font-bold text-xs text-slate-600 bg-slate-50 hover:bg-slate-100 border-gray-200 whitespace-nowrap"
          >
            새로고침
          </Button>
          <Button
            type="submit"
            className="h-10 px-6 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs shadow-sm whitespace-nowrap"
          >
            검색
          </Button>
          <Button
            asChild
            className="h-10 px-4 rounded-xl bg-[#1A254F] hover:bg-[#2A355F] text-white font-bold text-xs shadow-sm whitespace-nowrap gap-1.5 shrink-0"
          >
            <Link href="/dashboard/admin/daily-reports/new" className="flex items-center">
              <Plus className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">작업일지 작성</span>
            </Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
