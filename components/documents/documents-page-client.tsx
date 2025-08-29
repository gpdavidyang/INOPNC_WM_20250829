'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MyDocuments } from '@/components/documents/my-documents'
import { SharedDocuments } from '@/components/documents/shared-documents'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { DocumentsPageHeader } from '@/components/ui/page-header'
import { Suspense, useState, useEffect } from 'react'
import { useFontSize, getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'
import { Plus, Search, RefreshCw } from 'lucide-react'

interface DocumentsPageClientProps {
  profile: any
  searchParams?: { [key: string]: string | string[] | undefined }
}

export function DocumentsPageClient({ profile, searchParams }: DocumentsPageClientProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()

  // Get initial values from URL parameters
  const initialTab = searchParams?.tab === 'shared' ? 'shared-documents' : (searchParams?.tab as string) || 'my-documents'
  const initialSearch = (searchParams?.search as string) || ''
  
  console.log('DocumentsPageClient - initialTab:', initialTab, 'initialSearch:', initialSearch)

  // Touch-responsive padding
  const getPadding = () => {
    if (touchMode === 'glove') return 'px-8 py-5'
    if (touchMode === 'precision') return 'px-4 py-3'
    return 'px-6 py-4'
  }

  const getContentPadding = () => {
    if (touchMode === 'glove') return 'p-8'
    if (touchMode === 'precision') return 'p-4'
    return 'p-6'
  }

  const handleSearch = () => {
    console.log('검색 기능 활성화')
  }

  const handleNewDocument = () => {
    console.log('새 문서 생성')
  }

  const handleRefresh = () => {
    console.log('문서 목록 새로고침')
    window.location.reload()
  }

  return (
    <div className="h-full bg-white dark:bg-gray-900">
      <DocumentsPageHeader
        title="문서 관리"
        subtitle="개인 문서 및 공유 문서를 관리합니다"
        actions={[
          {
            label: '검색',
            onClick: handleSearch,
            variant: 'ghost',
            icon: <Search className="h-4 w-4" />
          },
          {
            label: '새로고침',
            onClick: handleRefresh,
            variant: 'secondary',
            icon: <RefreshCw className="h-4 w-4" />
          },
          {
            label: '새 문서',
            onClick: handleNewDocument,
            variant: 'primary',
            icon: <Plus className="h-4 w-4" />
          }
        ]}
      />

      <div className="px-4 py-3">
        <Tabs value={initialTab} defaultValue={initialTab} className="space-y-0">
          <TabsList className="grid w-full grid-cols-2 h-10 bg-gray-100 dark:bg-gray-800 p-1">
            <TabsTrigger 
              value="my-documents" 
              className="text-sm data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
            >
              내문서함
            </TabsTrigger>
            <TabsTrigger 
              value="shared-documents"
              className="text-sm data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
            >
              공유문서함
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-documents" className="mt-4">
            <Suspense fallback={<LoadingSpinner />}>
              <MyDocuments profile={profile} />
            </Suspense>
          </TabsContent>

          <TabsContent value="shared-documents" className="mt-4">
            <Suspense fallback={<LoadingSpinner />}>
              <SharedDocuments profile={profile} initialSearch={initialSearch} />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}