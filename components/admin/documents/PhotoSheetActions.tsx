'use client'

import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

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
    <div className="flex items-center justify-end gap-1.5">
      <Button
        variant="secondary"
        size="xs"
        className="h-8 px-3 rounded-lg font-bold whitespace-nowrap"
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
        size="xs"
        className="h-8 px-3 rounded-lg font-bold border-gray-200 text-gray-700 hover:bg-gray-50 whitespace-nowrap"
        onClick={() =>
          router.push(
            `/dashboard/admin/tools/photo-grid/preview/live?sheet_id=${encodeURIComponent(id)}`
          )
        }
      >
        미리보기
      </Button>
      <Button
        variant="ghost"
        size="xs"
        className="h-8 px-3 rounded-lg font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-300 whitespace-nowrap"
        onClick={() => void handleDelete()}
        disabled={deleting}
      >
        {deleting ? '삭제 중…' : '삭제'}
      </Button>
    </div>
  )
}
