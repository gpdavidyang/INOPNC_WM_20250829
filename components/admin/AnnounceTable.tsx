'use client'

import React from 'react'
import { DataTable } from '@/components/admin/DataTable'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { useConfirm } from '@/components/ui/use-confirm'

interface AnnounceTableProps {
  announcements: any[]
  siteNameMap?: Record<string, string>
}

export default function AnnounceTable({ announcements, siteNameMap = {} }: AnnounceTableProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { confirm } = useConfirm()
  const [actionTarget, setActionTarget] = React.useState<string | null>(null)

  const roleLabel = (r: string) =>
    (
      ({
        worker: '작업자',
        site_manager: '현장관리자',
        admin: '본사관리자',
        system_admin: '시스템관리자',
        production_manager: '생산관리자',
      }) as Record<string, string>
    )[r] || r

  const priorityLabel = (p: string) =>
    (
      ({
        low: '낮음',
        medium: '보통',
        medium: '보통',
        high: '높음',
        critical: '최우선',
        urgent: '긴급',
        normal: '보통',
      }) as Record<string, string>
    )[p] || p

  const handleToggleActive = async (announcement: any) => {
    setActionTarget(announcement.id)
    try {
      const res = await fetch(`/api/announcements/${announcement.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !announcement.is_active }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.error) throw new Error(json?.error || '상태를 변경하지 못했습니다.')
      toast({ title: '상태 변경', description: '공지 상태가 업데이트되었습니다.' })
      router.refresh()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '상태 변경 실패',
        description: error instanceof Error ? error.message : '처리 중 오류가 발생했습니다.',
      })
    } finally {
      setActionTarget(null)
    }
  }

  const handleDelete = async (announcement: any) => {
    const ok = await confirm({
      title: '공지 삭제',
      description: '이 공지를 삭제하시겠습니까? 되돌릴 수 없습니다.',
      confirmText: '삭제',
      cancelText: '취소',
      variant: 'destructive',
    })
    if (!ok) return
    setActionTarget(announcement.id)
    try {
      const res = await fetch(`/api/announcements/${announcement.id}`, { method: 'DELETE' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.error) throw new Error(json?.error || '삭제에 실패했습니다.')
      toast({ title: '삭제 완료', description: '공지가 삭제되었습니다.' })
      router.refresh()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '삭제 실패',
        description: error instanceof Error ? error.message : '처리 중 오류가 발생했습니다.',
      })
    } finally {
      setActionTarget(null)
    }
  }

  return (
    <>
      <DataTable
        className="mt-1"
        data={announcements}
        rowKey="id"
        emptyMessage="표시할 공지가 없습니다."
        stickyHeader
        columns={[
          {
            key: 'created_at',
            header: '게시일',
            sortable: true,
            accessor: (a: any) => (a?.created_at ? new Date(a.created_at).getTime() : 0),
            render: (a: any) =>
              a?.created_at ? new Date(a.created_at).toLocaleString('ko-KR') : '-',
          },
          {
            key: 'priority',
            header: '우선순위',
            sortable: true,
            accessor: (a: any) => a?.priority || '',
            render: (a: any) => priorityLabel(String(a?.priority || '')),
          },
          {
            key: 'title',
            header: '제목',
            sortable: true,
            accessor: (a: any) => a?.title || '',
            render: (a: any) => (
              <span className="font-medium text-foreground">{a?.title || '-'}</span>
            ),
          },
          {
            key: 'target_roles',
            header: '대상 역할',
            sortable: true,
            accessor: (a: any) => (Array.isArray(a?.target_roles) ? a.target_roles.join(', ') : ''),
            render: (a: any) => {
              const roles = Array.isArray(a?.target_roles) ? a.target_roles : []
              const labels = roles.length > 0 ? roles.map((r: string) => roleLabel(r)) : ['전체']
              return (
                <span className="truncate inline-block max-w-[320px]" title={labels.join(', ')}>
                  {labels.join(', ') || '-'}
                </span>
              )
            },
          },
          {
            key: 'target_sites',
            header: '대상 현장',
            sortable: true,
            accessor: (a: any) => (Array.isArray(a?.target_sites) ? a.target_sites.length : 0),
            render: (a: any) => {
              const sites = Array.isArray(a?.target_sites) ? a.target_sites : []
              const labels =
                sites.length > 0 ? sites.map((site: string) => siteNameMap[site] || site) : ['전체']
              return (
                <span className="truncate inline-block max-w-[320px]" title={labels.join(', ')}>
                  {labels.join(', ')}
                </span>
              )
            },
          },
          {
            key: 'is_active',
            header: '상태',
            sortable: true,
            accessor: (a: any) => (a?.is_active ? 1 : 0),
            render: (a: any) => (a?.is_active ? '활성' : '비활성'),
          },
          {
            key: 'actions',
            header: '동작',
            render: (a: any) => (
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="compact"
                  onClick={() => router.push(`/dashboard/admin/communication/editor?id=${a.id}`)}
                >
                  수정
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="compact"
                  onClick={() => handleToggleActive(a)}
                  disabled={actionTarget === a.id}
                >
                  {a?.is_active ? '비활성화' : '활성화'}
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="compact"
                  onClick={() => handleDelete(a)}
                  disabled={actionTarget === a.id}
                >
                  삭제
                </Button>
              </div>
            ),
          },
        ]}
      />
    </>
  )
}
