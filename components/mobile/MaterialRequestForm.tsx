'use client'

import React, { useState } from 'react'

export interface MaterialOption {
  id: string
  name: string
  code?: string | null
  unit?: string | null
}

export default function MaterialRequestForm({
  siteId,
  materials,
  action,
}: {
  siteId: string
  materials: MaterialOption[]
  action: (formData: FormData) => void
}) {
  const [items, setItems] = useState<{ material_id: string; qty: string; notes?: string }[]>([
    { material_id: '', qty: '' },
  ])
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal')
  const [neededBy, setNeededBy] = useState<string>('')
  const [notes, setNotes] = useState<string>('')

  const addItem = () => setItems(prev => [...prev, { material_id: '', qty: '' }])
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx))

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="site_id" value={siteId} />

      <div>
        <label className="block text-sm text-muted-foreground mb-1">필요일</label>
        <input
          className="w-full rounded border px-3 py-2"
          type="date"
          name="needed_by"
          value={neededBy}
          min={new Date().toISOString().split('T')[0]}
          onChange={e => setNeededBy(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block text-sm text-muted-foreground mb-1">우선순위</label>
        <select
          className="w-full rounded border px-3 py-2"
          name="priority"
          value={priority}
          onChange={e => setPriority(e.target.value as any)}
        >
          <option value="low">낮음</option>
          <option value="normal">보통</option>
          <option value="high">높음</option>
          <option value="urgent">긴급</option>
        </select>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">요청 품목</div>
        {items.map((it, idx) => (
          <div key={idx} className="flex gap-2 items-start">
            <select
              className="flex-1 rounded border px-3 py-2"
              value={it.material_id}
              onChange={e => {
                const val = e.target.value
                setItems(prev => prev.map((p, i) => (i === idx ? { ...p, material_id: val } : p)))
              }}
              required
            >
              <option value="">자재 선택</option>
              {materials.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.code ? `(${m.code})` : ''}
                </option>
              ))}
            </select>
            <input
              className="w-28 rounded border px-3 py-2"
              type="number"
              min="0"
              step="1"
              placeholder="수량"
              value={it.qty}
              onChange={e => {
                const val = e.target.value
                setItems(prev => prev.map((p, i) => (i === idx ? { ...p, qty: val } : p)))
              }}
              required
            />
            <button
              type="button"
              className="text-sm px-3 py-2 border rounded"
              onClick={() => removeItem(idx)}
            >
              삭제
            </button>
          </div>
        ))}
        <button type="button" className="w-full text-sm px-3 py-2 border rounded" onClick={addItem}>
          품목 추가
        </button>
      </div>

      <div>
        <label className="block text-sm text-muted-foreground mb-1">요청 사유</label>
        <textarea
          className="w-full rounded border px-3 py-2"
          name="notes"
          rows={3}
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </div>

      {/* Serialize items into form fields */}
      {items.map((it, idx) => (
        <div key={`hidden-${idx}`} className="hidden">
          <input name={`items[${idx}][material_id]`} defaultValue={it.material_id} />
          <input name={`items[${idx}][requested_quantity]`} defaultValue={it.qty} />
        </div>
      ))}

      <div className="flex gap-2">
        <button type="submit" className="flex-1 rounded border px-3 py-2 bg-black text-white">
          요청 생성
        </button>
        <a
          href="/mobile/materials/requests"
          className="flex-1 text-center rounded border px-3 py-2"
        >
          취소
        </a>
      </div>
    </form>
  )
}
