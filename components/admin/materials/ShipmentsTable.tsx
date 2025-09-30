'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>출고번호</TableHead>
          <TableHead>현장</TableHead>
          <TableHead>상태</TableHead>
          <TableHead>출고일</TableHead>
          <TableHead>배송방식</TableHead>
          <TableHead>항목수</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {shipments.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-10">
              표시할 출고가 없습니다.
            </TableCell>
          </TableRow>
        ) : (
          shipments.map(sp => (
            <TableRow key={sp.id}>
              <TableCell className="font-medium text-foreground">
                <a className="underline" href={`/dashboard/admin/materials/shipments/${sp.id}`}>
                  {sp.shipment_number || sp.id}
                </a>
              </TableCell>
              <TableCell>{sp.sites?.name || '-'}</TableCell>
              <TableCell>{sp.status || '-'}</TableCell>
              <TableCell>
                {sp.shipment_date ? new Date(sp.shipment_date).toLocaleDateString('ko-KR') : '-'}
              </TableCell>
              <TableCell>
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
              </TableCell>
              <TableCell>{(sp.shipment_items || []).length}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
