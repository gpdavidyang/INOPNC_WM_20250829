'use client'

import React, { useTransition } from 'react'
import DataTable from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/badge'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/components/ui/use-confirm'

export default function DailyReportsTable({ reports }: { reports: any[] }) {
  const router = useRouter()
  const sp = useSearchParams()
  const { confirm } = useConfirm()
  const sortKey = (sp?.get('sort') || 'work_date') as string
  const sortDir = (sp?.get('dir') || 'desc') as 'asc' | 'desc'

  const [isPending, startTransition] = useTransition()
  const onSortChange = (key: string, dir: 'asc' | 'desc') => {
    const params = new URLSearchParams(sp?.toString() || '')
    params.set('sort', key)
    params.set('dir', dir)
    params.set('page', '1')
    startTransition(() => {
      router.push(`?${params.toString()}`)
    })
  }

  return (
    <div className="relative">
      <DataTable
        data={reports}
        rowKey="id"
        emptyMessage="표시할 작업일지가 없습니다."
        stickyHeader
        initialSort={{ columnKey: sortKey, direction: sortDir }}
        onSortChange={onSortChange}
        columns={[
          {
            key: 'work_date',
            header: '작업일자',
            sortable: true,
            accessor: (r: any) =>
              r?.work_date || r?.report_date ? new Date(r.work_date || r.report_date).getTime() : 0,
            render: (r: any) => (
              <a
                href={`/dashboard/admin/daily-reports/${r.id}`}
                className="underline text-blue-600"
              >
                {r?.work_date || r?.report_date
                  ? new Date(r.work_date || r.report_date).toLocaleDateString('ko-KR')
                  : '-'}
              </a>
            ),
            width: 110,
            headerClassName: 'whitespace-nowrap',
          },
          {
            key: 'site_name',
            header: '현장',
            sortable: true,
            accessor: (r: any) => r?.sites?.name || r?.site?.name || '',
            render: (r: any) => (
              <div className="font-medium text-foreground">
                {r?.site_id ? (
                  <a
                    href={`/dashboard/admin/sites/${r.site_id}`}
                    className="underline-offset-2 hover:underline"
                    title="현장 상세 보기"
                  >
                    {r?.sites?.name || r?.site?.name || '-'}
                  </a>
                ) : (
                  <span>{r?.sites?.name || r?.site?.name || '-'}</span>
                )}
                <div className="text-xs text-muted-foreground">
                  {r?.sites?.address || r?.site?.address || '-'}
                </div>
              </div>
            ),
            width: 220,
            headerClassName: 'whitespace-nowrap',
          },
          {
            key: 'component_name',
            header: '부재명',
            sortable: true,
            accessor: (r: any) => r?.component_name || r?.member_name || '',
            render: (r: any) => r?.component_name || r?.member_name || '-',
            width: 180,
            headerClassName: 'whitespace-nowrap',
          },
          {
            key: 'work_process',
            header: '작업공정',
            sortable: true,
            accessor: (r: any) => r?.work_process || r?.process_type || '',
            render: (r: any) => r?.work_process || r?.process_type || '-',
            width: 160,
            headerClassName: 'whitespace-nowrap',
          },
          {
            key: 'work_section',
            header: '작업구간',
            sortable: true,
            accessor: (r: any) => r?.work_section || '',
            render: (r: any) => r?.work_section || '-',
            width: 160,
            headerClassName: 'whitespace-nowrap',
          },
          {
            key: 'author',
            header: '작성자',
            sortable: false,
            accessor: (r: any) =>
              r?.profiles?.full_name || r?.submitted_by_profile?.full_name || '',
            render: (r: any) =>
              r?.created_by ? (
                <a
                  href={`/dashboard/admin/users/${r.created_by}`}
                  className="underline-offset-2 hover:underline"
                  title="사용자 상세 보기"
                >
                  {r?.profiles?.full_name || r?.submitted_by_profile?.full_name || r.created_by}
                </a>
              ) : (
                <span>{r?.profiles?.full_name || r?.submitted_by_profile?.full_name || '-'}</span>
              ),
            width: 140,
            headerClassName: 'whitespace-nowrap',
          },
          {
            key: 'status',
            header: '상태',
            sortable: true,
            accessor: (r: any) => r?.status || '',
            render: (r: any) => (
              <Badge variant={r?.status === 'submitted' ? 'default' : 'outline'}>
                {r?.status === 'submitted'
                  ? '제출됨'
                  : r?.status === 'draft'
                    ? '임시저장'
                    : r?.status || '미정'}
              </Badge>
            ),
            width: 90,
            headerClassName: 'whitespace-nowrap',
          },
          {
            key: 'workers',
            header: '인원',
            sortable: false,
            accessor: (r: any) => r?.worker_details_count ?? r?.total_workers ?? 0,
            render: (r: any) => String(r?.worker_details_count ?? r?.total_workers ?? 0),
            width: 70,
            headerClassName: 'whitespace-nowrap',
          },
          {
            key: 'docs',
            header: '문서',
            sortable: false,
            accessor: (r: any) => r?.daily_documents_count ?? 0,
            render: (r: any) => String(r?.daily_documents_count ?? 0),
            width: 70,
            headerClassName: 'whitespace-nowrap',
          },
          {
            key: 'total_manhours',
            header: '총공수',
            sortable: true,
            accessor: (r: any) => r?.total_manhours ?? 0,
            render: (r: any) => <span>{formatManhours(r?.total_manhours)}</span>,
            width: 90,
            headerClassName: 'whitespace-nowrap',
          },
          {
            key: 'actions',
            header: '작업',
            sortable: false,
            align: 'left',
            width: 210,
            className: 'whitespace-nowrap',
            render: (r: any) => (
              <div className="flex justify-start gap-1">
                <Button asChild variant="outline" size="sm" className="px-2 py-1 text-xs">
                  <a href={`/dashboard/admin/daily-reports/${r.id}`}>상세</a>
                </Button>
                <Button asChild variant="outline" size="sm" className="px-2 py-1 text-xs">
                  <a href={`/dashboard/admin/daily-reports/${r.id}/edit`}>수정</a>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="px-2 py-1 text-xs"
                  onClick={async () => {
                    const ok = await confirm({
                      title: '작업일지 삭제',
                      description: '이 작업일지를 삭제하시겠습니까? 되돌릴 수 없습니다.',
                      confirmText: '삭제',
                      cancelText: '취소',
                      variant: 'destructive',
                    })
                    if (!ok) return
                    try {
                      const res = await fetch(`/api/admin/daily-reports/${r.id}`, {
                        method: 'DELETE',
                      })
                      if (!res.ok) throw new Error('삭제 실패')
                      router.refresh()
                    } catch (e) {
                      alert((e as Error)?.message || '삭제 중 오류가 발생했습니다.')
                    }
                  }}
                >
                  삭제
                </Button>
              </div>
            ),
          },
        ]}
      />
      {isPending && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] pointer-events-none">
          <div className="p-4 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function formatManhours(v: unknown): string {
  const n = Number(v)
  if (!Number.isFinite(n)) return '0.0'
  const floored = Math.floor(n * 10) / 10
  return floored.toFixed(1)
}
