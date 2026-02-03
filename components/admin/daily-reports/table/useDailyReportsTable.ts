'use client'

import { useConfirm } from '@/components/ui/use-confirm'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'

export function useDailyReportsTable(reports: any[]) {
  const router = useRouter()
  const sp = useSearchParams()
  const { confirm } = useConfirm()
  const [isPending, startTransition] = useTransition()

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [approvalLoadingId, setApprovalLoadingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  const reportIds = useMemo(() => reports.map(r => String(r.id)), [reports])

  const handleStatusChange = async (
    reportId: string,
    action: 'approve' | 'revert' | 'reject',
    reason?: string
  ) => {
    setApprovalLoadingId(reportId)
    try {
      const res = await fetch(`/api/admin/daily-reports/${reportId}/approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      })
      const data = await res.json()
      if (!res.ok || !data?.success) throw new Error(data?.error || '실패')

      setRejectingId(null)
      setRejectionReason('')
      startTransition(() => router.refresh())
      toast.success('상태가 변경되었습니다.')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setApprovalLoadingId(null)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    const ok = await confirm({
      title: '삭제 확인',
      description: `${selectedIds.length}건을 삭제하시겠습니까?`,
      confirmText: '삭제',
      variant: 'destructive',
    })
    if (!ok) return

    setIsDeleting(true)
    try {
      const res = await fetch('/api/admin/daily-reports/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportIds: selectedIds }),
      })
      if (!res.ok) throw new Error('삭제 실패')
      setSelectedIds([])
      startTransition(() => router.refresh())
      toast.success('삭제되었습니다.')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setIsDeleting(false)
    }
  }

  return {
    state: {
      selectedIds,
      isDeleting,
      approvalLoadingId,
      rejectingId,
      rejectionReason,
      isPending,
      reportIds,
    },
    actions: {
      setSelectedIds,
      setRejectingId,
      setRejectionReason,
      handleStatusChange,
      handleBulkDelete,
      startTransition,
    },
  }
}
