'use client'

import React, { useEffect, useState } from 'react'

type RequestItem = {
  material_id: string
  material_name: string
  material_code?: string | null
  unit?: string | null
  requested_quantity: number
  notes?: string | null
}

type RequestDetail = {
  id: string
  request_number: string
  created_at: string
  site_id: string
  site_name: string
  notes?: string | null
  items: RequestItem[]
}

interface RequestDetailSheetProps {
  open: boolean
  requestId?: string | null
  onClose: () => void
}

export const RequestDetailSheet: React.FC<RequestDetailSheetProps> = ({
  open,
  requestId,
  onClose,
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detail, setDetail] = useState<RequestDetail | null>(null)

  useEffect(() => {
    const fetchDetail = async () => {
      if (!open || !requestId) return
      setLoading(true)
      setError(null)
      setDetail(null)
      try {
        const res = await fetch(`/api/materials/requests/${requestId}`)
        const json = await res.json().catch(() => ({}))
        if (!res.ok || !json?.success) throw new Error(json?.error || '요청 상세 조회 실패')
        setDetail(json.data as RequestDetail)
      } catch (e: any) {
        setError(e?.message || '요청 상세 조회 실패')
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [open, requestId])

  if (!open) return null

  const handleClose = () => onClose()

  const dateText = detail?.created_at
    ? new Date(detail.created_at).toLocaleDateString('ko-KR')
    : '-'
  const totalQty = (detail?.items || []).reduce(
    (a, it) => a + (Number(it.requested_quantity) || 0),
    0
  )
  const itemCount = detail?.items?.length || 0

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[1100]" onClick={handleClose} />
      <div className="fixed bottom-0 left-0 right-0 z-[1101] bg-white rounded-t-2xl shadow-xl">
        {/* Drag handle */}
        <div className="flex justify-center py-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>
        {/* Header */}
        <div className="px-5 pb-3 border-b">
          <div className="flex items-start justify-between">
            <div className="min-w-0 pr-3">
              <div className="text-xl font-bold truncate text-gray-900">
                {detail?.site_name || '-'}
              </div>
              <div className="mt-1 flex items-center gap-2 text-base text-muted-foreground">
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-sm text-gray-700">
                  {dateText}
                </span>
                <span className="truncate">요청번호 {detail?.request_number || requestId}</span>
              </div>
            </div>
            <button onClick={handleClose} className="close-btn">
              닫기
            </button>
          </div>
          {/* Summary chips */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg border bg-gray-50 px-3 py-2.5 text-center">
              <div className="text-sm text-gray-500">총 수량</div>
              <div className="text-2xl font-bold text-gray-900">{totalQty}</div>
            </div>
            <div className="rounded-lg border bg-gray-50 px-3 py-2.5 text-center">
              <div className="text-sm text-gray-500">품목 수</div>
              <div className="text-2xl font-bold text-gray-900">{itemCount}</div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="max-h-[65vh] overflow-y-auto px-5 py-4">
          {loading && <div className="text-sm text-muted-foreground">불러오는 중...</div>}
          {error && <div className="text-sm text-red-600">{error}</div>}
          {!loading && !error && detail && (
            <div className="space-y-4">
              {detail.notes && (
                <div className="text-sm">
                  <span className="text-muted-foreground">메모</span>:{' '}
                  <span className="font-medium">{detail.notes}</span>
                </div>
              )}
              <div>
                <div className="text-base text-muted-foreground mb-2">자재 내역</div>
                <div className="space-y-2">
                  {detail.items.length === 0 ? (
                    <div className="text-sm text-muted-foreground">자재 항목이 없습니다.</div>
                  ) : (
                    detail.items.map((it, idx) => (
                      <div
                        key={`${it.material_id}-${idx}`}
                        className="flex items-center justify-between rounded-lg border px-3 py-2.5 bg-white"
                      >
                        <div className="min-w-0 pr-3">
                          <div className="text-base font-semibold truncate text-gray-900">
                            {it.material_name || '-'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {[it.material_code, it.unit].filter(Boolean).join(' · ')}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-3 py-1.5 text-sm font-semibold">
                            {it.requested_quantity}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default RequestDetailSheet
