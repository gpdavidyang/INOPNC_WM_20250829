'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useFontSize, getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'
import { Plus, Trash2, Edit2, Settings } from 'lucide-react'

type QuickAction = {
  id: string
  title: string
  description?: string
  icon_name: string
  link_url: string
  is_active: boolean
  display_order: number
}

interface QuickActionsSettingsProps {
  onUpdate?: () => void
}

const AVAILABLE_ICONS = [
  { name: 'Home', label: '홈' },
  { name: 'Users', label: '사용자' },
  { name: 'Building2', label: '건물' },
  { name: 'FileText', label: '문서' },
  { name: 'Package', label: '패키지' },
]

const initialForm = {
  title: '',
  description: '',
  icon_name: 'Home',
  link_url: '',
  is_active: true,
  display_order: 0,
}

export function QuickActionsSettings({ onUpdate }: QuickActionsSettingsProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  const [open, setOpen] = useState(false)
  const [list, setList] = useState<QuickAction[]>([])
  const [editing, setEditing] = useState<QuickAction | null>(null)
  const [form, setForm] = useState(initialForm)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    const r = await fetch('/api/admin/quick-actions', { cache: 'no-store' })
    const j = await r.json().catch(() => ({}))
    setList(Array.isArray(j?.quickActions) ? j.quickActions : [])
  }
  useEffect(() => {
    if (open) void load()
  }, [open])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const url = editing ? `/api/admin/quick-actions/${editing.id}` : '/api/admin/quick-actions'
      const method = editing ? 'PUT' : 'POST'
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!r.ok) throw new Error('저장 실패')
      await load()
      setEditing(null)
      setForm(initialForm)
      onUpdate?.()
    } catch (e: any) {
      setError(e?.message || '저장 실패')
    } finally {
      setBusy(false)
    }
  }

  const startEdit = (qa: QuickAction) => {
    setEditing(qa)
    setForm({ ...qa })
  }
  const del = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return
    await fetch(`/api/admin/quick-actions/${id}`, { method: 'DELETE' })
    await load()
    onUpdate?.()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={
            touchMode === 'glove'
              ? 'h-12 w-12'
              : touchMode === 'precision'
                ? 'h-8 w-8'
                : 'h-10 w-10'
          }
        >
          <Settings className={touchMode === 'glove' ? 'h-6 w-6' : 'h-4 w-4'} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className={getFullTypographyClass('heading', 'lg', isLargeFont)}>
            빠른 작업 설정
          </DialogTitle>
        </DialogHeader>
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
            {error}
          </div>
        )}
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">제목</Label>
              <Input
                id="title"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="icon">아이콘</Label>
              <Select
                value={form.icon_name}
                onValueChange={v => setForm({ ...form, icon_name: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="아이콘" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_ICONS.map(i => (
                    <SelectItem key={i.name} value={i.name}>
                      {i.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="desc">설명</Label>
              <Input
                id="desc"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="url">링크 URL</Label>
              <Input
                id="url"
                value={form.link_url}
                onChange={e => setForm({ ...form, link_url: e.target.value })}
                required
                placeholder="/dashboard/admin/users"
              />
            </div>
            <div>
              <Label htmlFor="order">표시 순서</Label>
              <Input
                id="order"
                type="number"
                value={form.display_order}
                onChange={e =>
                  setForm({ ...form, display_order: parseInt(e.target.value || '0', 10) })
                }
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={busy}>
              {busy ? '저장 중…' : editing ? '수정' : '추가'}
            </Button>
            {editing && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditing(null)
                  setForm(initialForm)
                }}
              >
                취소
              </Button>
            )}
          </div>
        </form>

        <div className="mt-6 space-y-2">
          {list.map(qa => (
            <div key={qa.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">{qa.title}</div>
                <div className="text-xs text-muted-foreground">{qa.link_url}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => startEdit(qa)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => del(qa.id)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {list.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-6">
              등록된 빠른 작업이 없습니다.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
