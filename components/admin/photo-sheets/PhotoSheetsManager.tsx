'use client'

import PhotoSheetActions from '@/components/admin/documents/PhotoSheetActions'
import CreateFromDailyReport from '@/components/photo-grid-tool/CreateFromDailyReport'
import PhotoSheetEditor from '@/components/photo-sheet/PhotoSheetEditor'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import EmptyState from '@/components/ui/empty-state'
import {
  PillTabs as Tabs,
  PillTabsContent as TabsContent,
  PillTabsList as TabsList,
  PillTabsTrigger as TabsTrigger,
} from '@/components/ui/pill-tabs'
import { cn } from '@/lib/utils'
import {
  ArrowRight,
  Calendar,
  FileBox,
  Filter,
  Layers,
  Plus,
  Search,
  Table as TableIcon,
  Upload,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

type SearchParams = {
  site_id?: string
}

type SiteOption = {
  value: string
  label: string
}

type PhotoSheetRow = {
  id: string
  title: string | null
  rows: number
  cols: number
  orientation: 'portrait' | 'landscape'
  status?: string | null
  created_at?: string | null
  site_id: string
  source_daily_report_id?: string | null
  source_daily_report_summary?: string | null
  photo_count?: number
  site?: {
    id: string
    name?: string | null
    address?: string | null
  } | null
}

interface Props {
  searchParams: SearchParams
  siteOptions: SiteOption[]
  sheets: PhotoSheetRow[]
}

export default function PhotoSheetsManager({ searchParams, siteOptions, sheets }: Props) {
  const router = useRouter()
  const searchParamsHook = useSearchParams()
  const currentTab = searchParamsHook.get('tab') || 'list'
  const [tab, setTab] = useState<'list' | 'upload' | 'from-daily'>(() => {
    const t = searchParamsHook.get('tab')
    if (t === 'list' || t === 'upload' || t === 'from-daily') return t
    return 'list'
  })

  // Sync state with URL changes (back/forward)
  useEffect(() => {
    const t = searchParamsHook.get('tab')
    if (t === 'list' || t === 'upload' || t === 'from-daily') {
      setTab(t)
    } else {
      setTab('list')
    }
  }, [searchParamsHook])

  const handleTabChange = (value: string) => {
    const newTab = value as typeof tab
    setTab(newTab)
    const params = new URLSearchParams(searchParamsHook.toString())
    params.set('tab', newTab)
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  const handleRefreshAfterCreate = useCallback(() => {
    window.location.reload()
  }, [])

  return (
    <div className="space-y-8">
      <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="bg-slate-50/50 p-1.5 rounded-2xl border border-slate-100 grid grid-cols-3 gap-1.5 h-13">
          <TabsTrigger
            value="list"
            className="rounded-xl data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-md data-[state=active]:shadow-blue-100/50 font-black text-sm transition-all flex items-center justify-center gap-1.5 h-10 text-slate-500 hover:text-slate-900"
          >
            <TableIcon
              className={cn('w-4 h-4', tab === 'list' ? 'text-blue-600' : 'text-slate-400')}
            />
            <span>사진대지 리스트</span>
          </TabsTrigger>
          <TabsTrigger
            value="upload"
            className="rounded-xl data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-md data-[state=active]:shadow-blue-100/50 font-black text-sm transition-all flex items-center justify-center gap-1.5 h-10 text-slate-500 hover:text-slate-900"
          >
            <Plus
              className={cn('w-4 h-4', tab === 'upload' ? 'text-blue-600' : 'text-slate-400')}
            />
            <span>새 사진대지 등록</span>
          </TabsTrigger>
          <TabsTrigger
            value="from-daily"
            className="rounded-xl data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-md data-[state=active]:shadow-blue-100/50 font-black text-sm transition-all flex items-center justify-center gap-1.5 h-10 text-slate-500 hover:text-slate-900"
          >
            <Layers
              className={cn('w-4 h-4', tab === 'from-daily' ? 'text-blue-600' : 'text-slate-400')}
            />
            <span>작업일지 기반 생성</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-8">
          <TabsContent value="list" className="space-y-6 focus:outline-none">
            <Card className="rounded-3xl border-gray-200 shadow-sm shadow-gray-200/50 overflow-hidden">
              <CardHeader className="border-b border-gray-100 bg-gradient-to-b from-gray-50/50 to-transparent pb-6 px-8 py-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <Filter className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardDescription className="text-sm font-bold text-slate-400 leading-relaxed">
                      특정 현장의 사진대지를 조건별로 <span className="text-blue-600">검색</span>
                      합니다.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="bg-slate-50/30 p-8">
                <form className="flex flex-col md:flex-row items-end gap-4 w-full">
                  <div className="flex flex-col gap-2 flex-grow w-full md:w-auto">
                    <span className="text-[11px] font-black text-[#1A254F] uppercase tracking-tighter opacity-40 px-1">
                      현장 선택
                    </span>
                    <div className="relative w-full">
                      <CustomSelect name="site_id" defaultValue={searchParams.site_id || 'all'}>
                        <CustomSelectTrigger className="h-12 w-full rounded-2xl bg-white border border-slate-200 pl-4 pr-10 text-sm font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all">
                          <CustomSelectValue placeholder="검색할 현장을 선택하세요" />
                        </CustomSelectTrigger>
                        <CustomSelectContent className="rounded-2xl border-slate-200 shadow-xl overflow-hidden">
                          {siteOptions.map(option => (
                            <CustomSelectItem
                              key={option.value}
                              value={option.value}
                              className="font-bold py-3 px-4"
                            >
                              {option.label}
                            </CustomSelectItem>
                          ))}
                        </CustomSelectContent>
                      </CustomSelect>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
                    <Button
                      type="submit"
                      className="h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 shadow-md shadow-blue-900/10 transition-all gap-2 flex-grow md:flex-grow-0"
                    >
                      <Search className="w-4 h-4" />
                      조회하기
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="h-12 rounded-xl border-slate-200 text-slate-500 hover:bg-slate-50 font-bold px-6 transition-all gap-2 shrink-0"
                    >
                      <Link href="/dashboard/admin/photo-sheets">초기화</Link>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-gray-200 shadow-sm shadow-gray-200/40 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-[#8da0cd]">
                      <th className="px-8 py-4 text-left text-white font-bold text-[11px] uppercase tracking-tighter w-[30%]">
                        현장 및 주소
                      </th>
                      <th className="px-8 py-4 text-left text-white font-bold text-[11px] uppercase tracking-tighter">
                        연결 작업일지
                      </th>
                      <th className="px-8 py-4 text-left text-white font-bold text-[11px] uppercase tracking-tighter w-[120px] text-center">
                        규격(행x열)
                      </th>
                      <th className="px-8 py-4 text-left text-white font-bold text-[11px] uppercase tracking-tighter w-[100px] text-center">
                        사진 수
                      </th>
                      <th className="px-8 py-4 text-left text-white font-bold text-[11px] uppercase tracking-tighter w-[180px] text-center">
                        생성 일시
                      </th>
                      <th className="px-8 py-4 text-center text-white font-bold text-[11px] uppercase tracking-tighter w-[220px] pr-8">
                        관리 동작
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {sheets.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-24">
                          <EmptyState description="조건에 맞는 사진대지 내역이 없습니다." />
                        </td>
                      </tr>
                    ) : (
                      sheets.map(sheet => (
                        <tr
                          key={sheet.id}
                          className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="px-8 py-5">
                            <div className="flex flex-col gap-1">
                              <span className="font-black text-[#1A254F] tracking-tight leading-tight">
                                {sheet.site?.name || '현장 미지정'}
                              </span>
                              <span className="text-[11px] font-medium text-slate-400">
                                {sheet.site?.address || '-'}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            {sheet.source_daily_report_id ? (
                              <Link
                                href={`/dashboard/admin/daily-reports/${sheet.source_daily_report_id}`}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50/50 px-3 py-1.5 rounded-lg border border-blue-100/30 transition-all"
                              >
                                <FileBox className="w-3.5 h-3.5" />
                                {sheet.source_daily_report_summary || '일지 상세 보기'}
                                <ArrowRight className="w-3 h-3 opacity-50" />
                              </Link>
                            ) : (
                              <Badge className="bg-slate-50 text-slate-300 border-none font-bold text-[10px] rounded-lg h-5 px-2 shadow-none">
                                연결 없음
                              </Badge>
                            )}
                          </td>
                          <td className="px-8 py-5 text-center">
                            <div className="flex items-center justify-center gap-1.5 font-black text-[#1A254F]">
                              <span className="text-sm italic">{sheet.rows}</span>
                              <span className="text-[10px] text-slate-300 font-medium lowercase">
                                x
                              </span>
                              <span className="text-sm italic">{sheet.cols}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-center">
                            <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[10px] rounded-lg h-5 px-3 shadow-none whitespace-nowrap">
                              {sheet.photo_count ?? 0}장
                            </Badge>
                          </td>
                          <td className="px-8 py-5 text-center">
                            <div className="flex flex-col items-center gap-0.5">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                {sheet.created_at
                                  ? new Date(sheet.created_at).toLocaleDateString('ko-KR')
                                  : '-'}
                              </div>
                              <div className="text-[10px] font-medium text-slate-400">
                                {sheet.created_at
                                  ? new Date(sheet.created_at).toLocaleTimeString('ko-KR', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : ''}
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5 pr-8">
                            <PhotoSheetActions id={sheet.id} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="upload" className="focus:outline-none">
            <Card className="rounded-3xl border-gray-200 shadow-sm shadow-gray-200/50 overflow-hidden">
              <CardHeader className="border-b border-gray-100 bg-gradient-to-b from-gray-50/50 to-transparent pb-6 px-8 py-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <Upload className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <CardDescription className="text-sm font-bold text-slate-400 leading-relaxed">
                      사진과 정보를 차례대로 입력하여{' '}
                      <span className="text-emerald-600">전문적인 사진대지</span>를 직접 구성합니다.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <PhotoSheetEditor onSaved={handleRefreshAfterCreate} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="from-daily" className="focus:outline-none">
            <Card className="rounded-3xl border-gray-200 shadow-sm shadow-gray-200/50 overflow-hidden">
              <CardHeader className="border-b border-gray-100 bg-gradient-to-b from-gray-50/50 to-transparent pb-6 px-8 py-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <Layers className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardDescription className="text-sm font-bold text-slate-400 leading-relaxed">
                      현장별 작업일지에 등록된 현장 사진을 활용해{' '}
                      <span className="text-blue-600">대지를 즉시 생성</span>합니다.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <CreateFromDailyReport onCreated={handleRefreshAfterCreate} />
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
