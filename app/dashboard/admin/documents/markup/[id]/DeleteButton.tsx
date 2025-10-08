'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function DeleteMarkupButton({ id }: { id: string }) {
  const router = useRouter()
  const onDelete = async () => {
    const ok = window.confirm('해당 마크업 문서를 삭제하시겠습니까?')
    if (!ok) return
    try {
      const res = await fetch(`/api/markup-documents/${id}`, { method: 'DELETE' })
      const j = await res.json().catch(() => ({}))
      if (!res.ok || j?.error) throw new Error(j?.error || '삭제 실패')
      router.push('/dashboard/admin/documents/markup')
      router.refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : '삭제 중 오류가 발생했습니다.')
    }
  }
  return (
    <Button variant="destructive" size="compact" onClick={onDelete}>
      삭제
    </Button>
  )
}

