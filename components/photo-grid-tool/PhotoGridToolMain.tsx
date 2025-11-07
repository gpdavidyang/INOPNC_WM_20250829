'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import PhotoSheetEditor from '@/components/photo-sheet/PhotoSheetEditor'
import PhotoGridList from './PhotoGridList'
import {
  PillTabs as Tabs,
  PillTabsList as TabsList,
  PillTabsTrigger as TabsTrigger,
  PillTabsContent as TabsContent,
} from '@/components/ui/pill-tabs'
import CreateFromDailyReport from './CreateFromDailyReport'

export default function PhotoGridToolMain() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const sheetIdParam = searchParams.get('sheet_id')
  const tabParam = searchParams.get('tab')
  const initialTab: 'list' | 'upload' | 'from-daily' =
    tabParam === 'from-daily'
      ? 'from-daily'
      : sheetIdParam || tabParam === 'upload'
        ? 'upload'
        : 'list'

  const [defaultTab, setDefaultTab] = useState<'list' | 'upload' | 'from-daily'>(initialTab)
  const [editorSheetId, setEditorSheetId] = useState<string | undefined>(sheetIdParam || undefined)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleCreated = (_id?: string) => {
    setRefreshKey(k => k + 1)
  }

  useEffect(() => {
    const sheetId = searchParams.get('sheet_id')
    const tab = searchParams.get('tab')
    if (sheetId) {
      setEditorSheetId(sheetId)
      setDefaultTab('upload')
    } else {
      setEditorSheetId(undefined)
      if (!tab || tab === 'list') setDefaultTab('list')
    }
    if (tab === 'from-daily') setDefaultTab('from-daily')
    else if (tab === 'upload' && !sheetId) setDefaultTab('upload')
  }, [searchParams])

  const handleEditorClose = () => {
    setEditorSheetId(undefined)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('sheet_id')
    params.delete('tab')
    setDefaultTab('list')
    router.replace(`/dashboard/admin/tools/photo-grid${params.size ? `?${params}` : ''}`)
  }

  const handleTabChange = (value: string) => {
    const nextValue = value as 'list' | 'upload' | 'from-daily'
    setDefaultTab(nextValue)
    const params = new URLSearchParams(searchParams.toString())
    if (nextValue === 'list') {
      params.delete('tab')
    } else {
      params.set('tab', nextValue)
    }
    router.replace(`/dashboard/admin/tools/photo-grid${params.size ? `?${params}` : ''}`)
  }

  return (
    <Tabs value={defaultTab} onValueChange={handleTabChange} className="space-y-6">
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

      <TabsContent value="list">
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="border-b px-4 py-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">최근 생성된 사진대지</h2>
              <p className="text-xs text-muted-foreground">
                업로드된 사진대지 목록 및 미리보기/다운로드/삭제
              </p>
            </div>
          </div>
          <div className="p-4">
            <PhotoGridList key={refreshKey} />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="upload">
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="py-4">
            <PhotoSheetEditor
              key={editorSheetId || 'new'}
              onSaved={handleCreated}
              sheetId={editorSheetId}
              onClose={handleEditorClose}
            />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="from-daily">
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="border-b px-4 py-3">
            <h2 className="text-base font-semibold">작업일지에서 생성</h2>
            <p className="text-xs text-muted-foreground">
              작업일지의 사진(전/후)을 선택해 사진대지 생성
            </p>
          </div>
          <div className="p-4">
            <CreateFromDailyReport onCreated={handleCreated} />
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}
