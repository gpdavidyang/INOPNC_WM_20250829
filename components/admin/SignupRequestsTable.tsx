'use client'

import React, { useMemo, useState } from 'react'
import DataTable from '@/components/admin/DataTable'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'

export default function SignupRequestsTable({ requests }: { requests: any[] }) {
  const router = useRouter()
  const { toast } = useToast()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const approve = async (id: string) => {
    setBusyId(id)
    try {
      const res = await fetch(`/api/admin/signup-requests/${id}/approve`, { method: 'POST' })
      const j = await res.json().catch(() => ({}))
      if (!res.ok || !j?.success) throw new Error(j?.error || '승인 처리에 실패했습니다.')
      toast({
        title: '승인 완료',
        description: '사용자가 생성되었습니다.',
        action: j?.created_user_id
          ? {
              label: '사용자 상세로 이동',
              onClick: () => router.push(`/dashboard/admin/users/${j.created_user_id}`),
            }
          : undefined,
        variant: 'success',
      })
      router.refresh()
    } catch (e: any) {
      toast({ title: '오류', description: e?.message, variant: 'destructive' })
    } finally {
      setBusyId(null)
    }
  }

  const submitReject = async () => {
    if (!rejectId) return
    setBusyId(rejectId)
    try {
      const res = await fetch(`/api/admin/signup-requests/${rejectId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason || undefined }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok || !j?.success) throw new Error(j?.error || '거절 처리에 실패했습니다.')
      toast({ title: '거절 완료', description: '요청이 거절되었습니다.', variant: 'success' })
      setRejectId(null)
      setRejectReason('')
      router.refresh()
    } catch (e: any) {
      toast({ title: '오류', description: e?.message, variant: 'destructive' })
    } finally {
      setBusyId(null)
    }
  }

  const columns = useMemo(
    () => [
      {
        key: 'requested_at',
        header: '요청일',
        sortable: true,
        accessor: (r: any) => (r?.requested_at ? new Date(r.requested_at).getTime() : 0),
        render: (r: any) =>
          r?.requested_at ? new Date(r.requested_at).toLocaleString('ko-KR') : '-',
      },
      {
        key: 'full_name',
        header: '이름',
        sortable: true,
        accessor: (r: any) => r?.full_name || '',
        render: (r: any) => r?.full_name || '-',
      },
      {
        key: 'email',
        header: '이메일',
        sortable: true,
        accessor: (r: any) => r?.email || '',
        render: (r: any) => r?.email || '-',
      },
      {
        key: 'company',
        header: '회사',
        sortable: true,
        accessor: (r: any) => r?.company || r?.company_name || '',
        render: (r: any) => r?.company || r?.company_name || '-',
      },
      {
        key: 'requested_role',
        header: '역할',
        sortable: true,
        accessor: (r: any) => r?.requested_role || '',
        render: (r: any) => r?.requested_role || '-',
      },
      {
        key: 'status',
        header: '상태',
        sortable: true,
        accessor: (r: any) => r?.status || '',
        render: (r: any) => r?.status || '-',
      },
      {
        key: 'actions',
        header: '작업',
        sortable: false,
        render: (r: any) => (
          <div className="flex gap-1">
            {r?.status === 'pending' ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyId === r.id}
                  onClick={() => approve(r.id)}
                >
                  승인
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyId === r.id}
                  onClick={() => setRejectId(r.id)}
                >
                  거절
                </Button>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">-</span>
            )}
          </div>
        ),
      },
    ],
    [busyId]
  )

  return (
    <div className="relative">
      <DataTable
        data={requests}
        rowKey="id"
        emptyMessage="표시할 요청이 없습니다."
        stickyHeader
        columns={columns as any}
      />

      {rejectId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-4">
            <h3 className="text-lg font-semibold mb-2">거절 사유</h3>
            <p className="text-sm text-muted-foreground mb-2">
              선택 사항이며, 후속 대응에 사용됩니다.
            </p>
            <textarea
              className="w-full min-h-[100px] border rounded p-2 mb-3"
              placeholder="거절 사유를 입력하세요"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectId(null)}>
                취소
              </Button>
              <Button onClick={submitReject} disabled={busyId === rejectId}>
                확인
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
