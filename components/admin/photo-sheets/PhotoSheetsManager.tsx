'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import PhotoSheetEditor from '@/components/photo-sheet/PhotoSheetEditor'
import CreateFromDailyReport from '@/components/photo-grid-tool/CreateFromDailyReport'
import PhotoSheetActions from '@/components/admin/documents/PhotoSheetActions'
import { buttonVariants } from '@/components/ui/button'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import {
  PillTabs as Tabs,
  PillTabsContent as TabsContent,
  PillTabsList as TabsList,
  PillTabsTrigger as TabsTrigger,
} from '@/components/ui/pill-tabs'
import { cn } from '@/lib/utils'

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
  const [tab, setTab] = useState<'list' | 'upload' | 'from-daily'>('list')

  const handleRefreshAfterCreate = useCallback(() => {
    // 간단히 전체 페이지 새로고침으로 리스트 반영
    window.location.reload()
  }, [])

  return (
    <Tabs value={tab} onValueChange={value => setTab(value as typeof tab)} className="space-y-6">
      <TabsList className="w-full" fill>
        <TabsTrigger value="list" fill>
          리스트
        </TabsTrigger>
        <TabsTrigger value="upload" fill>
          직접 업로드
        </TabsTrigger>
        <TabsTrigger value="from-daily" fill>
          작업일지에서 생성
        </TabsTrigger>
      </TabsList>

      <TabsContent value="list" className="space-y-6">
        <form className="grid gap-4 rounded-lg border bg-card p-4 shadow-sm md:grid-cols-[1fr_auto]">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">현장명 선택</span>
            <CustomSelect name="site_id" defaultValue={searchParams.site_id || 'all'}>
              <CustomSelectTrigger className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60">
                <CustomSelectValue placeholder="현장명을 선택하세요" />
              </CustomSelectTrigger>
              <CustomSelectContent>
                {siteOptions.map(option => (
                  <CustomSelectItem key={option.value} value={option.value}>
                    {option.label}
                  </CustomSelectItem>
                ))}
              </CustomSelectContent>
            </CustomSelect>
          </div>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className={cn(buttonVariants({ variant: 'primary', size: 'standard' }))}
            >
              검색
            </button>
            <Link
              href="/dashboard/admin/photo-sheets"
              className={cn(buttonVariants({ variant: 'outline', size: 'standard' }))}
            >
              초기화
            </Link>
          </div>
        </form>

        <section className="rounded-lg border bg-card shadow-sm">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold text-muted-foreground">검색 결과</h2>
          </div>
          <div className="overflow-x-auto">
            {sheets.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                등록된 사진대지가 없습니다.
              </div>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-medium">현장</th>
                    <th className="px-4 py-3 font-medium">작업일지</th>
                    <th className="px-4 py-3 font-medium">행×열</th>
                    <th className="px-4 py-3 font-medium">사진 수</th>
                    <th className="px-4 py-3 font-medium">생성일</th>
                    <th className="px-4 py-3 font-medium">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {sheets.map(sheet => (
                    <tr key={sheet.id} className="border-b last:border-none">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">
                            {sheet.site?.name || '-'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {sheet.site?.address || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {sheet.source_daily_report_id ? (
                          <Link
                            href={`/dashboard/admin/daily-reports/${sheet.source_daily_report_id}`}
                            className="text-primary hover:underline"
                          >
                            {sheet.source_daily_report_summary || '작업일지 열기'}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">연결 없음</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {sheet.rows}×{sheet.cols}
                      </td>
                      <td className="px-4 py-3">{sheet.photo_count ?? 0}장</td>
                      <td className="px-4 py-3">
                        {sheet.created_at
                          ? new Date(sheet.created_at).toLocaleString('ko-KR')
                          : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <PhotoSheetActions id={sheet.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </TabsContent>

      <TabsContent value="upload">
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="border-b px-4 py-3">
            <h2 className="text-base font-semibold">직접 업로드</h2>
            <p className="text-xs text-muted-foreground">
              사진과 메타 정보를 직접 입력하여 사진대지를 생성합니다.
            </p>
          </div>
          <div className="p-4">
            <PhotoSheetEditor onSaved={handleRefreshAfterCreate} />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="from-daily">
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="border-b px-4 py-3">
            <h2 className="text-base font-semibold">작업일지에서 생성</h2>
            <p className="text-xs text-muted-foreground">
              작업일지의 사진을 선택하여 사진대지를 빠르게 생성합니다.
            </p>
          </div>
          <div className="p-4">
            <CreateFromDailyReport onCreated={handleRefreshAfterCreate} />
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}
