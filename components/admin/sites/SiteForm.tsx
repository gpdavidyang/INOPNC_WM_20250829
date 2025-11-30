'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  CustomSelect,
  CustomSelectTrigger,
  CustomSelectValue,
  CustomSelectContent,
  CustomSelectItem,
} from '@/components/ui/custom-select'
import { ChevronDown } from 'lucide-react'
import { matchesSharedDocCategory } from '@/lib/documents/shared-documents'
import { cn } from '@/lib/utils'
import type { Site } from '@/types'
import { openFileRecordInNewTab } from '@/lib/files/preview'

type Mode = 'create' | 'edit'

type Props = {
  mode: Mode
  siteId?: string
  initial?: Partial<Site> | null
  onSuccess?: (site?: Site) => void
}

type FormState = {
  name: string
  address: string
  description: string
  status: 'planning' | 'active' | 'inactive' | 'completed'
  start_date: string
  end_date: string
  manager_name: string
  manager_phone: string
  manager_email: string
  safety_manager_name: string
  safety_manager_phone: string
  accommodation_name: string
  accommodation_address: string
  accommodation_phone: string
  organization_id: string
}

const toDateInput = (value?: string | null) => {
  if (!value) return ''
  try {
    return new Date(value).toISOString().slice(0, 10)
  } catch {
    return ''
  }
}

type FieldProps = {
  label: string
  htmlFor?: string
  children: ReactNode
  className?: string
  hint?: string
  required?: boolean
}

const Field = ({ label, htmlFor, children, className, hint, required }: FieldProps) => (
  <div className={cn('space-y-1.5', className)}>
    <Label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">
      {label}
      {required ? <span className="ml-1 text-rose-500">*</span> : null}
    </Label>
    {hint ? <p className="text-[11px] text-muted-foreground/80">{hint}</p> : null}
    {children}
  </div>
)

