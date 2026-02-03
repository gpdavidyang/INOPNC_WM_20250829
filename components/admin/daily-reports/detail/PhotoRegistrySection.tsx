'use client'

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
        <div className="flex items-center gap-3 pb-2 border-b-2">
          <h3 className="text-lg font-black text-foreground uppercase tracking-tight">{title}</h3>
          <span className="bg-gray-100 text-[10px] font-black px-2 py-0.5 rounded-full text-muted-foreground uppercase tracking-widest">
            {photos.length} Photos
          </span>
        </div>

        {photos.length === 0 ? (
          <div className="py-20 bg-gray-50/50 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-2">
            <p className="text-sm font-bold text-muted-foreground opacity-40 italic">
              업로드된 사진이 없습니다.
            </p>
          </div>
        ) : isListView ? (
          <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b">
                  <th className="p-4 w-10"></th>
                  <th className="p-4 w-10"></th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest opacity-40">
                    Preview
                  </th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest opacity-40">
                    Filename / Memo
                  </th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest opacity-40">
                    Date
                  </th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest opacity-40">
                    Uploader
                  </th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
    <div className="space-y-12">
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

      <div className="space-y-16">
        {renderSection('보수 전 (Before Repair)', 'before')}
        {renderSection('보수 후 (After Repair)', 'after')}
      </div>
    </div>
  )
}
