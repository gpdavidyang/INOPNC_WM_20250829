'use client'

import { useState } from 'react'
import { SelectField, type OptionItem } from '@/modules/mobile/components/production/SelectField'

type Row = { id: string }

const createRow = (): Row => ({
  id:
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2),
})

export default function ProductionItemsFieldArray({
  materialOptions,
  showOrderQuantity = true,
  showItemMemo = true,
}: {
  materialOptions: OptionItem[]
  showOrderQuantity?: boolean
  showItemMemo?: boolean
}) {
  const [rows, setRows] = useState<Row[]>([createRow()])

  const addRow = () => setRows(prev => [...prev, createRow()])
  const removeRow = (index: number) => {
    if (rows.length === 1) return
    setRows(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">
                자재<span className="req-mark"> *</span>
              </label>
              <SelectField
                name={`items[${index}][material_id]`}
                options={materialOptions}
                required
                placeholder="자재 선택"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">생산수량 *</label>
              <input
                className="w-full rounded border px-3 py-2"
                type="number"
                name={`items[${index}][produced_quantity]`}
                min="0"
                step="1"
                required
                placeholder="0"
              />
            </div>
            {showOrderQuantity && (
              <div>
                <label className="block text-sm text-muted-foreground mb-1">주문수량</label>
                <input
                  className="w-full rounded border px-3 py-2"
                  type="number"
                  name={`items[${index}][order_quantity]`}
                  min="0"
                  step="1"
                  placeholder="0"
                />
              </div>
            )}
          </div>
          {showItemMemo && (
            <div>
              <label className="block text-sm text-muted-foreground mb-1">메모</label>
              <textarea
                className="w-full rounded border px-3 py-2"
                name={`items[${index}][notes]`}
                rows={2}
                placeholder="품목 메모를 입력하세요."
              />
            </div>
          )}
        </div>
      ))}
      <button type="button" className="w-full rounded border px-3 py-2" onClick={addRow}>
        품목 추가
      </button>
    </div>
  )
}
