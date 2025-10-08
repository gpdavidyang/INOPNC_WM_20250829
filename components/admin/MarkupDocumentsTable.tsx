'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { DataTable } from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

export default function MarkupDocumentsTable({ docs }: { docs: any[] }) {
  const router = useRouter()

  const handleDelete = async (id: string) => {
    const ok = window.confirm('해당 마크업 문서를 삭제하시겠습니까?')
    if (!ok) return
    try {
      const res = await fetch(`/api/markup-documents/${id}`, { method: 'DELETE' })
      const j = await res.json().catch(() => ({}))
      if (!res.ok || j?.error) throw new Error(j?.error || '삭제 실패')
      router.refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : '삭제 중 오류가 발생했습니다.')
    }
  }

  return (
    <DataTable
      data={docs}
      rowKey="id"
      emptyMessage="표시할 문서가 없습니다."
      stickyHeader
      columns={[
        {
          key: 'created_at',
          header: '생성일',
          sortable: true,
          accessor: (d: any) => (d?.created_at ? new Date(d.created_at).getTime() : 0),
          render: (d: any) =>
            d?.created_at ? new Date(d.created_at).toLocaleString('ko-KR') : '-',
        },
        {
          key: 'title',
          header: '제목',
          sortable: true,
          accessor: (d: any) => d?.title || '',
          render: (d: any) => (
            <span className="font-medium text-foreground">{d?.title || '-'}</span>
          ),
        },
        {
          key: 'site',
          header: '현장',
          sortable: true,
          accessor: (d: any) => d?.site?.name || '',
          render: (d: any) => d?.site?.name || '-',
        },
        {
          key: 'creator',
          header: '작성자',
          sortable: true,
          accessor: (d: any) => d?.creator?.full_name || d?.creator?.email || '',
          render: (d: any) => d?.creator?.full_name || d?.creator?.email || '-',
        },
        {
          key: 'status',
          header: '상태',
          sortable: true,
          accessor: (d: any) => d?.status || '',
          render: (d: any) => (
            <Badge variant={d?.status === 'approved' ? 'default' : 'outline'}>
              {d?.status || '-'}
            </Badge>
          ),
        },
        {
          key: 'actions',
          header: '작업',
          render: (d: any) => (
            <div className="flex items-center gap-1 whitespace-nowrap">
              <Link
                href={`/dashboard/admin/documents/markup/${d.id}`}
                className={buttonVariants({ variant: 'outline', size: 'compact' })}
                role="button"
              >
                상세
              </Link>
              <Link
                href={`/dashboard/admin/documents/markup/${d.id}/edit`}
                className={buttonVariants({ variant: 'secondary', size: 'compact' })}
                role="button"
              >
                수정
              </Link>
              <button
                className={buttonVariants({ variant: 'destructive', size: 'compact' })}
                onClick={() => handleDelete(d.id)}
              >
                삭제
              </button>
            </div>
          ),
        },
      ]}
    />
  )
}
