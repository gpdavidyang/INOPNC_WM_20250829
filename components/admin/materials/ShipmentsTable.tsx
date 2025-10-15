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
  shipment_items?: any[]
  payments?: Array<{ amount?: number | null }>
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
              <a className="underline" href={`/dashboard/admin/materials/shipments/${sp.id}`}>
                {sp.shipment_number || sp.id}
              </a>
            ),
          },
          { key: 'site', header: '현장', sortable: true, render: sp => sp.sites?.name || '-' },
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
            key: 'carrier',
            header: '배송방식',
            sortable: true,
            render: sp => (
              <CustomSelect
                defaultValue={labelFromCarrier(sp.carrier)}
                onValueChange={value => save(sp.id, value)}
                disabled={savingId === sp.id}
              >
                <CustomSelectTrigger className="w-[120px]">
                  <CustomSelectValue placeholder="선택" />
                </CustomSelectTrigger>
                <CustomSelectContent>
                  <CustomSelectItem value="택배">택배</CustomSelectItem>
                  <CustomSelectItem value="화물">화물</CustomSelectItem>
                  <CustomSelectItem value="기타">기타</CustomSelectItem>
                </CustomSelectContent>
              </CustomSelect>
            ),
          },
          {
            key: 'total_amount',
            header: '금액(KRW)',
            sortable: true,
            render: sp =>
              typeof sp.total_amount === 'number' ? sp.total_amount.toLocaleString('ko-KR') : '-',
          },
          {
            key: 'items',
            header: '항목수',
            sortable: true,
            render: sp => (sp.shipment_items || []).length,
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
              return sum ? sum.toLocaleString('ko-KR') : '-'
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
