'use client'

import { useState } from 'react'
import PhotoGridCreator from './PhotoGridCreator'
import PhotoGridList from './PhotoGridList'
import {
  PillTabs as Tabs,
  PillTabsList as TabsList,
  PillTabsTrigger as TabsTrigger,
  PillTabsContent as TabsContent,
} from '@/components/ui/pill-tabs'
import CreateFromDailyReport from './CreateFromDailyReport'

export default function PhotoGridToolMain() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleCreated = () => {
    setRefreshKey(k => k + 1)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="px-4 pt-4">
          <Tabs defaultValue="upload">
            <TabsList>
              <TabsTrigger value="upload">직접 업로드</TabsTrigger>
              <TabsTrigger value="from-daily">작업일지에서 생성</TabsTrigger>
            </TabsList>
            <TabsContent value="upload">
              <div className="rounded-lg border bg-white">
                <div className="border-b px-4 py-3">
                  <h2 className="text-base font-semibold">사진대지 생성</h2>
                  <p className="text-xs text-muted-foreground">현장/부재/공정 정보와 사진 업로드</p>
                </div>
                <div className="p-4">
                  <PhotoGridCreator onCreated={handleCreated} />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="from-daily">
              <div className="rounded-lg border bg-white">
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
        </div>
      </div>

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
    </div>
  )
}
