'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

type AvailableWorker = {
  id: string
  full_name?: string
  email?: string
  phone?: string
  role?: string
  company?: string
}

export default function AssignUsersDialog({
  siteId,
  open,
  onOpenChange,
  onAssigned,
}: {
  siteId: string
  open: boolean
  onOpenChange: (v: boolean) => void
  onAssigned?: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<AvailableWorker[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let active = true
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/admin/sites/${siteId}/workers/available`, {
          cache: 'no-store',
          credentials: 'include',
        })
        const j = await res.json().catch(() => ({}))
        if (!active) return
        if (res.ok && Array.isArray(j?.data)) setItems(j.data)
        else setItems([])
      } catch (e: any) {
        if (active) setError(e?.message || '가용 인원을 불러오지 못했습니다.')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [open, siteId])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter(w =>
      [w.full_name, w.email, w.phone, w.company, w.role]
        .map(v => String(v || '').toLowerCase())
        .some(v => v.includes(q))
    )
  }, [items, query])

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const assign = async () => {
    if (selected.size === 0) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/sites/${siteId}/workers/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ worker_ids: Array.from(selected) }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok || j?.error) throw new Error(j?.error || '배정 실패')
      onOpenChange(false)
      if (onAssigned) onAssigned()
      else if (typeof window !== 'undefined') window.location.reload()
    } catch (e: any) {
      setError(e?.message || '배정 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>사용자 배정</DialogTitle>
          <DialogDescription>현장에 배정할 사용자를 선택하세요.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="이름/이메일/회사 검색"
            className="w-full rounded border px-3 py-2 text-sm"
          />
          {error && <div className="text-sm text-red-600">{error}</div>}
          <div className="max-h-72 overflow-auto rounded border">
            {loading ? (
              <div className="p-3 text-sm text-muted-foreground">불러오는 중…</div>
            ) : filtered.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground">가용 인원이 없습니다.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-3 py-2">선택</th>
                    <th className="px-3 py-2">이름</th>
                    <th className="px-3 py-2">이메일</th>
                    <th className="px-3 py-2">역할</th>
                    <th className="px-3 py-2">회사</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(w => (
                    <tr key={w.id} className="border-t">
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selected.has(w.id)}
                          onChange={() => toggle(w.id)}
                        />
                      </td>
                      <td className="px-3 py-2">{w.full_name || '-'}</td>
                      <td className="px-3 py-2">{w.email || '-'}</td>
                      <td className="px-3 py-2">{w.role || '-'}</td>
                      <td className="px-3 py-2">{w.company || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              취소
            </Button>
            <Button size="sm" onClick={assign} disabled={loading || selected.size === 0}>
              {loading ? '배정 중…' : `배정 (${selected.size})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
