'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/components/ui/use-confirm'
import { useToast } from '@/components/ui/use-toast'

interface Props {
  siteId: string
}

export default function SiteDetailActions({ siteId }: Props) {
  const router = useRouter()
  const { confirm } = useConfirm()
  const { toast } = useToast()
  const [busy, setBusy] = useState(false)

  const goEdit = useCallback(() => {
    // Switch to edit tab via query param
    const url = `/dashboard/admin/sites/${siteId}?tab=edit`
    router.push(url)
  }, [router, siteId])

  // 상태 변경 UI 제거 (요청에 따라 비활성화)

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
      let payload: any = {}
      try {
        payload = await res.clone().json()
      } catch (error) {
        /* ignore */
      }

      if (res.status === 409) {
        toast({
          title: '삭제할 수 없습니다.',
          description:
            payload?.error ||
            '현장에 연결된 작업일지나 자료가 있습니다. 관련 데이터를 정리하거나 상태를 완료로 변경한 뒤 다시 시도하세요.',
          variant: 'warning',
        })
        return
      }

      if (!res.ok || payload?.success === false) {
        throw new Error(payload?.error || `삭제 실패 (코드 ${res.status})`)
      }
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
      <Button variant="danger" size="standard" onClick={deleteSite} disabled={busy}>
        삭제
      </Button>
    </div>
  )
}
// 상태 변경 라벨/드롭다운 제거로 매핑도 함께 제거
