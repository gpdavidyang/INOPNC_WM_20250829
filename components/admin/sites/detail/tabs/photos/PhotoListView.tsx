'use client'

import DataTable from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { ExternalLink, MoveRight, Trash2 } from 'lucide-react'
import Image from 'next/image'

interface PhotoListViewProps {
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

export function PhotoListView({
  beforePhotos,
  afterPhotos,
  counts,
  selectedIds,
  onSelect,
  onSelectAll,
  onPreview,
  onMove,
  onDelete,
}: PhotoListViewProps) {
  return (
    <div className="space-y-12">
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-2 border-b-2">
          <h3 className="text-lg font-black text-foreground">보수 전 (Before)</h3>
          <span className="bg-gray-100 text-[10px] font-black px-2 py-0.5 rounded-full text-muted-foreground uppercase tracking-widest">
            {counts.before}
          </span>
        </div>
        <ListSection
          photos={beforePhotos}
          selectedIds={selectedIds}
          onSelect={onSelect}
          onPreview={onPreview}
          onMove={onMove}
          onDelete={onDelete}
          targetType="after"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-2 border-b-2">
          <h3 className="text-lg font-black text-foreground">보수 후 (After)</h3>
          <span className="bg-gray-100 text-[10px] font-black px-2 py-0.5 rounded-full text-muted-foreground uppercase tracking-widest">
            {counts.after}
          </span>
        </div>
        <ListSection
          photos={afterPhotos}
          selectedIds={selectedIds}
          onSelect={onSelect}
          onPreview={onPreview}
          onMove={onMove}
          onDelete={onDelete}
          targetType="before"
        />
      </div>
    </div>
  )
}

function ListSection({
  photos,
  selectedIds,
  onSelect,
  onPreview,
  onMove,
  onDelete,
  targetType,
}: any) {
  const columns: any[] = [
    {
      key: 'select',
      header: '',
      width: 40,
      render: (p: any) => (
        <input
          type="checkbox"
          checked={selectedIds.has(p.id)}
          onChange={() => onSelect(p.id)}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ),
    },
    {
      key: 'preview',
      header: '미리보기',
      width: 80,
      render: (p: any) => (
        <div
          className="relative w-16 h-12 rounded border bg-gray-50 overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
          onClick={() => onPreview(p)}
        >
          <Image src={p.url || p.path} alt="site photo" fill className="object-cover" unoptimized />
        </div>
      ),
    },
    {
      key: 'filename',
      header: '파일명',
      render: (p: any) => (
        <div className="flex flex-col">
          <span className="font-bold text-foreground text-sm">{p.filename || 'Untitled'}</span>
          <span className="text-[10px] text-muted-foreground">{p.id}</span>
        </div>
      ),
    },
    {
      key: 'work_date',
      header: '작업일자',
      width: 120,
      render: (p: any) => (
        <span className="text-xs font-medium">
          {p.work_date ? format(new Date(p.work_date), 'yyyy-MM-dd') : '-'}
        </span>
      ),
    },
    {
      key: 'uploader',
      header: '업로더',
      width: 120,
      render: (p: any) => <span className="text-xs">{p.uploaded_by_name || 'Uploader'}</span>,
    },
    {
      key: 'metadata',
      header: '태그/메모',
      render: (p: any) => (
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap gap-1">
            {p.component_name && (
              <Badge variant="secondary" className="text-[9px] px-1 py-0">
                {p.component_name}
              </Badge>
            )}
            {p.work_process && (
              <Badge variant="outline" className="text-[9px] px-1 py-0">
                {p.work_process}
              </Badge>
            )}
          </div>
          {p.description && (
            <span className="text-[10px] text-muted-foreground line-clamp-1 italic">
              &quot;{p.description}&quot;
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '관리',
      width: 140,
      align: 'right',
      render: (p: any) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-blue-600"
            onClick={() => onMove(p)}
            title={targetType === 'after' ? '보수 후로 이동' : '보수 전으로 이동'}
          >
            <MoveRight
              className={targetType === 'before' ? 'w-3.5 h-3.5 rotate-180' : 'w-3.5 h-3.5'}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-rose-600"
            onClick={() => onDelete(p)}
            title="삭제"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
          <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
            <a
              href={`/dashboard/admin/daily-reports/${p.daily_report_id}`}
              target="_blank"
              rel="noreferrer"
              title="작업일지 이동"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
      <DataTable data={photos} columns={columns} rowKey="id" emptyMessage="사진이 없습니다." />
    </div>
  )
}
