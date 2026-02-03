'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ExternalLink, GripVertical, Maximize2 } from 'lucide-react'
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
          'group bg-white hover:bg-blue-50/30 transition-colors border-b last:border-0',
          isSelected && 'bg-blue-50/50'
        )}
        draggable={draggable}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
      >
        <td className="p-4 w-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggle(photo.id)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600"
          />
        </td>
        <td className="p-4 w-10">
          <GripVertical className="w-4 h-4 text-gray-300 group-hover:text-gray-600 cursor-grab active:cursor-grabbing" />
        </td>
        <td className="p-4">
          <div
            className="relative w-16 h-12 rounded-lg overflow-hidden border bg-gray-50 cursor-zoom-in hover:ring-2 hover:ring-blue-500 transition-all"
            onClick={() => onPreview(photo.url)}
          >
            {photo.url ? (
              <Image src={photo.url} alt="photo" fill className="object-cover" unoptimized />
            ) : (
              '-'
            )}
          </div>
        </td>
        <td className="p-4">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-foreground line-clamp-1">
              {photo.filename || 'Untitled'}
            </span>
            {photo.description && (
              <span className="text-[10px] text-muted-foreground italic line-clamp-1">
                &quot;{photo.description}&quot;
              </span>
            )}
          </div>
        </td>
        <td className="p-4 text-xs font-medium text-muted-foreground uppercase opacity-60">
          {photo.uploaded_at ? new Date(photo.uploaded_at).toLocaleDateString() : '-'}
        </td>
        <td className="p-4">
          <span className="text-xs font-bold text-foreground">
            {photo.uploaded_by_name || 'System'}
          </span>
        </td>
        <td className="p-4 text-right">
          <button
            onClick={() => onOpenFile(photo)}
            className="text-muted-foreground hover:text-blue-600 p-2 rounded-lg hover:bg-white transition-all"
            title="원본 보기"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </td>
      </tr>
    )
  }

  return (
    <div
      className={cn(
        'group relative rounded-3xl border bg-white overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1',
        isSelected ? 'border-blue-500 ring-2 ring-blue-500 ring-offset-2' : 'border-gray-200'
      )}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      {/* Photo Header (Selected/Grip) */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto bg-white/90 backdrop-blur-md p-1.5 rounded-xl border shadow-sm flex items-center gap-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggle(photo.id)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600"
          />
          <GripVertical className="w-4 h-4 text-gray-400 cursor-grab active:cursor-grabbing" />
        </div>

        <button
          onClick={() => onPreview(photo.url)}
          className="pointer-events-auto bg-black/60 backdrop-blur-md p-2 rounded-xl text-white opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Main Image */}
      <div
        className="relative aspect-video bg-gray-100 cursor-zoom-in overflow-hidden"
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
          <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
            No Preview
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <Badge
            variant="outline"
            className={cn(
              'text-[9px] font-black uppercase tracking-widest px-2 py-0 border-none',
              type === 'before' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
            )}
          >
            {type === 'before' ? 'Before Repair' : 'After Repair'}
          </Badge>
          <span className="text-[10px] font-bold text-muted-foreground/40">{photo.filename}</span>
        </div>

        {photo.description && (
          <p className="text-xs font-bold text-foreground/80 leading-relaxed line-clamp-2 italic">
            &quot;{photo.description}&quot;
          </p>
        )}

        <div className="pt-2 flex items-center justify-between border-t border-dashed">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
              Uploaded By
            </span>
            <span className="text-xs font-bold text-foreground">
              {photo.uploaded_by_name || 'System'}
            </span>
          </div>
          <button
            onClick={() => onOpenFile(photo)}
            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors"
          >
            Original <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  )
}