export default function SiteForm({ mode, siteId, initial, onSuccess }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [sharedDocsLoading, setSharedDocsLoading] = useState(false)
  const [sharedDocsError, setSharedDocsError] = useState<string | null>(null)
  const [sharedDocs, setSharedDocs] = useState<Array<Record<string, any>>>([])
  const [organizationOptions, setOrganizationOptions] = useState<
    Array<{ id: string; name: string }>
  >([])
  const [organizationLoading, setOrganizationLoading] = useState(false)
  const [organizationError, setOrganizationError] = useState<string | null>(null)

  const [form, setForm] = useState<FormState>(() => ({
    name: initial?.name || '',
    address: initial?.address || '',
    description: String(initial?.description || ''),
    status: (initial?.status as FormState['status']) || 'planning',
    start_date: initial?.start_date ? toDateInput(initial.start_date) : '',
    end_date: initial?.end_date ? toDateInput(initial.end_date) : '',
    manager_name: String(initial?.manager_name || ''),
    manager_phone: String(
      (initial as any)?.manager_phone || (initial as any)?.construction_manager_phone || ''
    ),
    manager_email: String(
      (initial as any)?.manager_email || (initial as any)?.construction_manager_email || ''
    ),
    safety_manager_name: String(initial?.safety_manager_name || ''),
    safety_manager_phone: String(initial?.safety_manager_phone || ''),
    accommodation_name: String(initial?.accommodation_name || ''),
    accommodation_address: String(initial?.accommodation_address || ''),
    accommodation_phone: String((initial as any)?.accommodation_phone || ''),
    organization_id: initial?.organization_id ? String(initial.organization_id) : '',
  }))

  const canViewSharedDocs = mode === 'edit' && !!siteId

  const initialExtrasExpanded = useMemo(
    () =>
      Boolean(
        initial?.accommodation_name ||
          initial?.accommodation_address ||
          initial?.accommodation_phone
      ),
    [initial?.accommodation_address, initial?.accommodation_name, initial?.accommodation_phone]
  )
  const [showExtras, setShowExtras] = useState(() => initialExtrasExpanded)
  const initialExtrasRef = useRef(initialExtrasExpanded)
  const hasExtraValues = useMemo(
    () =>
      Boolean(form.accommodation_address || form.accommodation_name || form.accommodation_phone),
    [form]
  )
  useEffect(() => {
    if (!canViewSharedDocs) return
    let active = true
    setSharedDocsLoading(true)
    setSharedDocsError(null)
    ;(async () => {
      try {
        const params = new URLSearchParams({ category: 'shared', limit: '200' })
        const res = await fetch(`/api/admin/sites/${siteId}/documents?${params.toString()}`, {
          cache: 'no-store',
          credentials: 'include',
        })
        const json = await res.json().catch(() => ({}))
        if (!active) return
        if (res.ok && json?.success && Array.isArray(json.data)) {
          setSharedDocs(json.data as Array<Record<string, any>>)
        } else {
          setSharedDocs([])
          setSharedDocsError('공유자료 목록을 불러오지 못했습니다.')
        }
      } catch {
        if (!active) return
        setSharedDocs([])
        setSharedDocsError('공유자료 목록을 불러오지 못했습니다.')
      } finally {
        if (active) setSharedDocsLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [canViewSharedDocs, siteId])
  const sharedDocsByCategory = useMemo(() => {
    const buckets = {
      ptw: [] as Array<Record<string, any>>,
      construction: [] as Array<Record<string, any>>,
      progress: [] as Array<Record<string, any>>,
    }
    sharedDocs.forEach(doc => {
      if (matchesSharedDocCategory(doc, 'ptw')) {
        buckets.ptw.push(doc)
        return
      }
      if (matchesSharedDocCategory(doc, 'construction')) {
        buckets.construction.push(doc)
        return
      }
      if (matchesSharedDocCategory(doc, 'progress')) {
        buckets.progress.push(doc)
      }
    })
    return buckets
  }, [sharedDocs])
  const openSharedDoc = useCallback(async (doc: Record<string, any>) => {
    if (!doc) return
    const record = {
      file_url: doc?.file_url || doc?.fileUrl || doc?.url,
      storage_bucket:
        doc?.storage_bucket ||
        doc?.storageBucket ||
        doc?.bucket ||
        doc?.document?.storage_bucket ||
        null,
      storage_path:
        doc?.storage_path ||
        doc?.storagePath ||
        doc?.folder_path ||
        doc?.folderPath ||
        doc?.document?.storage_path ||
        null,
      folder_path: doc?.folder_path || doc?.folderPath || null,
      file_name: doc?.file_name || doc?.fileName || doc?.title || null,
      title: doc?.title || doc?.file_name || doc?.fileName || null,
    }

    if (!record.file_url && !record.storage_path) {
      console.warn('[SiteForm] 공유 자료에 파일 경로 정보가 없어 열 수 없습니다.', doc)
      return
    }

    try {
      await openFileRecordInNewTab(record)
      return
    } catch (error) {
      console.warn('[SiteForm] Failed to open shared doc via helper, falling back.', error)
    }

    if (record.file_url) {
      const opened = window.open(record.file_url, '_blank', 'noopener,noreferrer')
      if (!opened) {
        const link = document.createElement('a')
        link.href = record.file_url
        link.target = '_blank'
        link.rel = 'noreferrer'
        link.click()
      }
    }
  }, [])
  const renderSharedDocList = (
    label: string,
    docs: Array<Record<string, any>>,
    emptyText: string
  ) => (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {docs.length === 0 ? (
        <div className="rounded-md border border-dashed border-border/50 bg-muted/10 px-3 py-2 text-xs text-muted-foreground">
          {emptyText}
        </div>
      ) : (
        <ul className="space-y-2">
          {docs.map(doc => {
            const key = doc?.id ? String(doc.id) : doc?.file_url || doc?.url || label
            const title = doc?.title || doc?.file_name || doc?.fileName || '문서'
            const uploader = doc?.profiles?.full_name || doc?.uploaded_by_name || ''
            const created =
              typeof doc?.created_at === 'string'
                ? new Date(doc.created_at).toLocaleDateString('ko-KR')
                : ''
            return (
              <li
                key={key}
                className="flex items-start justify-between gap-3 rounded-md border border-border/60 bg-background px-3 py-2"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">{title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {created || '등록일 미확인'}
                    {uploader ? ` · ${uploader}` : ''}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="shrink-0 text-xs"
                  onClick={() => openSharedDoc(doc)}
                >
                  보기
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )

  useEffect(() => {
    if (initialExtrasRef.current !== initialExtrasExpanded) {
      initialExtrasRef.current = initialExtrasExpanded
      setShowExtras(initialExtrasExpanded)
    }
  }, [initialExtrasExpanded])

  useEffect(() => {
    let active = true
    setOrganizationLoading(true)
    setOrganizationError(null)
    ;(async () => {
      try {
        const res = await fetch('/api/admin/organizations', { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))
        if (!active) return
        if (res.ok && Array.isArray(json?.organizations)) {
          setOrganizationOptions(
            (json.organizations as Array<{ id: string; name: string }>).map(org => ({
              id: String(org.id),
              name: org.name || '이름 미지정',
            }))
          )
        } else {
          setOrganizationOptions([])
          setOrganizationError('소속 목록을 불러오지 못했습니다.')
        }
      } catch {
        if (!active) return
        setOrganizationOptions([])
        setOrganizationError('소속 목록을 불러오지 못했습니다.')
      } finally {
        if (active) setOrganizationLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const handleChange = useCallback((field: keyof FormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }, [])

  const submit = useCallback(async () => {
    setError(null)
    if (!form.name.trim()) return setError('현장명은 필수입니다.')
    if (!form.address.trim()) return setError('주소는 필수입니다.')
    if (!form.start_date.trim()) return setError('시작일은 필수입니다.')

    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        address: form.address,
        status: form.status,
        start_date: form.start_date,
        organization_id: form.organization_id || null,
        description: form.description.trim() || null,
        end_date: form.end_date.trim() || null,
        manager_name: form.manager_name.trim() || null,
        manager_phone: form.manager_phone.trim() || null,
        manager_email: form.manager_email.trim() || null,
        safety_manager_name: form.safety_manager_name.trim() || null,
        safety_manager_phone: form.safety_manager_phone.trim() || null,
        accommodation_name: form.accommodation_name.trim() || null,
        accommodation_address: form.accommodation_address.trim() || null,
        accommodation_phone: form.accommodation_phone.trim() || null,
      }

      const res = await fetch(
        mode === 'create' ? '/api/admin/sites' : `/api/admin/sites/${siteId}`,
        {
          method: mode === 'create' ? 'POST' : 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )
      const j = await res.json().catch(() => ({}))
      if (!res.ok || !j?.success) {
        throw new Error(j?.error || '저장에 실패했습니다.')
      }
      if (onSuccess) onSuccess(j.data)
    } catch (e: any) {
      setError(e?.message || '저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }, [form, mode, onSuccess, siteId])

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      void submit()
    },
    [submit]
  )

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <section className="rounded-lg border border-border/60 bg-card/60 p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground">기본 정보</h3>
          <span className="text-[11px] text-muted-foreground/70">필수 항목을 우선 입력하세요</span>
        </div>
        <div className="grid gap-3 md:grid-cols-12">
          <Field
            htmlFor="site-name"
            label="현장명"
            required
            className="md:col-span-6 xl:col-span-4"
          >
            <Input
              id="site-name"
              className="h-9"
              value={form.name}
              onChange={e => handleChange('name', e.target.value)}
              placeholder="예) 인옵앤씨 현장 A동"
            />
          </Field>
          <Field htmlFor="site-status" label="상태" className="md:col-span-6 xl:col-span-3">
            <CustomSelect value={form.status} onValueChange={v => handleChange('status', v)}>
              <CustomSelectTrigger id="site-status" className="h-9 w-full justify-between">
                <CustomSelectValue placeholder="상태 선택" />
              </CustomSelectTrigger>
              <CustomSelectContent>
                <CustomSelectItem value="planning">준비 중</CustomSelectItem>
                <CustomSelectItem value="active">진행 중</CustomSelectItem>
                <CustomSelectItem value="inactive">중단</CustomSelectItem>
                <CustomSelectItem value="completed">완료</CustomSelectItem>
              </CustomSelectContent>
            </CustomSelect>
          </Field>
          <Field
            htmlFor="site-organization"
            label="소속(시공사)"
            className="md:col-span-6 xl:col-span-4"
          >
            <CustomSelect
              value={form.organization_id || 'none'}
              onValueChange={value =>
                handleChange('organization_id', value === 'none' ? '' : value)
              }
              disabled={organizationLoading}
            >
              <CustomSelectTrigger id="site-organization" className="h-9 w-full justify-between">
                <CustomSelectValue
                  placeholder={organizationLoading ? '소속 불러오는 중...' : '소속 선택'}
                />
              </CustomSelectTrigger>
              <CustomSelectContent>
                <CustomSelectItem value="none">연동 안 함</CustomSelectItem>
                {organizationOptions.map(option => (
                  <CustomSelectItem key={option.id} value={option.id}>
                    {option.name}
                  </CustomSelectItem>
                ))}
              </CustomSelectContent>
            </CustomSelect>
            {organizationError ? (
              <p className="text-[11px] text-destructive mt-1">{organizationError}</p>
            ) : null}
          </Field>
          <Field htmlFor="site-address" label="주소" required className="md:col-span-12">
            <Input
              id="site-address"
              className="h-9"
              value={form.address}
              onChange={e => handleChange('address', e.target.value)}
              placeholder="도로명 주소를 입력하세요"
            />
          </Field>
          <Field
            htmlFor="site-start"
            label="시작일"
            required
            className="md:col-span-6 xl:col-span-3"
          >
            <Input
              id="site-start"
              type="date"
              className="h-9"
              value={form.start_date}
              onChange={e => handleChange('start_date', e.target.value)}
            />
          </Field>
          <Field htmlFor="site-end" label="종료일" className="md:col-span-6 xl:col-span-3">
            <Input
              id="site-end"
              type="date"
              className="h-9"
              value={form.end_date}
              onChange={e => handleChange('end_date', e.target.value)}
            />
          </Field>
          <Field
            htmlFor="site-desc"
            label="현장 메모"
            className="md:col-span-12"
            hint="현장 특징이나 주의사항이 있다면 간단히 메모하세요."
          >
            <Textarea
              id="site-desc"
              value={form.description}
              onChange={e => handleChange('description', e.target.value)}
              rows={3}
              className="min-h-[84px]"
              placeholder="예) 야간 작업 시 안전관리 인원 추가 필요"
            />
          </Field>
        </div>
      </section>

      <section className="rounded-lg border border-border/60 bg-card/60 p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground">담당자 & 연락처</h3>
          <span className="text-[11px] text-muted-foreground/70">
            필요한 연락처만 입력해도 됩니다
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-6">
          <Field htmlFor="site-manager" label="현장관리자" className="md:col-span-2">
            <Input
              id="site-manager"
              className="h-9"
              value={form.manager_name}
              onChange={e => handleChange('manager_name', e.target.value)}
              placeholder="이름"
            />
          </Field>
          <Field htmlFor="site-manager-phone" label="연락처" className="md:col-span-2">
            <Input
              id="site-manager-phone"
              className="h-9"
              inputMode="tel"
              value={form.manager_phone}
              onChange={e => handleChange('manager_phone', e.target.value)}
              placeholder="010-0000-0000"
            />
          </Field>
          <Field htmlFor="site-manager-email" label="이메일" className="md:col-span-2">
            <Input
              id="site-manager-email"
              type="email"
              className="h-9"
              value={form.manager_email}
              onChange={e => handleChange('manager_email', e.target.value)}
              placeholder="manager@example.com"
            />
          </Field>
          <Field htmlFor="site-safety" label="안전관리자" className="md:col-span-2">
            <Input
              id="site-safety"
              className="h-9"
              value={form.safety_manager_name}
              onChange={e => handleChange('safety_manager_name', e.target.value)}
              placeholder="이름"
            />
          </Field>
          <Field htmlFor="site-safety-phone" label="연락처" className="md:col-span-2">
            <Input
              id="site-safety-phone"
              className="h-9"
              inputMode="tel"
              value={form.safety_manager_phone}
              onChange={e => handleChange('safety_manager_phone', e.target.value)}
              placeholder="010-0000-0000"
            />
          </Field>
        </div>
      </section>

      <section className="rounded-lg border border-border/60 bg-card/60 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground">추가 정보</h3>
            <p className="text-[11px] text-muted-foreground/70">
              숙소·문서 첨부 등 부가 정보를 필요할 때만 관리하세요
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowExtras(prev => !prev)}
            className="gap-1 text-xs"
            aria-expanded={showExtras}
          >
            {showExtras ? '접기' : '자세히 보기'}
            <ChevronDown
              className={cn('h-4 w-4 transition-transform', showExtras ? 'rotate-180' : '')}
            />
          </Button>
        </div>

        <div className={cn('mt-4 space-y-5', showExtras ? '' : 'hidden')}>
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground/80">
              숙소 정보
            </h4>
            <div className="grid gap-3 md:grid-cols-6">
              <Field htmlFor="site-acc-name" label="숙소명" className="md:col-span-2">
                <Input
                  id="site-acc-name"
                  className="h-9"
                  value={form.accommodation_name}
                  onChange={e => handleChange('accommodation_name', e.target.value)}
                />
              </Field>
              <Field htmlFor="site-acc-phone" label="연락처" className="md:col-span-2">
                <Input
                  id="site-acc-phone"
                  className="h-9"
                  inputMode="tel"
                  value={form.accommodation_phone}
                  onChange={e => handleChange('accommodation_phone', e.target.value)}
                  placeholder="02-000-0000"
                />
              </Field>
              <Field htmlFor="site-acc-addr" label="주소" className="md:col-span-6">
                <Input
                  id="site-acc-addr"
                  className="h-9"
                  value={form.accommodation_address}
                  onChange={e => handleChange('accommodation_address', e.target.value)}
                />
              </Field>
            </div>
          </div>

          <div className="rounded-md border border-dashed border-border/60 bg-background/60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">문서 링크</p>
                <p className="text-xs text-muted-foreground">
                  공유자료 탭에 등록된 PTW·공도면·진행도면을 바로 확인하세요.
                </p>
              </div>
              {!canViewSharedDocs ? (
                <span className="text-[11px] text-muted-foreground/70">
                  현장을 생성한 후 이용 가능합니다
                </span>
              ) : null}
            </div>
            {!canViewSharedDocs ? (
              <div className="text-xs text-muted-foreground">
                현장을 저장한 뒤 공유자료 탭에서 문서를 등록하면 이곳에서 목록으로 확인할 수
                있습니다.
              </div>
            ) : sharedDocsError ? (
              <div className="text-xs text-destructive">{sharedDocsError}</div>
            ) : sharedDocsLoading ? (
              <div className="text-xs text-muted-foreground">공유자료를 불러오는 중입니다…</div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {renderSharedDocList(
                  'PTW(작업허가서)',
                  sharedDocsByCategory.ptw,
                  '공유자료에 PTW 문서가 없습니다.'
                )}
                {renderSharedDocList(
                  '공도면',
                  sharedDocsByCategory.construction,
                  '공유자료에 공도면 문서가 없습니다.'
                )}
                {renderSharedDocList(
                  '진행도면',
                  sharedDocsByCategory.progress,
                  '공유자료에 진행도면 문서가 없습니다.'
                )}
              </div>
            )}
          </div>
        </div>
        <div
          className={cn(
            'mt-3 rounded-md border border-dashed border-border/50 bg-muted/20 p-3 text-xs text-muted-foreground',
            showExtras ? 'hidden' : ''
          )}
        >
          {hasExtraValues
            ? '추가 정보가 숨겨져 있습니다. 펼쳐서 내용을 확인하거나 수정하세요.'
            : '숙소·문서 첨부 등 추가 항목이 필요하면 펼쳐서 입력하세요.'}
        </div>
      </section>

      <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
        <Button type="submit" disabled={saving}>
          {saving ? '저장 중…' : mode === 'create' ? '현장 생성' : '변경사항 저장'}
        </Button>
      </div>
    </form>
  )
}
