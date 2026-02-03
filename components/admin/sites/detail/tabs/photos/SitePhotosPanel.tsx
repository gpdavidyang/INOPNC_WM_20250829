'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, LayoutGrid, List, RefreshCw, XCircle } from 'lucide-react'
import Image from 'next/image'

import { useSitePhotos } from '../../../hooks/useSitePhotos'
import { PhotoFilters } from './PhotoFilters'
import { PhotoGridView } from './PhotoGridView'
import { PhotoListView } from './PhotoListView'
import { PhotoSheetList } from './PhotoSheetList'
import { PhotoUploader } from './PhotoUploader'

interface SitePhotosPanelProps {
  siteId: string
}

export function SitePhotosPanel({ siteId }: SitePhotosPanelProps) {
  const p = useSitePhotos(siteId)

  return (
    <div className="space-y-8 mt-4">
      {/* 1. Filters & Search */}
      <PhotoFilters
        filters={p.filters}
        setFilters={p.setFilters}
        onSearch={() => p.fetchPhotos(1)}
        onReset={() => {
          p.setFilters({ type: 'all' })
          p.fetchPhotos(1)
        }}
        onOpenUploader={() => p.setUploaderOpen(true)}
        loading={p.loading}
        reports={p.reports}
        uploaderOptions={p.uploaderOptions}
      />

      {/* 2. Uploader Modal/Section */}
      {p.uploaderOpen && (
        <PhotoUploader
          onClose={() => {
            p.setUploaderOpen(false)
            p.resetUploadForm()
          }}
          onUpload={p.handleUpload}
          uploading={p.uploading}
          form={p.uploadForm}
          setForm={p.setUploadForm}
          reports={p.reports}
          highlightBucket={p.highlightBucket}
        />
      )}

      {/* 3. Main Photos Content */}
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-black text-foreground uppercase tracking-tight">
              현장 사진 갤러리
            </h2>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="bg-white/50 border-gray-200 text-[10px] font-black h-6"
              >
                전체 {p.pagination.total}
              </Badge>
              <Badge
                variant="secondary"
                className="bg-blue-50 text-blue-700 border-blue-100 text-[10px] font-black h-6"
              >
                보수 전 {p.counts.before}
              </Badge>
              <Badge
                variant="secondary"
                className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px] font-black h-6"
              >
                보수 후 {p.counts.after}
              </Badge>
            </div>
          </div>

          <div className="flex items-center bg-gray-50/50 p-1 rounded-xl border border-gray-100 shadow-sm">
            <button
              onClick={() => p.setViewMode('preview')}
              className={`p-1.5 rounded-lg transition-all ${
                p.viewMode === 'preview'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              title="카드형 보기"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => p.setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${
                p.viewMode === 'list'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              title="리스트형 보기"
            >
              <List className="h-4 w-4" />
            </button>
            <div className="w-px h-5 bg-gray-200 mx-1.5" />
            <button
              onClick={() => p.fetchPhotos(p.pagination.page)}
              disabled={p.loading}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/50 transition-all disabled:opacity-50"
              title="새로고침"
            >
              <RefreshCw className={cn('w-4 h-4', p.loading && 'animate-spin')} />
            </button>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {p.selectedIds.size > 0 && (
          <div className="flex items-center justify-between bg-blue-600 p-4 rounded-2xl shadow-lg shadow-blue-500/20 text-white animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-4 px-2">
              <span className="text-sm font-black italic tracking-wider uppercase">
                Selected {p.selectedIds.size} Photos
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="rounded-xl font-bold bg-white text-blue-600 hover:bg-blue-50"
                onClick={() => p.performMove(Array.from(p.selectedIds), 'before')}
              >
                보수 전 이동
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="rounded-xl font-bold bg-white text-blue-600 hover:bg-blue-50"
                onClick={() => p.performMove(Array.from(p.selectedIds), 'after')}
              >
                보수 후 이동
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="rounded-xl font-bold border-2 border-white/20"
                onClick={() => p.performDelete(Array.from(p.selectedIds))}
              >
                일괄 삭제
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-xl text-white hover:bg-white/10"
                onClick={() => p.setSelectedIds(new Set())}
              >
                선택 해제
              </Button>
            </div>
          </div>
        )}

        {/* Content Area */}
        {p.loading && p.photos.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4">
            <LoadingSpinner />
            <p className="text-xs font-bold text-muted-foreground animate-pulse">
              사진 정보를 불러오는 중입니다...
            </p>
          </div>
        ) : p.photos.length === 0 ? (
          <div className="py-24 bg-gray-50/50 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-4">
            <XCircle className="w-12 h-12 text-gray-200" />
            <p className="text-sm font-bold text-muted-foreground">조건에 맞는 사진이 없습니다.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => p.setFilters({ type: 'all' })}
              className="rounded-xl"
            >
              필터 초기화
            </Button>
          </div>
        ) : p.viewMode === 'preview' ? (
          <PhotoGridView
            beforePhotos={p.beforePhotos}
            afterPhotos={p.afterPhotos}
            counts={p.counts}
            selectedIds={p.selectedIds}
            onSelect={p.toggleSelect}
            onSelectAll={p.handleSelectAll}
            onPreview={p.setPreviewPhoto}
            onMove={photo =>
              p.performMove([photo.id!], photo.photo_type === 'before' ? 'after' : 'before')
            }
            onDelete={photo => p.performDelete([photo.id!])}
          />
        ) : (
          <PhotoListView
            beforePhotos={p.beforePhotos}
            afterPhotos={p.afterPhotos}
            counts={p.counts}
            selectedIds={p.selectedIds}
            onSelect={p.toggleSelect}
            onSelectAll={p.handleSelectAll}
            onPreview={p.setPreviewPhoto}
            onMove={photo =>
              p.performMove([photo.id!], photo.photo_type === 'before' ? 'after' : 'before')
            }
            onDelete={photo => p.performDelete([photo.id!])}
          />
        )}

        {/* Pagination */}
        {p.pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 pt-8">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-xl"
              onClick={() => p.fetchPhotos(p.pagination.page - 1)}
              disabled={p.pagination.page === 1}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2 font-black italic">
              <span className="text-blue-600">{p.pagination.page}</span>
              <span className="opacity-20">/</span>
              <span className="text-muted-foreground">{p.pagination.totalPages}</span>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-xl"
              onClick={() => p.fetchPhotos(p.pagination.page + 1)}
              disabled={p.pagination.page === p.pagination.totalPages}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>

      {/* 4. Photo Sheet List */}
      <PhotoSheetList photoSheets={p.photoSheets} loading={p.photoSheetsLoading} siteId={siteId} />

      {/* 5. Preview Dialog */}
      <Dialog open={!!p.previewPhoto} onOpenChange={open => !open && p.setPreviewPhoto(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95 border-none">
          <DialogHeader className="p-6 absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent">
            <DialogTitle className="text-white text-lg font-black truncate pr-12">
              {p.previewPhoto?.filename || 'Photo Preview'}
            </DialogTitle>
          </DialogHeader>
          {p.previewPhoto && (
            <div className="relative h-[80vh] w-full flex items-center justify-center">
              <Image
                src={p.previewPhoto.url || p.previewPhoto.path || ''}
                alt={p.previewPhoto.filename || 'photo'}
                fill
                className="object-contain"
                sizes="100vw"
                unoptimized
              />
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white/70 text-[10px] font-bold uppercase tracking-widest flex justify-between items-end">
            <div className="space-y-1">
              <div>Uploader: {p.previewPhoto?.uploaded_by_name}</div>
              <div>Report ID: {p.previewPhoto?.daily_report_id}</div>
            </div>
            <div>Captured: {p.previewPhoto?.work_date}</div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
