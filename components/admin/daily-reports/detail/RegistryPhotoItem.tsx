'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { GripVertical, Maximize2 } from 'lucide-react'
import Image from 'next/image'

interface RegistryPhotoItemProps {
  photo: any
  type: 'before' | 'after'
  isSelected: boolean
  onToggle: (id: string) => void
  onPreview: (url: string) => void
  onOpenFile: (photo: any) => void
  draggable?: boolean
  onDragStart?: (e: any) => void
  onDragOver?: (e: any) => void
  onDrop?: (e: any) => void
  onDragEnd?: () => void
  viewMode: 'preview' | 'list'
}

export function RegistryPhotoItem({
  photo,
  type,
  isSelected,
  onToggle,
  onPreview,
  onOpenFile,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  viewMode,
}: RegistryPhotoItemProps) {
  if (viewMode === 'list') {
    return (
      <tr
        className={cn(
          'group bg-white hover:bg-gray-50/50 transition-colors border-b last:border-0',
          isSelected && 'bg-blue-50/20'
        )}
        draggable={draggable}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
      >
        <td className="py-3 px-4 w-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggle(photo.id)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 accent-blue-600"
          />
        </td>
        <td className="py-3 px-2 w-10">
          <GripVertical className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-400 cursor-grab active:cursor-grabbing" />
        </td>
        <td className="py-3 px-4">
          <div
            className="relative w-14 h-10 rounded border border-gray-100 bg-gray-50 cursor-zoom-in hover:border-blue-300 transition-all shadow-sm"
            onClick={() => onPreview(photo.url)}
          >
            {photo.url ? (
              <Image src={photo.url} alt="photo" fill className="object-cover" unoptimized />
            ) : (
              <div className="flex items-center justify-center h-full text-[10px] text-gray-300 font-bold">
                이미지 없음
              </div>
            )}
          </div>
        </td>
        <td className="py-3 px-4">
          <div className="flex flex-col gap-0.5 max-w-[300px]">
            <span className="text-sm font-bold text-gray-800 line-clamp-1">
              {photo.description || photo.filename || ''}
            </span>
            {photo.description && photo.filename && (
              <span className="text-[11px] font-medium text-muted-foreground/50 truncate">
                {photo.filename}
              </span>
            )}
          </div>
        </td>
        <td className="py-3 px-4 text-xs font-medium text-muted-foreground/60 tabular-nums text-center">
          {photo.uploaded_at ? new Date(photo.uploaded_at).toLocaleDateString('ko-KR') : '-'}
        </td>
        <td className="py-3 px-4 text-center">
          <span className="text-xs font-bold text-gray-700">{photo.uploaded_by_name || ''}</span>
        </td>
        <td className="py-3 px-4 text-right">
          <Button
            variant="outline"
            size="xs"
            onClick={() => onOpenFile(photo)}
            className="h-8 rounded-lg px-3 font-medium text-muted-foreground hover:text-blue-600 border-gray-200 transition-all whitespace-nowrap"
          >
            원본 보기
          </Button>
        </td>
      </tr>
    )
  }

  return (
    <div
      className={cn(
        'group relative rounded-2xl border bg-white overflow-hidden transition-all h-full',
        isSelected ? 'border-blue-500 ring-4 ring-blue-50/50' : 'border-gray-200'
      )}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      {/* Photo Header (Selected/Grip) */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto bg-white/90 backdrop-blur-md p-1.5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggle(photo.id)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 accent-blue-600"
          />
          <GripVertical className="w-3.5 h-3.5 text-gray-400 cursor-grab active:cursor-grabbing" />
        </div>

        <button
          onClick={() => onPreview(photo.url)}
          className="pointer-events-auto bg-black/60 backdrop-blur-md p-2 rounded-xl text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Main Image */}
      <div
        className="relative aspect-video bg-gray-50 cursor-zoom-in overflow-hidden border-b border-gray-100"
        onClick={() => onPreview(photo.url)}
      >
        {photo.url ? (
          <Image
            src={photo.url}
            alt="photo"
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
            unoptimized
          />
        ) : (
          <div className="flex items-center justify-center h-full text-xs text-muted-foreground/30 font-bold">
            이미지 없음
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="p-4 space-y-3 flex flex-col h-[calc(100%-aspect-video)]">
        <div className="flex items-center justify-between gap-2">
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] font-black tracking-tighter px-2.5 py-0.5 rounded-md border-none',
              type === 'before' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
            )}
          >
            {type === 'before' ? '보수 전' : '보수 후'}
          </Badge>
          <span className="text-[10px] font-medium text-muted-foreground/40 truncate flex-1 text-right">
            {photo.filename}
          </span>
        </div>

        <p className="text-sm font-medium text-gray-700 leading-relaxed line-clamp-2 italic">
          {photo.description ? `"${photo.description}"` : ''}
        </p>

        <div className="pt-3 flex items-center justify-between border-t border-gray-50 mt-auto">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground/30">
              작성자
            </span>
            <span className="text-xs font-bold text-gray-700">{photo.uploaded_by_name || ''}</span>
          </div>
          <Button
            variant="outline"
            size="xs"
            onClick={() => onOpenFile(photo)}
            className="h-8 rounded-lg px-3 font-medium text-muted-foreground hover:text-blue-600 border-gray-200"
          >
            원본 보기
          </Button>
        </div>
      </div>
    </div>
  )
}
