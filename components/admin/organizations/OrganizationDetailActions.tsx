'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/components/ui/use-confirm'
import { useToast } from '@/components/ui/use-toast'

interface Props {
  id: string
}

export default function OrganizationDetailActions({ id }: Props) {
  const router = useRouter()
  const { confirm } = useConfirm()
  const { toast } = useToast()
  const [deleting, setDeleting] = useState(false)

  const onDelete = async () => {
    const ok = await confirm({
      title: '삭제 확인',
      description: '해당 소속(시공사)을 삭제할까요? 이 작업은 되돌릴 수 없습니다.',
      confirmText: '삭제',
      cancelText: '취소',
      variant: 'destructive',
    })
    if (!ok) return

    try {
      setDeleting(true)
      const res = await fetch(`/api/admin/organizations/${id}`, { method: 'DELETE' })
      const j = await res.json().catch(() => ({}))
      if (!res.ok || j?.success === false) throw new Error(j?.error || '삭제 실패')
      toast({
        title: '삭제 완료',
        description: '소속(시공사)이 삭제되었습니다.',
        variant: 'success',
      })
      router.push('/dashboard/admin/organizations')
    } catch (e: any) {
      toast({
        title: '오류',
        description: e?.message || '삭제 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="outline">
        <Link href={`/dashboard/admin/organizations/${id}/edit`}>수정</Link>
      </Button>
      <Button variant="destructive" onClick={onDelete} disabled={deleting}>
        {deleting ? '삭제 중…' : '삭제'}
      </Button>
    </div>
  )
}
