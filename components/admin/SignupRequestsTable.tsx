'use client'

import AdminActionButtons from '@/components/admin/AdminActionButtons'
import { DataTable } from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useMemo, useState } from 'react'

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

  const ROLE_KO: Record<string, string> = {
    admin: '관리자',
    partner: '협력업체',
    driver: '운송기사',
    manager: '현장관리자',
  }

  const columns = useMemo(
    () => [
      {
        key: 'requested_at',
        header: '요청일',
        sortable: true,
        accessor: (r: any) => (r?.requested_at ? new Date(r.requested_at).getTime() : 0),
        render: (r: any) => (
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-700">
              {r?.requested_at ? new Date(r.requested_at).toLocaleDateString('ko-KR') : '-'}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {r?.requested_at
                ? new Date(r.requested_at).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : ''}
            </span>
          </div>
        ),
      },
      {
        key: 'full_name',
        header: '신청자 정보',
        sortable: true,
        accessor: (r: any) => r?.full_name || '',
        render: (r: any) => (
          <div className="flex flex-col">
            <span className="text-sm font-black text-[#1A254F]">{r?.full_name || '-'}</span>
            <span className="text-xs text-slate-400 font-medium">{r?.email || '-'}</span>
          </div>
        ),
      },
      {
        key: 'company',
        header: '소속사',
        sortable: true,
        accessor: (r: any) => r?.company || r?.company_name || '',
        render: (r: any) => (
          <span className="text-xs font-bold text-slate-600">
            {r?.company || r?.company_name || '-'}
          </span>
        ),
      },
      {
        key: 'requested_role',
        header: '요청 역할',
        sortable: true,
        accessor: (r: any) => r?.requested_role || '',
        render: (r: any) => (
          <Badge
            variant="outline"
            className="border-indigo-100 bg-indigo-50/30 text-indigo-600 font-bold text-[10px] h-5"
          >
            {ROLE_KO[String(r?.requested_role || '').toLowerCase()] || r?.requested_role || '-'}
          </Badge>
        ),
      },
      {
        key: 'status',
        header: '상태',
        sortable: true,
        accessor: (r: any) => r?.status || '',
        render: (r: any) => {
          const s = String(r?.status || '').toLowerCase()
          if (s === 'pending')
            return (
              <Badge
                variant="warning"
                className="bg-amber-50 text-amber-600 border-amber-100 font-bold text-[10px] h-5 gap-1"
              >
                <Clock className="w-2.5 h-2.5" />
                대기
              </Badge>
            )
          if (s === 'approved')
            return (
              <Badge
                variant="success"
                className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold text-[10px] h-5 gap-1"
              >
                <CheckCircle2 className="w-2.5 h-2.5" />
                승인
              </Badge>
            )
          if (s === 'rejected')
            return (
              <Badge
                variant="error"
                className="bg-rose-50 text-rose-600 border-rose-100 font-bold text-[10px] h-5 gap-1"
              >
                <XCircle className="w-2.5 h-2.5" />
                거절
              </Badge>
            )
          return <span className="text-xs text-slate-400">-</span>
        },
      },
      {
        key: 'actions',
        header: '관리',
        sortable: false,
        render: (r: any) => (
          <div className="flex items-center gap-1.5 justify-end">
            <Button
              size="sm"
              variant="outline"
              className="h-8 rounded-lg border-slate-200 text-xs font-bold hover:bg-slate-50 px-3"
              onClick={() => router.push(`/dashboard/admin/signup-requests/${r.id}`)}
            >
              상세
            </Button>
            {['pending', 'rejected'].includes(String(r?.status || '').toLowerCase()) && (
              <>
                <Button
                  size="sm"
                  className="h-8 rounded-lg bg-[#1A254F] hover:bg-[#2A355F] text-white text-xs font-bold px-3 shadow-sm"
                  disabled={busyId === r.id}
                  onClick={() => approve(r.id)}
                >
                  승인
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-lg border-rose-100 bg-rose-50/50 text-rose-600 hover:bg-rose-100 hover:border-rose-200 text-xs font-bold px-3 transition-all shadow-sm shadow-rose-100/20"
                  disabled={busyId === r.id}
                  onClick={() => setRejectId(r.id)}
                >
                  거절
                </Button>
                <AdminActionButtons
                  size="compact"
                  deleteHref={`/api/admin/signup-requests/${r.id}`}
                  deleteConfirmMessage="해당 가입 요청을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
                  className="ml-1"
                  onDeleted={() => onDeleted(r.id)}
                />
              </>
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
        emptyMessage="표시할 가입 신청 내역이 없습니다."
        stickyHeader
        columns={columns as any}
      />

      {rejectId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-100 scale-in-center">
            <div className="p-8 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#1A254F] tracking-tight">가입 거절</h3>
                  <p className="text-xs font-medium text-slate-400">
                    요청을 거절하는 사유를 입력해주세요.
                  </p>
                </div>
              </div>

              <textarea
                className="w-full min-h-[120px] bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium placeholder:text-slate-300 focus:ring-2 focus:ring-rose-500/20 transition-all resize-none"
                placeholder="관련 사유를 입력하세요 (선택 사항)"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
              />

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1 h-11 rounded-xl font-bold bg-slate-100 hover:bg-slate-200"
                  onClick={() => setRejectId(null)}
                >
                  취소
                </Button>
                <Button
                  className="flex-1 h-11 rounded-xl font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-100"
                  onClick={submitReject}
                  disabled={busyId === rejectId}
                >
                  거절 확인
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
