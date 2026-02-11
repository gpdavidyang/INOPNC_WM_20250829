'use client'

import { Badge } from '@/components/ui/badge'
import type { AdditionalPhotoData } from '@/types/daily-reports'
import { RegistryBulkActions } from './RegistryBulkActions'
import { RegistryPhotoItem } from './RegistryPhotoItem'

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

  const renderSection = (title: string, type: 'before' | 'after') => {
    const photos = photoBuckets[type]
    const isListView = photosViewMode === 'list'

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
          <h3 className="text-base font-black text-foreground tracking-tight">{title}</h3>
          <Badge className="bg-blue-50 text-blue-700 text-[11px] font-black tracking-tighter px-2.5 py-0.5 border-none rounded-md">
            {photos.length}
          </Badge>
        </div>

        {photos.length === 0 ? (
          <div className="py-16 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center gap-2">
            <p className="text-sm font-medium text-muted-foreground/40 italic">
              해당 구분의 사진 데이터가 없습니다.
            </p>
          </div>
        ) : isListView ? (
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="p-4 w-10"></th>
                  <th className="p-4 w-10"></th>
                  <th className="p-4 text-[11px] font-black uppercase tracking-tighter text-muted-foreground/30">
                    미리보기
                  </th>
                  <th className="p-4 text-[11px] font-black uppercase tracking-tighter text-muted-foreground/30">
                    파일명 / 메모
                  </th>
                  <th className="p-4 text-[11px] font-black uppercase tracking-tighter text-muted-foreground/30 text-center">
                    등록일
                  </th>
                  <th className="p-4 text-[11px] font-black uppercase tracking-tighter text-muted-foreground/30 text-center">
                    작성자
                  </th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {photos.map((photo, index) => (
                  <RegistryPhotoItem
                    key={photo.id || index}
                    photo={photo}
                    type={type}
                    isSelected={!!photo.id && selectedPhotoIds.has(photo.id)}
                    onToggle={togglePhotoSelection}
                    onPreview={onPreview}
                    onOpenFile={onOpenFile}
                    viewMode="list"
                    draggable={!reorderDisabled && !!photo.id}
                    onDragStart={onDragStart(type, index)}
                    onDragOver={onDragOver(type, index)}
                    onDrop={onDrop(type, index)}
                    onDragEnd={onDragEnd}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {photos.map((photo, index) => (
              <RegistryPhotoItem
                key={photo.id || index}
                photo={photo}
                type={type}
                isSelected={!!photo.id && selectedPhotoIds.has(photo.id)}
                onToggle={togglePhotoSelection}
                onPreview={onPreview}
                onOpenFile={onOpenFile}
                viewMode="preview"
                draggable={!reorderDisabled && !!photo.id}
                onDragStart={onDragStart(type, index)}
                onDragOver={onDragOver(type, index)}
                onDrop={onDrop(type, index)}
                onDragEnd={onDragEnd}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <RegistryBulkActions
        viewMode={photosViewMode}
        setViewMode={setPhotosViewMode}
        totalCount={totalPhotoCount}
        selectedCount={selectedCount}
        beforeCount={photoBuckets.before.length}
        afterCount={photoBuckets.after.length}
        onSelectAll={toggleAllSelection}
        onClearSelection={onClearSelection}
        onDelete={handleBulkDelete}
        onDownload={handleBulkDownload}
        loading={photoActionLoading}
      />

      <div className="space-y-8">
        {renderSection('시공 전 사진 기록', 'before')}
        {renderSection('시공 후 사진 기록', 'after')}
      </div>
    </div>
  )
}
