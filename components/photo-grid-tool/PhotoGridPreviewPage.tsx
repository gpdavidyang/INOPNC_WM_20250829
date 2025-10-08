'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

interface PhotoGridImage {
  id: string
  photo_url: string
  photo_type: 'before' | 'after'
  photo_order: number
}

interface PhotoGridDetail {
  id: string
  site?: { id: string; name: string } | null
  creator?: { id: string; full_name?: string | null } | null
  component_name?: string | null
  work_process?: string | null
  work_section?: string | null
  work_date?: string | null
  images?: PhotoGridImage[]
}

export default function PhotoGridPreviewPage({ photoGridId }: { photoGridId: string }) {
  const [detail, setDetail] = useState<PhotoGridDetail | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/photo-grids/${photoGridId}`, { cache: 'no-store' })
        const json = await res.json().catch(() => null)
        if (mounted) setDetail(json?.data || null)
      } catch {
        if (mounted) setDetail(null)
      } finally {
        setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [photoGridId])

  const beforePhotos = (detail?.images || [])
    .filter(img => img.photo_type === 'before')
    .sort((a, b) => a.photo_order - b.photo_order)
  const afterPhotos = (detail?.images || [])
    .filter(img => img.photo_type === 'after')
    .sort((a, b) => a.photo_order - b.photo_order)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">사진대지 미리보기</div>
          <div className="text-sm text-muted-foreground">
            {detail?.site?.name || '-'} •{' '}
            {detail?.work_date ? new Date(detail.work_date).toLocaleDateString('ko-KR') : '-'}
          </div>
        </div>
        {detail && (
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="standard">
              <a href={`/api/photo-grids/${detail.id}/download`} target="_blank" rel="noreferrer">
                다운로드/인쇄
              </a>
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        {loading ? (
          <div className="text-center text-sm text-muted-foreground py-10">로딩 중...</div>
        ) : !detail ? (
          <div className="text-center text-sm text-muted-foreground py-10">
            정보를 불러올 수 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Info */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              <div>
                <div className="text-muted-foreground">부재명</div>
                <div className="font-medium text-foreground">{detail.component_name || '-'}</div>
              </div>
              <div>
                <div className="text-muted-foreground">작업공정</div>
                <div className="font-medium text-foreground">{detail.work_process || '-'}</div>
              </div>
              <div>
                <div className="text-muted-foreground">작업구간</div>
                <div className="font-medium text-foreground">{detail.work_section || '-'}</div>
              </div>
              <div>
                <div className="text-muted-foreground">작성자</div>
                <div className="font-medium text-foreground">
                  {detail.creator?.full_name || '-'}
                </div>
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-semibold mb-2">작업 전</div>
                <div className="grid grid-cols-3 gap-2">
                  {beforePhotos.length === 0 ? (
                    <div className="col-span-3 text-sm text-muted-foreground">사진 없음</div>
                  ) : (
                    beforePhotos.map((p, idx) => (
                      <div key={p.id || idx} className="rounded border overflow-hidden">
                        <img
                          src={p.photo_url}
                          alt={`작업 전 ${idx + 1}`}
                          className="w-full h-32 object-cover"
                        />
                        <div className="px-2 py-1 text-xs text-muted-foreground">#{idx + 1}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold mb-2">작업 후</div>
                <div className="grid grid-cols-3 gap-2">
                  {afterPhotos.length === 0 ? (
                    <div className="col-span-3 text-sm text-muted-foreground">사진 없음</div>
                  ) : (
                    afterPhotos.map((p, idx) => (
                      <div key={p.id || idx} className="rounded border overflow-hidden">
                        <img
                          src={p.photo_url}
                          alt={`작업 후 ${idx + 1}`}
                          className="w-full h-32 object-cover"
                        />
                        <div className="px-2 py-1 text-xs text-muted-foreground">#{idx + 1}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
