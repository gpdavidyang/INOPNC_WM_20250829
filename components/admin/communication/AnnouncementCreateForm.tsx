'use client'

import { useEffect, useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import MultiSelectFilter from '@/components/admin/legacy/salary/components/MultiSelectFilter'

export default function AnnouncementCreateForm() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([])
  const [availableSites, setAvailableSites] = useState<Array<{ value: string; label: string }>>([])
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  // Load sites list for dropdown
  useEffect(() => {
    let mounted = true
    const run = async () => {
      try {
        const r = await fetch('/api/mobile/sites/list', { cache: 'no-store' })
        const j = await r.json().catch(() => ({}))
        const list = Array.isArray(j?.data) ? j.data : []
        if (mounted)
          setAvailableSites(
            list.map((s: any) => ({ value: s.id as string, label: String(s.name || s.id) }))
          )
      } catch {
        // ignore
      }
    }
    run()
    return () => {
      mounted = false
    }
  }, [])

  const roleOptions = useMemo(
    () => [
      { value: 'worker', label: '작업자' },
      { value: 'site_manager', label: '현장관리자' },
      // 생산관리자(production_manager)는 미도입 상태 — 향후 롤 생성 시 추가 예정
      { value: 'admin', label: '본사관리자' },
      { value: 'system_admin', label: '시스템관리자' },
    ],
    []
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    try {
      const payload = {
        title,
        content,
        priority,
        // If 아무도 선택 안함 => 전체로 간주(필터 미적용)
        siteIds: selectedSiteIds,
        targetRoles: selectedRoles,
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
      setSelectedSiteIds([])
      setSelectedRoles([])
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
          <CustomSelect value={priority} onValueChange={v => setPriority(v as any)}>
            <CustomSelectTrigger>
              <CustomSelectValue placeholder="우선순위" />
            </CustomSelectTrigger>
            <CustomSelectContent>
              <CustomSelectItem value="low">낮음</CustomSelectItem>
              <CustomSelectItem value="medium">보통</CustomSelectItem>
              <CustomSelectItem value="high">높음</CustomSelectItem>
              <CustomSelectItem value="urgent">긴급</CustomSelectItem>
            </CustomSelectContent>
          </CustomSelect>
        </div>
        <div>
          <MultiSelectFilter
            label="대상 현장"
            options={availableSites}
            selected={selectedSiteIds}
            onChange={setSelectedSiteIds}
            placeholder="전체 (미선택 시 전체)"
          />
        </div>
        <div>
          <MultiSelectFilter
            label="대상 역할"
            options={roleOptions}
            selected={selectedRoles}
            onChange={setSelectedRoles}
            placeholder="전체 (미선택 시 전체)"
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
