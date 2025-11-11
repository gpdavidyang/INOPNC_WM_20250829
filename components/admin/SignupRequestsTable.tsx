'use client'

import React, { useMemo, useState } from 'react'
import { DataTable } from '@/components/admin/DataTable'
import { Button } from '@/components/ui/button'
import AdminActionButtons from '@/components/admin/AdminActionButtons'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'

export default function SignupRequestsTable({ requests }: { requests: any[] }) {
  const router = useRouter()
  const { toast } = useToast()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [rows, setRows] = useState<any[]>(requests || [])
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set())

  // Keep local rows in sync when server data changes
  React.useEffect(() => {
    const next = (requests || []).filter(r => !hiddenIds.has(String(r.id)))
    setRows(next)
  }, [requests, hiddenIds])

  const approve = async (id: string) => {
    // 일부 요청은 승인 전에 소속사/현장 선택이 필요합니다.
    // 테이블에서 즉시 승인 시도 대신 상세 화면으로 이동해 필수 값을 받습니다.
    router.push(`/dashboard/admin/signup-requests/${id}`)
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
      // Optimistic UI update
      setRows(prev => prev.map(r => (r.id === rejectId ? { ...r, status: 'rejected' } : r)))
      router.refresh()
    } catch (e: any) {
      toast({ title: '오류', description: e?.message, variant: 'destructive' })
    } finally {
      setBusyId(null)
    }
  }

  // Deletion is now handled by AdminActionButtons; we keep a callback to update local UI optimistically
  const onDeleted = (id: string) => {
    toast({ title: '삭제 완료', description: '요청이 삭제되었습니다.', variant: 'success' })
    setHiddenIds(prev => new Set([...Array.from(prev), String(id)]))
    setRows(prev => prev.filter(r => r.id !== id))
    router.refresh()
    setTimeout(() => {
      try {
        if (typeof window !== 'undefined') window.location.reload()
      } catch (err) {
        console.warn('Force reload fallback failed:', err)
      }
    }, 600)
  }

  const STATUS_KO: Record<string, string> = {
    pending: '대기',
    approved: '승인',
    rejected: '거절',
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
        header: '소속사',
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
        render: (r: any) => STATUS_KO[String(r?.status || '').toLowerCase()] || '-',
      },
      {
        key: 'actions',
        header: '작업',
        sortable: false,
        className: 'min-w-[320px]',
        render: (r: any) => (
          <div className="flex flex-nowrap gap-1 overflow-x-auto [&>*]:shrink-0">
            <AdminActionButtons
              size="compact"
              detailHref={`/dashboard/admin/signup-requests/${r.id}`}
              // Only show delete for pending/rejected; guarded below with overall condition
              className="shrink-0"
            />
            {['pending', 'rejected'].includes(String(r?.status || '').toLowerCase()) ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  disabled={busyId === r.id}
                  onClick={() => approve(r.id)}
                >
                  승인
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  disabled={busyId === r.id}
                  onClick={() => setRejectId(r.id)}
                >
                  거절
                </Button>
                <AdminActionButtons
                  size="compact"
                  deleteHref={`/api/admin/signup-requests/${r.id}`}
                  deleteConfirmMessage="해당 가입 요청을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
                  className="shrink-0"
                  onDeleted={() => onDeleted(r.id)}
                />
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
        data={rows}
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
