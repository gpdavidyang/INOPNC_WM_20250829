'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { ExternalLink, Eye, MoveRight, Trash2 } from 'lucide-react'
import Image from 'next/image'

interface PhotoGridViewProps {
  beforePhotos: any[]
  afterPhotos: any[]
  counts: { before: number; after: number }
  selectedIds: Set<string>
  onSelect: (id: string) => void
  onSelectAll: (type: 'before' | 'after', checked: boolean) => void
  onPreview: (photo: any) => void
  onMove: (photo: any) => void
  onDelete: (photo: any) => void
}

export function PhotoGridView({
  beforePhotos,
  afterPhotos,
  counts,
  selectedIds,
  onSelect,
  onSelectAll,
  onPreview,
  onMove,
  onDelete,
}: PhotoGridViewProps) {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <PhotoColumn
        title="보수 전 (Before)"
        count={counts.before}
        photos={beforePhotos}
        type="before"
        selectedIds={selectedIds}
        onSelect={onSelect}
        onSelectAll={c => onSelectAll('before', c)}
        onPreview={onPreview}
        onMove={onMove}
        onDelete={onDelete}
      />
      <PhotoColumn
        title="보수 후 (After)"
        count={counts.after}
        photos={afterPhotos}
        type="after"
        selectedIds={selectedIds}
        onSelect={onSelect}
        onSelectAll={c => onSelectAll('after', c)}
        onPreview={onPreview}
        onMove={onMove}
        onDelete={onDelete}
      />
    </div>
  )
}

function PhotoColumn({
  title,
  count,
  photos,
  type,
  selectedIds,
  onSelect,
  onSelectAll,
  onPreview,
  onMove,
  onDelete,
}: any) {
  const allSelected = photos.length > 0 && photos.every((p: any) => selectedIds.has(p.id))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b-2">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-black text-foreground">{title}</h3>
          <span className="bg-gray-100 text-[10px] font-black px-2 py-0.5 rounded-full text-muted-foreground uppercase tracking-widest">
            {count} Photos
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={e => onSelectAll(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-xs font-bold text-muted-foreground">전체 선택</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
        {photos.length === 0 ? (
          <div className="col-span-full py-12 bg-gray-50/50 rounded-2xl border-2 border-dashed flex items-center justify-center">
            <p className="text-xs font-bold text-muted-foreground">사진이 없습니다.</p>
          </div>
        ) : (
          photos.map((photo: any) => (
            <div
              key={photo.id}
              className="group relative rounded-2xl border bg-card overflow-hidden shadow-sm hover:shadow-md hover:border-blue-200 transition-all"
            >
              <div
                className="relative aspect-[4/3] bg-gray-100 cursor-pointer"
                onClick={() => onPreview(photo)}
              >
                <Image
                  src={photo.url || photo.path}
                  alt="site photo"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  unoptimized
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Eye className="text-white w-6 h-6" />
                </div>
                <div className="absolute top-2 right-2 z-10" onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(photo.id)}
                    onChange={() => onSelect(photo.id)}
                    className="w-5 h-5 rounded-lg border-2 border-white/50 bg-black/20 text-blue-600 focus:ring-0"
                  />
                </div>
              </div>

              <div className="p-3 space-y-2">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-foreground truncate">
                    {photo.filename || 'Untitled'}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {photo.work_date ? format(new Date(photo.work_date), 'yyyy-MM-dd') : '-'} |{' '}
                    {photo.uploaded_by_name || 'Uploader'}
                  </span>
                </div>

                {(photo.component_name || photo.work_process) && (
                  <div className="flex flex-wrap gap-1">
                    {photo.component_name && (
                      <Badge variant="secondary" className="text-[9px] px-1 py-0">
                        {photo.component_name}
                      </Badge>
                    )}
                    {photo.work_process && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0">
                        {photo.work_process}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between gap-1 border-t opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-blue-600 hover:bg-blue-50"
                      onClick={() => onMove(photo)}
                      title={type === 'before' ? '보수 후로 이동' : '보수 전으로 이동'}
                    >
                      <MoveRight className={cn('w-3.5 h-3.5', type === 'after' && 'rotate-180')} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-rose-600 hover:bg-rose-50"
                      onClick={() => onDelete(photo)}
                      title="삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <Button asChild variant="ghost" size="icon" className="h-7 w-7">
                    <a
                      href={`/dashboard/admin/daily-reports/${photo.daily_report_id}`}
                      target="_blank"
                      rel="noreferrer"
                      title="작업일지 이동"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
