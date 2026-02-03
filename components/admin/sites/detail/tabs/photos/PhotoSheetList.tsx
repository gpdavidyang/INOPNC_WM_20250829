'use client'

import DataTable from '@/components/admin/DataTable'
import PhotoSheetActions from '@/components/admin/documents/PhotoSheetActions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { format } from 'date-fns'

interface PhotoSheetListProps {
  photoSheets: any[]
  loading: boolean
  siteId: string
}

export function PhotoSheetList({ photoSheets, loading, siteId }: PhotoSheetListProps) {
  const columns: any[] = [
    {
      key: 'title',
      header: '제목',
      render: (s: any) => <span className="font-bold text-foreground">{s.title || '-'}</span>,
    },
    {
      key: 'grid',
      header: '배열',
      width: 100,
      render: (s: any) => (
        <span className="text-xs font-medium text-muted-foreground">
          {s.rows} × {s.cols}
        </span>
      ),
    },
    {
      key: 'orientation',
      header: '방향',
      width: 100,
      render: (s: any) => (
        <span className="text-xs">{s.orientation === 'landscape' ? '가로' : '세로'}</span>
      ),
    },
    {
      key: 'status',
      header: '상태',
      width: 100,
      render: (s: any) => (
        <Badge variant={s.status === 'final' ? 'default' : 'outline'}>
          {s.status === 'final' ? '확정' : '초안'}
        </Badge>
      ),
    },
    {
      key: 'date',
      header: '생성일',
      width: 160,
      render: (s: any) => (
        <span className="text-xs text-muted-foreground">
          {s.created_at ? format(new Date(s.created_at), 'yyyy-MM-dd HH:mm') : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '관리',
      width: 120,
      align: 'right',
      render: (s: any) => <PhotoSheetActions id={s.id} />,
    },
  ]

  return (
    <section className="rounded-2xl border bg-card p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-foreground">현장 사진대지 목록</h3>
          <p className="text-xs text-muted-foreground">이 현장에서 생성된 사진대지 목록입니다.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-xl border-gray-200" asChild>
            <a href={`/dashboard/admin/photo-sheets?site_id=${siteId}`}>전체 관리</a>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="rounded-xl border-2 border-blue-50"
            asChild
          >
            <a href={`/dashboard/admin/tools/photo-grid?site_id=${siteId}`}>사진대지 신규 생성</a>
          </Button>
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          <DataTable
            data={photoSheets}
            columns={columns}
            rowKey="id"
            emptyMessage="생성된 사진대지가 없습니다."
          />
        )}
      </div>
    </section>
  )
}
