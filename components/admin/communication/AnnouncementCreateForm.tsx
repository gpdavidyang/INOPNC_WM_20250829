'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function AnnouncementCreateForm() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
  const [siteIds, setSiteIds] = useState('')
  const [targetRoles, setTargetRoles] = useState('admin,site_manager,worker')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    try {
      const payload = {
        title,
        content,
        priority,
        siteIds: siteIds
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
        targetRoles: targetRoles
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
      }
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok || json?.success === false) {
        throw new Error(json?.error || '공지 생성 실패')
      }
      setMsg('공지가 생성되었습니다.')
      setTitle('')
      setContent('')
    } catch (err: any) {
      setMsg(err?.message || '공지 생성 실패')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm text-muted-foreground mb-1">제목</label>
        <Input value={title} onChange={e => setTitle(e.target.value)} required />
      </div>
      <div>
        <label className="block text-sm text-muted-foreground mb-1">내용</label>
        <textarea
          className="w-full h-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={content}
          onChange={e => setContent(e.target.value)}
          required
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm text-muted-foreground mb-1">우선순위</label>
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={priority}
            onChange={e => setPriority(e.target.value as any)}
          >
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
            <option value="urgent">urgent</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-muted-foreground mb-1">
            대상 현장 IDs(쉼표로 구분)
          </label>
          <Input
            value={siteIds}
            onChange={e => setSiteIds(e.target.value)}
            placeholder="예: site-1,site-2"
          />
        </div>
        <div>
          <label className="block text-sm text-muted-foreground mb-1">대상 역할(쉼표)</label>
          <Input
            value={targetRoles}
            onChange={e => setTargetRoles(e.target.value)}
            placeholder="예: admin,site_manager,worker"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" variant="outline" disabled={busy}>
          {busy ? '처리 중…' : '공지 생성'}
        </Button>
        {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
      </div>
    </form>
  )
}
