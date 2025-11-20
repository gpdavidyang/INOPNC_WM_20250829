'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import CustomMultiSelect from '@/components/ui/custom-multi-select'
import { Switch } from '@/components/ui/switch'

type AnnouncementRecord = {
  id: string
  title: string
  content: string
  priority: 'low' | 'normal' | 'high' | 'critical' | 'urgent'
  target_sites: string[] | null
  target_roles: string[] | null
  is_active?: boolean | null
}

type AnnouncementFormProps = {
  mode: 'create' | 'edit'
  initialData?: AnnouncementRecord | null
  onAfterSubmit?: (announcement: any) => void
  onCancel?: () => void
}

const roleOptions = [
  { value: 'worker', label: '작업자' },
  { value: 'site_manager', label: '현장관리자' },
  { value: 'admin', label: '본사관리자' },
  { value: 'system_admin', label: '시스템관리자' },
]

const DEFAULT_PRIORITY: AnnouncementRecord['priority'] = 'normal'

export default function AnnouncementForm({
  mode,
  initialData,
  onAfterSubmit,
  onCancel,
}: AnnouncementFormProps) {
  const router = useRouter()
  const [availableSites, setAvailableSites] = useState<Array<{ value: string; label: string }>>([])
  const [title, setTitle] = useState(initialData?.title || '')
  const [content, setContent] = useState(initialData?.content || '')
  const [priority, setPriority] = useState<AnnouncementRecord['priority']>(
    initialData?.priority || DEFAULT_PRIORITY
  )
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>(initialData?.target_sites || [])
  const [selectedRoles, setSelectedRoles] = useState<string[]>(initialData?.target_roles || [])
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const isEdit = mode === 'edit'

  useEffect(() => {
    let mounted = true
    const run = async () => {
      try {
        const response = await fetch('/api/mobile/sites/list', { cache: 'no-store' })
        const json = await response.json().catch(() => ({}))
        const list = Array.isArray(json?.data) ? json.data : []
        if (mounted) {
          setAvailableSites(
            list.map((site: any) => ({
              value: site.id as string,
              label: String(site.name || site.id),
            }))
          )
        }
      } catch {
        if (mounted) setAvailableSites([])
      }
    }
    run()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '')
      setContent(initialData.content || '')
      setPriority(initialData.priority || DEFAULT_PRIORITY)
      setSelectedSiteIds(initialData.target_sites || [])
      setSelectedRoles(initialData.target_roles || [])
      setIsActive(initialData.is_active ?? true)
    }
  }, [initialData])

  const priorityItems = useMemo(
    () => [
      { value: 'low', label: '낮음' },
      { value: 'normal', label: '보통' },
      { value: 'high', label: '높음' },
      { value: 'critical', label: '최우선' },
      { value: 'urgent', label: '긴급' },
    ],
    []
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      setErrorMessage('제목과 내용을 입력하세요.')
      setMessage(null)
      return
    }
    setBusy(true)
    setErrorMessage(null)
    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        priority,
        siteIds: selectedSiteIds,
        targetRoles: selectedRoles,
        is_active: isActive,
      }
      const url = mode === 'create' ? '/api/announcements' : `/api/announcements/${initialData?.id}`
      const method = mode === 'create' ? 'POST' : 'PUT'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.success === false) {
        throw new Error(json?.error || '요청을 처리하지 못했습니다.')
      }
      const saved = json?.data || json
      setMessage(mode === 'create' ? '공지가 생성되었습니다.' : '공지 변경사항이 저장되었습니다.')
      if (mode === 'create') {
        setTitle('')
        setContent('')
        setPriority(DEFAULT_PRIORITY)
        setSelectedSiteIds([])
        setSelectedRoles([])
        setIsActive(true)
      }
      router.refresh()
      onAfterSubmit?.(saved)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '처리 중 문제가 발생했습니다.')
      setMessage(null)
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
        <Textarea
          className="w-full h-24"
          value={content}
          onChange={e => setContent(e.target.value)}
          required
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm text-muted-foreground mb-1">우선순위</label>
          <CustomSelect
            value={priority}
            onValueChange={v => setPriority(v as AnnouncementRecord['priority'])}
          >
            <CustomSelectTrigger>
              <CustomSelectValue placeholder="우선순위" />
            </CustomSelectTrigger>
            <CustomSelectContent>
              {priorityItems.map(item => (
                <CustomSelectItem key={item.value} value={item.value}>
                  {item.label}
                </CustomSelectItem>
              ))}
            </CustomSelectContent>
          </CustomSelect>
        </div>
        <div>
          <CustomMultiSelect
            label="대상 현장"
            options={availableSites}
            selected={selectedSiteIds}
            onChange={setSelectedSiteIds}
            placeholder="전체 (미선택 시 전체)"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            선택하지 않으면 전체 현장 대상으로 발송됩니다.
          </p>
        </div>
        <div>
          <CustomMultiSelect
            label="대상 역할"
            options={roleOptions}
            selected={selectedRoles}
            onChange={setSelectedRoles}
            placeholder="전체 (미선택 시 전체)"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            비워 두면 전체 역할 대상으로 발송됩니다.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
        <div>
          <p className="text-sm font-medium text-foreground">활성 상태</p>
          <p className="text-xs text-muted-foreground">
            비활성화 시 사용자 화면에 표시되지 않습니다.
          </p>
        </div>
        <Switch checked={isActive} onCheckedChange={checked => setIsActive(checked)} />
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" disabled={busy}>
          {busy ? '처리 중…' : isEdit ? '공지 수정' : '공지 생성'}
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
            취소
          </Button>
        ) : null}
        {message && <span className="text-sm text-muted-foreground">{message}</span>}
        {errorMessage && <span className="text-sm text-destructive">{errorMessage}</span>}
      </div>
    </form>
  )
}
