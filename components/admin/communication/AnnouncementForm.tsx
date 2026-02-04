'use client'

import { Button } from '@/components/ui/button'
import CustomMultiSelect from '@/components/ui/custom-multi-select'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { Info, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

type AnnouncementRecord = {
  id: string
  title: string
  content: string
  priority: 'low' | 'medium' | 'high' | 'critical' | 'urgent'
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

const DEFAULT_PRIORITY: AnnouncementRecord['priority'] = 'medium'

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
      { value: 'medium', label: '보통' },
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
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 1. 기본 내용 섹션 */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <div className="p-1.5 bg-blue-50 rounded-lg">
            <Info className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="font-bold text-slate-800 tracking-tight text-sm">기본 내용</h3>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[13px] font-semibold text-slate-600 ml-1">공지 제목 *</label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="공지사항 제목을 입력하세요"
              className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white transition-all text-sm font-medium"
              required
              disabled={busy}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-semibold text-slate-600 ml-1">상세 내용 *</label>
            <Textarea
              className="w-full min-h-[160px] rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white transition-all text-sm font-medium py-3 px-4 resize-none shadow-sm"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="공지할 내용을 구체적으로 작성하세요"
              required
              disabled={busy}
            />
          </div>
        </div>
      </div>

      {/* 2. 게시 설정 섹션 */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <div className="p-1.5 bg-indigo-50 rounded-lg">
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <h3 className="font-bold text-slate-800 tracking-tight text-sm">게시 및 타겟 설정</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-[13px] font-semibold text-slate-600 ml-1">우선순위</label>
            <CustomSelect
              value={priority}
              onValueChange={v => setPriority(v as AnnouncementRecord['priority'])}
              disabled={busy}
            >
              <CustomSelectTrigger className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white transition-all text-sm font-medium">
                <CustomSelectValue placeholder="우선순위 선택" />
              </CustomSelectTrigger>
              <CustomSelectContent className="rounded-xl">
                {priorityItems.map(item => (
                  <CustomSelectItem key={item.value} value={item.value} className="font-medium">
                    {item.label}
                  </CustomSelectItem>
                ))}
              </CustomSelectContent>
            </CustomSelect>
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-semibold text-slate-600 ml-1">활성 상태</label>
            <div className="flex items-center justify-between h-11 px-4 rounded-xl bg-slate-50/50 border border-slate-200">
              <span className="text-sm font-medium text-slate-500">
                {isActive ? '운영 중' : '중지됨'}
              </span>
              <Switch checked={isActive} onCheckedChange={setIsActive} disabled={busy} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-semibold text-slate-600 ml-1">대상 현장</label>
            <CustomMultiSelect
              options={availableSites}
              selected={selectedSiteIds}
              onChange={setSelectedSiteIds}
              placeholder="전체 현장"
              className="rounded-xl min-h-[44px]"
            />
            <p className="text-[10px] font-medium text-slate-400 ml-1">* 미선택 시 전체 노출</p>
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-semibold text-slate-600 ml-1">대상 역할</label>
            <CustomMultiSelect
              options={roleOptions}
              selected={selectedRoles}
              onChange={setSelectedRoles}
              placeholder="전체 역할"
              className="rounded-xl min-h-[44px]"
            />
            <p className="text-[10px] font-medium text-slate-400 ml-1">* 비워 두면 전체 발송</p>
          </div>
        </div>
      </div>

      {/* 하단 액션 바 */}
      <div className="pt-8 border-t border-slate-100 flex items-center justify-end gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={busy}
            className="h-11 px-6 rounded-xl border-slate-200 text-slate-500 font-semibold hover:bg-slate-50 transition-all text-sm"
          >
            취소
          </Button>
        )}
        <Button
          type="submit"
          disabled={busy}
          className="h-11 px-10 rounded-xl bg-[#1A254F] hover:bg-[#2A355F] text-white font-bold shadow-lg shadow-blue-900/10 transition-all text-sm"
        >
          {busy ? '처리 중...' : isEdit ? '공지 수정 완료' : '새 공지 발행하기'}
        </Button>
      </div>

      {(message || errorMessage) && (
        <div
          className={cn(
            'p-4 rounded-xl text-sm font-bold animate-in fade-in duration-300',
            message ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
          )}
        >
          {message || errorMessage}
        </div>
      )}
    </form>
  )
}
