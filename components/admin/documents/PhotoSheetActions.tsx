'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function PhotoSheetActions({ id }: { id: string }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('이 사진대지를 삭제하시겠습니까? 삭제 후 되돌릴 수 없습니다.')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/photo-sheets/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        cache: 'no-store',
        credentials: 'include',
      })
      if (!res.ok) {
        const msg = await res.text().catch(() => '')
        throw new Error(msg || '삭제에 실패했습니다')
      }
      try {
        // Reload to reflect deletion in server-rendered list
        window.location.reload()
      } catch {
        router.refresh()
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : '삭제에 실패했습니다')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="compact"
        onClick={() => {
          router.push(
            `/dashboard/admin/tools/photo-grid?sheet_id=${encodeURIComponent(id)}&tab=upload`
          )
        }}
      >
        수정
      </Button>
      <Button
        variant="outline"
        size="compact"
        onClick={() =>
          router.push(
            `/dashboard/admin/tools/photo-grid/preview/live?sheet_id=${encodeURIComponent(id)}`
          )
        }
      >
        미리보기
      </Button>
      <Button
        variant="destructive"
        size="compact"
        onClick={() => void handleDelete()}
        disabled={deleting}
        aria-label="사진대지 삭제"
        title="삭제"
      >
        {deleting ? '삭제 중…' : '삭제'}
      </Button>
    </div>
  )
}
