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

export default function ShipmentItemsFieldArray({
  materialOptions,
}: {
  materialOptions: OptionItem[]
}) {
  const [rows, setRows] = useState<Row[]>([createRow()])

  const addRow = () => setRows(prev => [...prev, createRow()])
  const removeRow = (index: number) => {
    if (rows.length === 1) return
    setRows(prev => prev.filter((_, i) => i !== index))
  }

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">
                자재<span className="req-mark"> *</span>
              </label>
              <SelectField
                name={`items[${index}][material_id]`}
                required
                placeholder="자재 선택"
                options={materialOptions}
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">
                출고수량<span className="req-mark"> *</span>
              </label>
              <input
                className="w-full rounded border px-3 py-2"
                type="number"
                name={`items[${index}][quantity]`}
                min="0"
                step="1"
                required
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">단가</label>
              <input
                className="w-full rounded border px-3 py-2"
                type="number"
                name={`items[${index}][unit_price]`}
                min="0"
                step="1"
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">메모</label>
            <textarea
              className="w-full rounded border px-3 py-2"
              name={`items[${index}][notes]`}
              rows={2}
              placeholder="품목 메모를 입력하세요."
            />
          </div>
        </div>
      ))}
      <button type="button" className="w-full rounded border px-3 py-2" onClick={addRow}>
        품목 추가
      </button>
    </div>
  )
}
