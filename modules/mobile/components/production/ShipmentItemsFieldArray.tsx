'use client'

import { useEffect, useMemo, useState } from 'react'
import { SelectField, type OptionItem } from '@/modules/mobile/components/production/SelectField'
import { dispatchShipmentTotal } from '@/modules/mobile/components/production/shipment-events'
import type { ShipmentItemInput } from '@/modules/mobile/utils/shipping-form'

type ShipmentItemDefaults = Partial<ShipmentItemInput>

type Row = {
  id: string
  defaults?: ShipmentItemDefaults
}

const DEFAULT_UNIT_PRICE = 38000

const createRow = (defaults?: ShipmentItemDefaults): Row => ({
  id:
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2),
  defaults,
})

export default function ShipmentItemsFieldArray({
  materialOptions,
  defaultItems = [],
}: {
  materialOptions: OptionItem[]
  defaultItems?: ShipmentItemDefaults[]
}) {
  const initialRows = useMemo<Row[]>(() => {
    if (!defaultItems || defaultItems.length === 0) {
      return [createRow()]
    }
    return defaultItems.map(item => createRow(item))
  }, [defaultItems])

  const [rows, setRows] = useState<Row[]>(initialRows)
  const [itemValues, setItemValues] = useState<
    Record<string, { quantity: string; unitPrice: string }>
  >(() => {
    const map: Record<string, { quantity: string; unitPrice: string }> = {}
    initialRows.forEach(row => {
      const qty = Number(row.defaults?.quantity || 0)
      const unitPrice =
        typeof row.defaults?.unit_price === 'number' ? row.defaults.unit_price : null
      map[row.id] = {
        quantity: qty > 0 ? String(qty) : '',
        unitPrice:
          unitPrice != null
            ? String(unitPrice)
            : row.defaults
              ? '' // keep empty when defaults explicitly provided without unit_price
              : String(DEFAULT_UNIT_PRICE),
      }
    })
    if (initialRows.length === 0) {
      // fallback, but initialRows always has at least one entry
      const rowId = createRow().id
      map[rowId] = { quantity: '', unitPrice: String(DEFAULT_UNIT_PRICE) }
    }
    // Ensure rows with no defaults also get the default unit price
    initialRows.forEach(row => {
      if (!map[row.id]) {
        map[row.id] = { quantity: '', unitPrice: String(DEFAULT_UNIT_PRICE) }
      }
    })
    return map
  })

  const totalAmount = useMemo(() => {
    return Object.values(itemValues).reduce((sum, item) => {
      const quantity = Number(item.quantity || 0)
      const unitPrice = Number(item.unitPrice || 0)
      if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice)) return sum
      return sum + quantity * unitPrice
    }, 0)
  }, [itemValues])

  useEffect(() => {
    dispatchShipmentTotal(totalAmount)
  }, [totalAmount])

  const updateItemValue = (rowId: string, field: 'quantity' | 'unitPrice', value: string) => {
    setItemValues(prev => {
      const next = { ...prev }
      const existing = next[rowId] || { quantity: '', unitPrice: '' }
      next[rowId] = {
        ...existing,
        [field]: value,
      }
      return next
    })
  }

  const addRow = () => setRows(prev => [...prev, createRow()])
  const removeRow = (index: number) => {
    if (rows.length === 1) return
    const rowId = rows[index]?.id
    setRows(prev => prev.filter((_, i) => i !== index))
    if (rowId) {
      setItemValues(prev => {
        if (!prev[rowId]) return prev
        const next = { ...prev }
        delete next[rowId]
        return next
      })
    }
  }

  useEffect(() => {
    // When a new row is added without defaults, seed default unit price
    setItemValues(prev => {
      const next = { ...prev }
      rows.forEach(row => {
        if (!next[row.id]) {
          next[row.id] = { quantity: '', unitPrice: String(DEFAULT_UNIT_PRICE) }
        }
      })
      return next
    })
  }, [rows])

  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <div key={row.id} className="rounded-lg border p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-muted-foreground">품목 #{index + 1}</div>
            {rows.length > 1 && (
              <button
                type="button"
                className="text-xs text-red-600"
                onClick={() => removeRow(index)}
              >
                삭제
              </button>
            )}
          </div>
          <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr] gap-3 items-end">
            <div className="min-w-0">
              <label className="block text-sm text-muted-foreground mb-1">
                자재<span className="req-mark"> *</span>
              </label>
              <SelectField
                name={`items[${index}][material_id]`}
                labelFieldName={`items[${index}][material_label]`}
                required
                placeholder="자재 선택"
                options={materialOptions}
                defaultValue={row.defaults?.material_id || ''}
              />
            </div>
            <div className="min-w-0">
              <label className="block text-sm text-muted-foreground mb-1">
                출고수량<span className="req-mark"> *</span>
              </label>
              <input
                className="w-full rounded-lg border px-3 py-2"
                type="number"
                name={`items[${index}][quantity]`}
                min="0"
                step="1"
                required
                placeholder="0"
                value={itemValues[row.id]?.quantity ?? ''}
                onChange={event => updateItemValue(row.id, 'quantity', event.target.value)}
              />
            </div>
            <div className="min-w-0">
              <label className="block text-sm text-muted-foreground mb-1">단가</label>
              <input
                className="w-full rounded-lg border px-3 py-2"
                type="number"
                name={`items[${index}][unit_price]`}
                min="0"
                step="1"
                placeholder="0"
                value={itemValues[row.id]?.unitPrice ?? ''}
                onChange={event => updateItemValue(row.id, 'unitPrice', event.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">메모</label>
            <textarea
              className="w-full rounded-lg border px-3 py-2"
              name={`items[${index}][notes]`}
              rows={2}
              placeholder="품목 메모를 입력하세요."
              defaultValue={row.defaults?.notes || ''}
            />
          </div>
        </div>
      ))}
      <button type="button" className="w-full rounded-lg border px-3 py-2" onClick={addRow}>
        품목 추가
      </button>
    </div>
  )
}
