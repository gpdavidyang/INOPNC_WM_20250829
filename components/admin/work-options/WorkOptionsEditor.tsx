'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function WorkOptionsEditor() {
  const [createBusy, setCreateBusy] = useState(false)
  const [updateBusy, setUpdateBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  // Create form state
  const [cType, setCType] = useState<'component_type' | 'process_type'>('component_type')
  const [cValue, setCValue] = useState('')
  const [cLabel, setCLabel] = useState('')
  const [cOrder, setCOrder] = useState<number | ''>('')

  // Update form state
  const [uId, setUId] = useState('')
  const [uLabel, setULabel] = useState('')
  const [uOrder, setUOrder] = useState<number | ''>('')
  const [uActive, setUActive] = useState<boolean | ''>('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)
    setCreateBusy(true)
    try {
      const res = await fetch('/api/admin/work-options', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          option_type: cType,
          option_value: cValue,
          option_label: cLabel,
          display_order: cOrder === '' ? undefined : Number(cOrder),
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.error) throw new Error(json?.error || '생성 실패')
      setMsg('옵션이 생성되었습니다. 목록을 새로고침하세요.')
      setCValue('')
      setCLabel('')
      setCOrder('')
    } catch (err: any) {
      setMsg(err?.message || '생성 실패')
    } finally {
      setCreateBusy(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)
    setUpdateBusy(true)
    try {
      const payload: Record<string, unknown> = { id: uId }
      if (uLabel !== '') payload.option_label = uLabel
      if (uOrder !== '') payload.display_order = Number(uOrder)
      if (uActive !== '') payload.is_active = Boolean(uActive)
      const res = await fetch('/api/admin/work-options', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.error) throw new Error(json?.error || '수정 실패')
      setMsg('옵션이 수정되었습니다. 목록을 새로고침하세요.')
      setUId('')
      setULabel('')
      setUOrder('')
      setUActive('')
    } catch (err: any) {
      setMsg(err?.message || '수정 실패')
    } finally {
      setUpdateBusy(false)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <form onSubmit={handleCreate} className="rounded-lg border bg-card p-4 shadow-sm space-y-3">
        <div className="text-sm font-medium">작업 옵션 생성</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">옵션 유형</label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={cType}
              onChange={e => setCType(e.target.value as any)}
            >
              <option value="component_type">component_type</option>
              <option value="process_type">process_type</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">값(option_value)</label>
            <Input value={cValue} onChange={e => setCValue(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">라벨(option_label)</label>
            <Input value={cLabel} onChange={e => setCLabel(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">정렬(display_order)</label>
            <Input
              value={cOrder}
              onChange={e => setCOrder(e.target.value === '' ? '' : Number(e.target.value))}
              type="number"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button type="submit" variant="outline" disabled={createBusy}>
            {createBusy ? '처리 중…' : '생성'}
          </Button>
          {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
        </div>
      </form>

      <form onSubmit={handleUpdate} className="rounded-lg border bg-card p-4 shadow-sm space-y-3">
        <div className="text-sm font-medium">작업 옵션 수정</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">옵션 ID</label>
            <Input value={uId} onChange={e => setUId(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">라벨(option_label)</label>
            <Input
              value={uLabel}
              onChange={e => setULabel(e.target.value)}
              placeholder="변경 시 입력"
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">정렬(display_order)</label>
            <Input
              value={uOrder}
              onChange={e => setUOrder(e.target.value === '' ? '' : Number(e.target.value))}
              type="number"
              placeholder="변경 시 입력"
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">활성(is_active)</label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={uActive === '' ? '' : uActive ? 'true' : 'false'}
              onChange={e => {
                const v = e.target.value
                setUActive(v === '' ? '' : v === 'true')
              }}
            >
              <option value="">변경 안함</option>
              <option value="true">활성</option>
              <option value="false">비활성</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button type="submit" variant="outline" disabled={updateBusy}>
            {updateBusy ? '처리 중…' : '수정'}
          </Button>
          {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
        </div>
      </form>
    </div>
  )
}
