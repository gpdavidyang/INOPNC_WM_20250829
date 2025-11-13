'use client'

import DataTable, { type Column } from '@/components/admin/DataTable'

type ShipmentItem = {
  id: string
  quantity?: number
  materials?: {
    name?: string | null
    code?: string | null
    unit?: string | null
  } | null
}

interface ShipmentItemsClientTableProps {
  items: ShipmentItem[]
}

export default function ShipmentItemsClientTable({ items }: ShipmentItemsClientTableProps) {
  const columns: Column<ShipmentItem>[] = [
    {
      key: 'name',
      header: '자재',
      sortable: true,
      render: item => (
        <span className="font-medium text-foreground">{item.materials?.name || '-'}</span>
      ),
    },
    {
      key: 'code',
      header: '코드',
      sortable: true,
      render: item => item.materials?.code || '-',
    },
    {
      key: 'quantity',
      header: '수량',
      sortable: true,
      align: 'right',
      render: item => item.quantity ?? 0,
    },
    {
      key: 'unit',
      header: '단위',
      sortable: true,
      render: item => item.materials?.unit || '-',
    },
  ]

  return <DataTable<ShipmentItem> data={items} rowKey="id" stickyHeader columns={columns} />
}
