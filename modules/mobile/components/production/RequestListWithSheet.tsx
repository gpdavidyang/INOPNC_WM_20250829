'use client'

import React, { useState, useMemo } from 'react'
import RequestDetailSheet from '@/modules/mobile/components/production/RequestDetailSheet'

type Req = {
  id: string
  site_id: string
  request_number?: string | null
  created_at: string
  notes?: string | null
}

interface Props {
  list: Req[]
  siteNameMap: Record<string, string>
  qtyMap: Record<string, number>
  itemMatIdsByReq: Record<string, string[]>
  materialNameMap: Record<string, string>
  emptyText?: string
}

export default function RequestListWithSheet({
  list,
  siteNameMap,
  qtyMap,
  itemMatIdsByReq,
  materialNameMap,
  emptyText = '요청이 없습니다.',
}: Props) {
  const [open, setOpen] = useState(false)
  const [currentId, setCurrentId] = useState<string | null>(null)

  const handleOpen = (id: string) => {
    setCurrentId(id)
    setOpen(true)
  }

  const cards = useMemo(() => {
    if (!Array.isArray(list) || list.length === 0) return null
    return list.map(rq => {
      const qty = qtyMap[rq.id] || 0
      const displayDate = rq.created_at || ''
      const dateText = displayDate ? new Date(displayDate).toLocaleDateString('ko-KR') : '-'
      const siteText = siteNameMap[rq.site_id] || '-'
      const matIds = itemMatIdsByReq[rq.id] || []
      const matNames = matIds.map(mid => materialNameMap[mid] || '').filter(Boolean)
      const matSummary =
        matNames.length === 0
          ? '-'
          : matNames.length === 1
            ? matNames[0]
            : `${matNames[0]} 외 ${matNames.length - 1}건`

      return (
        <div
          key={rq.id}
          onClick={() => handleOpen(rq.id)}
          className="rounded-lg border p-4 bg-white cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="min-w-0 pr-3">
              <div className="text-base font-semibold truncate">{siteText}</div>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                  {dateText}
                </span>
                <span className="truncate">요청번호 {rq.request_number || rq.id.slice(-6)}</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-xs text-muted-foreground">총 수량</div>
              <div className="text-xl font-bold leading-none">{qty}</div>
            </div>
          </div>
          <div className="mt-2 text-sm">
            <span className="text-muted-foreground">자재</span>:{' '}
            <span className="font-medium">{matSummary}</span>
          </div>
          {rq.notes && <div className="mt-2 text-xs text-muted-foreground">메모: {rq.notes}</div>}
        </div>
      )
    })
  }, [list, siteNameMap, qtyMap, itemMatIdsByReq, materialNameMap])

  return (
    <>
      {!list || list.length === 0 ? (
        <div className="text-sm text-muted-foreground">{emptyText}</div>
      ) : (
        <div className="space-y-3">{cards}</div>
      )}
      <RequestDetailSheet open={open} requestId={currentId} onClose={() => setOpen(false)} />
    </>
  )
}
