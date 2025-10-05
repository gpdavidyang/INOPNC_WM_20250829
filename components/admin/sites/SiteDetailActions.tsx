'use client'

import { useCallback, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { useConfirm } from '@/components/ui/use-confirm'
import { useToast } from '@/components/ui/use-toast'
import type { SiteStatus } from '@/types'

interface Props {
  siteId: string
  currentStatus?: SiteStatus | null
}

export default function SiteDetailActions({ siteId, currentStatus }: Props) {
  const router = useRouter()
  const { confirm } = useConfirm()
  const { toast } = useToast()
  const [busy, setBusy] = useState(false)

  const goEdit = useCallback(() => {
    // Switch to edit tab via query param
    const url = `/dashboard/admin/sites/${siteId}?tab=edit`
    router.push(url)
  }, [router, siteId])

  const changeStatus = useCallback(
    async (status: SiteStatus) => {
      setBusy(true)
      try {
        const res = await fetch(`/api/admin/sites/${siteId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        })
        const j = await res.json().catch(() => ({}))
        if (!res.ok || !j?.success) throw new Error(j?.error || '상태 변경 실패')
        toast({
          title: '상태 변경 완료',
          description: `현장 상태가 '${status}'로 변경되었습니다.`,
          variant: 'success',
        })
        router.refresh()
      } catch (e: any) {
        toast({
          title: '오류',
          description: e?.message || '상태 변경에 실패했습니다.',
          variant: 'destructive',
        })
      } finally {
        setBusy(false)
      }
    },
    [router, siteId, toast]
  )

  const deleteSite = useCallback(async () => {
    const ok = await confirm({
      title: '현장 삭제',
      description: '이 작업은 되돌릴 수 없습니다. 삭제할까요?',
      variant: 'destructive',
      confirmText: '삭제',
      cancelText: '취소',
    })
    if (!ok) return

    setBusy(true)
    try {
      const res = await fetch(`/api/admin/sites/${siteId}`, { method: 'DELETE' })
      const j = await res.json().catch(() => ({}))
      if (!res.ok || !j?.success) throw new Error(j?.error || '삭제 실패')
      toast({ title: '삭제 완료', description: '현장이 삭제되었습니다.', variant: 'success' })
      router.push('/dashboard/admin/sites')
    } catch (e: any) {
      toast({
        title: '오류',
        description: e?.message || '삭제에 실패했습니다.',
        variant: 'destructive',
      })
    } finally {
      setBusy(false)
    }
  }, [router, siteId, confirm, toast])

  return (
    <div className="flex items-center gap-3">
      <Button variant="outline" size="standard" onClick={goEdit} disabled={busy}>
        정보 수정
      </Button>
      <DropdownMenu
        trigger={
          <Button variant="secondary" size="standard" disabled={busy}>
            상태 변경
            {currentStatus ? ` (${STATUS_KO[String(currentStatus)] || String(currentStatus)})` : ''}
          </Button>
        }
        align="end"
      >
        <DropdownMenuItem onClick={() => changeStatus('active')}>진행 중</DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeStatus('inactive')}>중단</DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeStatus('completed')}>완료</DropdownMenuItem>
      </DropdownMenu>
      <Button variant="danger" size="standard" onClick={deleteSite} disabled={busy}>
        삭제
      </Button>
    </div>
  )
}
const STATUS_KO: Record<string, string> = {
  active: '진행 중',
  inactive: '중단',
  completed: '완료',
}
