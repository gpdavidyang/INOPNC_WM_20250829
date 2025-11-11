'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DataTable, { type Column } from '@/components/admin/DataTable'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'

type Shipment = {
  id: string
  shipment_number?: string | null
  sites?: { name?: string | null }
  status?: string | null
  shipment_date?: string | null
  carrier?: string | null
  total_amount?: number | null
  shipment_items?: Array<{
    material_id?: string
    quantity?: number
    materials?: { name?: string | null; code?: string | null; unit?: string | null }
  }>
  payments?: Array<{ amount?: number | null }>
  billing_method?: { name?: string | null }
  shipping_method?: { name?: string | null }
  freight_method?: { name?: string | null }
}

export default function ShipmentsTable({ shipments }: { shipments: Shipment[] }) {
  const [savingId, setSavingId] = useState<string | null>(null)
  const router = useRouter()

  const save = async (id: string, label: string) => {
    setSavingId(id)
    try {
      await fetch(`/api/admin/material-shipments/${id}/delivery`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: label }),
      })
      router.refresh()
    } finally {
      setSavingId(null)
    }
  }

  const labelFromCarrier = (carrier?: string | null) => {
    const raw = String(carrier || '').toLowerCase()
    if (raw === 'courier' || raw === '택배') return '택배'
    if (raw === 'freight' || raw === 'cargo' || raw === '화물') return '화물'
    if (!raw) return '기타'
    return raw
  }

  const summarizeItems = (items?: Shipment['shipment_items']) => {
    const list = Array.isArray(items) ? items : []
    if (list.length === 0) return { label: '-', count: 0, quantity: 0 }
    const primary = list[0]
    const name = primary?.materials?.name || primary?.materials?.code || '자재'
    const label =
      list.length > 1
        ? `${name} 외 ${list.length - 1}건`
        : `${name}${primary?.materials?.code ? ` (${primary.materials.code})` : ''}`
    const quantity = list.reduce((sum, item) => sum + Number(item?.quantity ?? 0), 0)
    return { label, count: list.length, quantity }
  }

  const formatCurrency = (value?: number | null) =>
    typeof value === 'number' ? value.toLocaleString('ko-KR') : '-'

  return (
    <DataTable<Shipment>
      data={shipments}
      rowKey={s => s.id}
      stickyHeader
      columns={
        [
          {
            key: 'shipment_number',
            header: '출고번호',
            sortable: true,
            render: sp => (
              <div className="flex flex-col">
                <a className="underline" href={`/dashboard/admin/materials/shipments/${sp.id}`}>
                  {sp.shipment_number || sp.id}
                </a>
                <span className="text-xs text-muted-foreground">{sp.sites?.name || '-'}</span>
              </div>
            ),
          },
          {
            key: 'items',
            header: '출고품목',
            sortable: false,
            render: sp => {
              const summary = summarizeItems(sp.shipment_items)
              return (
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">{summary.label}</span>
                  {summary.count > 0 && (
                    <span className="text-xs text-muted-foreground">
                      총 {summary.quantity.toLocaleString('ko-KR')} ea
                    </span>
                  )}
                </div>
              )
            },
          },
          {
            key: 'status',
            header: '상태',
            sortable: true,
            render: sp => (
              <CustomSelect
                defaultValue={String(sp.status || 'preparing')}
                onValueChange={async value => {
                  setSavingId(sp.id)
                  try {
                    await fetch(`/api/admin/material-shipments/${sp.id}/status`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ status: value }),
                    })
                    router.refresh()
                  } finally {
                    setSavingId(null)
                  }
                }}
                disabled={savingId === sp.id}
              >
                <CustomSelectTrigger className="w-[120px]">
                  <CustomSelectValue placeholder="상태" />
                </CustomSelectTrigger>
                <CustomSelectContent>
                  <CustomSelectItem value="preparing">준비중</CustomSelectItem>
                  <CustomSelectItem value="shipped">출고</CustomSelectItem>
                  <CustomSelectItem value="delivered">배송완료</CustomSelectItem>
                  <CustomSelectItem value="cancelled">취소</CustomSelectItem>
                </CustomSelectContent>
              </CustomSelect>
            ),
          },
          {
            key: 'shipment_date',
            header: '출고일',
            sortable: true,
            render: sp =>
              sp.shipment_date ? new Date(sp.shipment_date).toLocaleDateString('ko-KR') : '-',
          },
          {
            key: 'delivery',
            header: '배송/결제',
            sortable: false,
            render: sp => {
              const deliveryLabel = labelFromCarrier(sp.carrier)
              return (
                <div className="flex flex-col text-sm text-muted-foreground">
                  <span>{deliveryLabel}</span>
                  <span>
                    {sp.billing_method?.name
                      ? sp.billing_method.name
                      : sp.shipping_method?.name || '결제방식 미지정'}
                  </span>
                </div>
              )
            },
          },
          {
            key: 'total_amount',
            header: '금액(KRW)',
            sortable: true,
            render: sp => formatCurrency(sp.total_amount),
          },
          {
            key: 'paid',
            header: '수금(KRW)',
            sortable: true,
            render: sp => {
              const sum = (sp.payments || []).reduce(
                (acc, p: any) => acc + (Number(p?.amount) || 0),
                0
              )
              return formatCurrency(sum)
            },
          },
          {
            key: 'outstanding',
            header: '미수(KRW)',
            sortable: true,
            render: sp => {
              const total = Number(sp.total_amount || 0)
              const sum = (sp.payments || []).reduce(
                (acc, p: any) => acc + (Number(p?.amount) || 0),
                0
              )
              const out = Math.max(0, total - sum)
              return total ? out.toLocaleString('ko-KR') : '-'
            },
          },
        ] as Column<Shipment>[]
      }
    />
  )
}
