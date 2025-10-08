'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface PhotoGridImage {
  id: string
  photo_url: string
  photo_type: 'before' | 'after'
  photo_order: number
}

interface PhotoGridItem {
  id: string
  created_at: string
  site?: { id: string; name: string } | null
  component_name?: string | null
  work_process?: string | null
  work_section?: string | null
  work_date?: string | null
  images?: PhotoGridImage[]
}

export default function PhotoGridList() {
  const [items, setItems] = useState<PhotoGridItem[]>([])
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/photo-grids', { cache: 'no-store' })
        const json = await res.json().catch(() => null)
        const list = Array.isArray(json?.data) ? (json.data as PhotoGridItem[]) : []
        if (mounted) setItems(list)
      } catch {
        if (mounted) setItems([])
      } finally {
        setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('이 사진대지를 삭제하시겠습니까? 삭제 후 되돌릴 수 없습니다.')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/photo-grids/${id}`, { method: 'DELETE', cache: 'no-store' })
      if (!res.ok) {
        const msg = await res.text().catch(() => '')
        throw new Error(msg || '삭제에 실패했습니다')
      }
      setItems(prev => prev.filter(it => it.id !== id))
    } catch (e) {
      alert(e instanceof Error ? e.message : '삭제에 실패했습니다')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-left">
            <th className="px-3 py-2">생성일</th>
            <th className="px-3 py-2">현장</th>
            <th className="px-3 py-2">부재/공정/구간</th>
            <th className="px-3 py-2">전/후 사진</th>
            <th className="px-3 py-2">동작</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td className="px-3 py-6 text-center text-gray-500" colSpan={5}>
                로딩 중...
              </td>
            </tr>
          ) : items.length === 0 ? (
            <tr>
              <td className="px-3 py-6 text-center text-gray-500" colSpan={5}>
                생성된 사진대지가 없습니다.
              </td>
            </tr>
          ) : (
            items.map(item => {
              const beforeCount = (item.images || []).filter(
                img => img.photo_type === 'before'
              ).length
              const afterCount = (item.images || []).filter(
                img => img.photo_type === 'after'
              ).length
              return (
                <tr key={item.id} className="border-t">
                  <td className="px-3 py-2">
                    {item.created_at ? new Date(item.created_at).toLocaleString('ko-KR') : '-'}
                  </td>
                  <td className="px-3 py-2">{item.site?.name || '-'}</td>
                  <td className="px-3 py-2">
                    <div className="text-foreground">{item.component_name || '-'}</div>
                    <div className="text-xs text-muted-foreground">
                      {(item.work_process || '-') + ' / ' + (item.work_section || '-')}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    전 {beforeCount} / 후 {afterCount}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Button asChild variant="outline" size="compact">
                        <Link href={`/dashboard/admin/tools/photo-grids/preview/${item.id}`}>
                          미리보기
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="compact">
                        <a
                          href={`/api/photo-grids/${item.id}/download`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          다운로드
                        </a>
                      </Button>
                      <Button
                        variant="destructive"
                        size="compact"
                        onClick={() => void handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        aria-label="사진대지 삭제"
                        title="삭제"
                      >
                        {deletingId === item.id ? '삭제 중…' : '삭제'}
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
