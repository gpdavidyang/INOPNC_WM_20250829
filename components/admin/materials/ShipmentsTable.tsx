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
  shipment_items?: any[]
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
          { key: 'status', header: '상태', sortable: true, render: sp => sp.status || '-' },
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
            key: 'items',
            header: '항목수',
            sortable: true,
            render: sp => (sp.shipment_items || []).length,
          },
        ] as Column<Shipment>[]
      }
    />
  )
}
