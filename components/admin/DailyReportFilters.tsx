'use client'

import { Button } from '@/components/ui/button'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import { Input } from '@/components/ui/input'
import { Calendar, Filter, RotateCcw, Search } from 'lucide-react'
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
    <div className="bg-white rounded-[32px] p-8 shadow-2xl shadow-black/5 border border-gray-100 mb-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
          <Filter className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-black tracking-tight">상세 필터</h3>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            보고서 검색 및 필터링
          </p>
        </div>
      </div>

      <form
        onSubmit={e => {
          e.preventDefault()
          applyFilters()
        }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6"
      >
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
            현장
          </label>
          <CustomSelect
            value={siteId || '__all__'}
            onValueChange={v => setSiteId(v === '__all__' ? '' : v)}
          >
            <CustomSelectTrigger className="h-12 rounded-2xl bg-gray-50 border-transparent hover:border-gray-200 transition-all focus:ring-2 focus:ring-red-100">
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

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
            상태
          </label>
          <CustomSelect
            value={status || '__all__'}
            onValueChange={v => setStatus(v === '__all__' ? '' : v)}
          >
            <CustomSelectTrigger className="h-12 rounded-2xl bg-gray-50 border-transparent hover:border-gray-200 transition-all focus:ring-2 focus:ring-red-100">
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

        <div className="space-y-2 lg:col-span-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
            검색어
          </label>
          <div className="relative">
            <Input
              className="h-12 pl-11 rounded-2xl bg-gray-50 border-transparent hover:border-gray-200 transition-all focus:ring-2 focus:ring-red-100"
              placeholder="이름, 내용 등"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2 lg:col-span-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
            날짜 범위
          </label>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Input
                type="date"
                className="h-12 pl-11 rounded-2xl bg-gray-50 border-transparent hover:border-gray-200 transition-all focus:ring-2 focus:ring-red-100"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
              />
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            <span className="text-gray-300 font-bold">~</span>
            <div className="relative flex-1">
              <Input
                type="date"
                className="h-12 pl-11 rounded-2xl bg-gray-50 border-transparent hover:border-gray-200 transition-all focus:ring-2 focus:ring-red-100"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
              />
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleReset}
            className="h-12 px-6 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-400 hover:text-gray-900 gap-2"
          >
            <RotateCcw className="w-4 h-4" /> 초기화
          </Button>
          <Button
            type="submit"
            className="h-12 px-10 rounded-2xl bg-gray-900 hover:bg-black text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-gray-200"
          >
            필터 적용
          </Button>
        </div>
      </form>
    </div>
  )
}
