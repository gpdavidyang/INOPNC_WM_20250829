'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { AdditionalPhotoData } from '@/types/daily-reports'
import { Download, GripVertical, LayoutGrid, List, Loader2, Trash2 } from 'lucide-react'
import Image from 'next/image'

interface PhotoRegistrySectionProps {
  photoBuckets: {
    before: AdditionalPhotoData[]
    after: AdditionalPhotoData[]
  }
  photosViewMode: 'preview' | 'list'
  setPhotosViewMode: (mode: 'preview' | 'list') => void
  totalPhotoCount: number
  selectedCount: number
  selectedPhotoIds: Set<string>
  togglePhotoSelection: (id?: string | null) => void
  toggleGroupSelection: (type: 'before' | 'after') => void
  toggleAllSelection: () => void
  onClearSelection: () => void
  handleBulkDelete: () => void
  handleBulkDownload: () => void
  photoActionLoading: boolean
  reorderDisabled: boolean
  onDragStart: (type: 'before' | 'after', index: number) => (event: any) => void
  onDragOver: (type: 'before' | 'after', index: number) => (event: any) => void
  onDrop: (type: 'before' | 'after', index: number) => (event: any) => void
  onDragEnd: () => void
  onOpenFile: (photo: AdditionalPhotoData) => void
  onPreview: (url: string) => void
  formatDate: (date?: string) => string
  hasFileReference: (photo: AdditionalPhotoData) => boolean
}

export function PhotoRegistrySection({
  photoBuckets,
  photosViewMode,
  setPhotosViewMode,
  totalPhotoCount,
  selectedCount,
  selectedPhotoIds,
  togglePhotoSelection,
  toggleGroupSelection,
  toggleAllSelection,
  onClearSelection,
  handleBulkDelete,
  handleBulkDownload,
  photoActionLoading,
  reorderDisabled,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onOpenFile,
  onPreview,
  formatDate,
  hasFileReference,
}: PhotoRegistrySectionProps) {
  if (totalPhotoCount === 0) return null

  const renderPreviewGroup = (title: string, type: 'before' | 'after') => {
    const items = photoBuckets[type]
    const ids = items.map(photo => photo.id).filter((id): id is string => Boolean(id))
    const groupSelected = ids.length > 0 && ids.every(id => selectedPhotoIds.has(id))

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-foreground">{title}</div>
          {items.length > 0 && (
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={groupSelected}
                onChange={() => toggleGroupSelection(type)}
              />
              선택
            </label>
          )}
        </div>
        {items.length === 0 ? (
          <div className="flex h-24 items-center justify-center rounded border border-dashed text-sm text-muted-foreground">
            사진 없음
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {items.map((photo, index) => {
              const matches = photo.id ? selectedPhotoIds.has(photo.id) : false
              const key = photo.id || `${type}-${photo.filename}-${index}`
              const draggableEnabled = !reorderDisabled && items.length > 1 && Boolean(photo.id)

              return (
                <div
                  key={key}
                  className="relative overflow-hidden rounded-lg border bg-card shadow-sm"
                  draggable={draggableEnabled || undefined}
                  onDragStart={onDragStart(type, index)}
                  onDragOver={onDragOver(type, index)}
                  onDrop={onDrop(type, index)}
                  onDragEnd={onDragEnd}
                >
                  <div className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded-full bg-background/80 px-2 py-1 text-xs text-muted-foreground shadow">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={matches}
                      disabled={!photo.id}
                      onChange={event => {
                        event.stopPropagation()
                        togglePhotoSelection(photo.id)
                      }}
                      onClick={event => event.stopPropagation()}
                    />
                    <GripVertical className="h-4 w-4" />
                  </div>
                  <div
                    className="relative h-48 w-full bg-muted cursor-zoom-in hover:opacity-90 transition-opacity"
                    onClick={() => photo.url && onPreview(photo.url)}
                  >
                    {photo.url ? (
                      <Image
                        src={photo.url}
                        alt={photo.filename || 'photo'}
                        fill
                        sizes="(min-width: 768px) 50vw, 100vw"
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                        미리보기 없음
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 p-3 text-sm text-muted-foreground">
                    <div
                      className="text-sm font-semibold text-foreground"
                      title={photo.filename || ''}
                    >
                      {photo.filename || '사진'}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-medium text-foreground">{title}</span>
                      <span>{photo.uploaded_at ? formatDate(photo.uploaded_at) : '-'}</span>
                    </div>
                    <div className="text-xs">업로더: {photo.uploaded_by_name || '알 수 없음'}</div>
                    {photo.description && (
                      <div className="text-sm leading-relaxed text-foreground">
                        {photo.description}
                      </div>
                    )}
                    <div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onOpenFile(photo)}
                        disabled={!hasFileReference(photo)}
                      >
                        원본 보기
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const renderListGroup = (title: string, type: 'before' | 'after') => {
    const items = photoBuckets[type]
    const ids = items.map(photo => photo.id).filter((id): id is string => Boolean(id))
    const groupSelected = ids.length > 0 && ids.every(id => selectedPhotoIds.has(id))

    return (
      <div className="rounded-lg border bg-muted/20">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <div className="text-sm font-semibold text-foreground">{title}</div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <Badge variant="secondary">{items.length}장</Badge>
            {items.length > 0 && (
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={groupSelected}
                  onChange={() => toggleGroupSelection(type)}
                />
                선택
              </label>
            )}
          </div>
        </div>
        {items.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-xs text-muted-foreground">
            사진 없음
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-muted-foreground">
              <thead>
                <tr className="bg-muted/40 text-left uppercase tracking-wide">
                  <th className="px-3 py-2 font-medium">선택</th>
                  <th className="px-3 py-2 font-medium">순서</th>
                  <th className="px-3 py-2 font-medium">미리보기</th>
                  <th className="px-3 py-2 font-medium">파일명</th>
                  <th className="px-3 py-2 font-medium">업로드일</th>
                  <th className="px-3 py-2 font-medium">업로더</th>
                  <th className="px-3 py-2 font-medium">메모</th>
                  <th className="px-3 py-2 font-medium">원본</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((photo, index) => {
                  const isSelected = photo.id ? selectedPhotoIds.has(photo.id) : false
                  const key = photo.id || `${type}-${photo.filename}-${index}`
                  const draggableEnabled = !reorderDisabled && items.length > 1 && Boolean(photo.id)

                  return (
                    <tr
                      key={key}
                      className="bg-background/70"
                      draggable={draggableEnabled || undefined}
                      onDragStart={onDragStart(type, index)}
                      onDragOver={onDragOver(type, index)}
                      onDrop={onDrop(type, index)}
                      onDragEnd={onDragEnd}
                    >
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={isSelected}
                          disabled={!photo.id}
                          onChange={event => {
                            event.stopPropagation()
                            togglePhotoSelection(photo.id)
                          }}
                          onClick={event => event.stopPropagation()}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </td>
                      <td className="px-3 py-2">
                        <div
                          className="relative h-14 w-20 overflow-hidden rounded border bg-muted cursor-zoom-in hover:opacity-90 transition-opacity"
                          onClick={() => photo.url && onPreview(photo.url)}
                        >
                          {photo.url ? (
                            <Image
                              src={photo.url}
                              alt={photo.filename || 'photo'}
                              fill
                              sizes="80px"
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                              없음
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-foreground">
                        <span className="line-clamp-2" title={photo.filename || ''}>
                          {photo.filename || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {photo.uploaded_at ? formatDate(photo.uploaded_at) : '-'}
                      </td>
                      <td className="px-3 py-2">{photo.uploaded_by_name || '알 수 없음'}</td>
                      <td className="px-3 py-2">
                        {photo.description ? (
                          <span className="line-clamp-2">{photo.description}</span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onOpenFile(photo)}
                          disabled={!hasFileReference(photo)}
                        >
                          보기
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader className="px-4 py-3 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">업로드 된 사진</CardTitle>
            <CardDescription>작업 전/후 사진</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">전체 {totalPhotoCount}장</Badge>
            <Badge variant="outline">보수 전 {photoBuckets.before.length}장</Badge>
            <Badge variant="outline">보수 후 {photoBuckets.after.length}장</Badge>
            {selectedCount > 0 && <Badge variant="secondary">선택 {selectedCount}장</Badge>}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={toggleAllSelection}
              disabled={totalPhotoCount === 0}
            >
              전체 선택
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onClearSelection}
              disabled={selectedCount === 0}
            >
              선택 해제
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={selectedCount === 0 || photoActionLoading}
            >
              {photoActionLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              선택 삭제
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-slate-300 text-[#1A254F]"
              onClick={handleBulkDownload}
              disabled={selectedCount === 0}
            >
              <Download className="h-4 w-4" />
              선택 다운로드
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant={photosViewMode === 'preview' ? 'default' : 'outline'}
              onClick={() => setPhotosViewMode('preview')}
              aria-pressed={photosViewMode === 'preview'}
            >
              <LayoutGrid className="mr-1 h-4 w-4" />
              미리보기
            </Button>
            <Button
              size="sm"
              variant={photosViewMode === 'list' ? 'default' : 'outline'}
              onClick={() => setPhotosViewMode('list')}
              aria-pressed={photosViewMode === 'list'}
            >
              <List className="mr-1 h-4 w-4" />
              리스트
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-4">
        {photosViewMode === 'preview' ? (
          <div className="grid gap-4 md:grid-cols-2">
            {renderPreviewGroup('보수 전', 'before')}
            {renderPreviewGroup('보수 후', 'after')}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {renderListGroup('보수 전', 'before')}
            {renderListGroup('보수 후', 'after')}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
