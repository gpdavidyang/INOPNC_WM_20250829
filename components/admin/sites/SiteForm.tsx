'use client'

import { useCallback, useMemo, useState } from 'react'
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
import { useWorkOptions } from '@/hooks/use-work-options'
import type { Site } from '@/types'

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
  status: 'active' | 'inactive' | 'completed'
  start_date: string
  end_date: string
  manager_name: string
  construction_manager_phone: string
  safety_manager_name: string
  safety_manager_phone: string
  accommodation_name: string
  accommodation_address: string
  component_name: string
  work_process: string
  work_section: string
}

const toDateInput = (value?: string | null) => {
  if (!value) return ''
  try {
    // Supports both ISO and "YYYY-MM-DD"; slice for input[type=date]
    return new Date(value).toISOString().slice(0, 10)
  } catch {
    return ''
  }
}

export default function SiteForm({ mode, siteId, initial, onSuccess }: Props) {
  const { componentTypes, processTypes } = useWorkOptions()
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [ptwFile, setPtwFile] = useState<File | null>(null)
  const [ptwUploading, setPtwUploading] = useState(false)

  const [form, setForm] = useState<FormState>(() => ({
    name: initial?.name || '',
    address: initial?.address || '',
    description: String(initial?.description || ''),
    status: (initial?.status as FormState['status']) || 'active',
    start_date: initial?.start_date ? toDateInput(initial.start_date) : '',
    end_date: initial?.end_date ? toDateInput(initial.end_date) : '',
    manager_name: String(initial?.manager_name || ''),
    construction_manager_phone: String(initial?.construction_manager_phone || ''),
    safety_manager_name: String(initial?.safety_manager_name || ''),
    safety_manager_phone: String(initial?.safety_manager_phone || ''),
    accommodation_name: String(initial?.accommodation_name || ''),
    accommodation_address: String(initial?.accommodation_address || ''),
    component_name: String(initial?.component_name || ''),
    work_process: String(initial?.work_process || ''),
    work_section: String(initial?.work_section || ''),
  }))

  const canUploadPTW = mode === 'edit' && !!siteId

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
      const payload: any = {
        ...form,
        // normalize empty strings to null where appropriate
        description: form.description.trim() || null,
        end_date: form.end_date.trim() || null,
        manager_name: form.manager_name.trim() || null,
        construction_manager_phone: form.construction_manager_phone.trim() || null,
        safety_manager_name: form.safety_manager_name.trim() || null,
        safety_manager_phone: form.safety_manager_phone.trim() || null,
        accommodation_name: form.accommodation_name.trim() || null,
        accommodation_address: form.accommodation_address.trim() || null,
        component_name: form.component_name.trim() || null,
        work_process: form.work_process.trim() || null,
        work_section: form.work_section.trim() || null,
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

  const uploadPTW = useCallback(async () => {
    if (!canUploadPTW || !ptwFile) return
    setPtwUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.set('file', ptwFile)
      fd.set('siteId', String(siteId))
      fd.set('documentType', 'ptw')
      const res = await fetch('/api/site-documents/upload', { method: 'POST', body: fd })
      const j = await res.json().catch(() => ({}))
      if (!res.ok || j?.error) throw new Error(j?.error || 'PTW 업로드 실패')
      // no-op success; in future, we might show link
      setPtwFile(null)
    } catch (e: any) {
      setError(e?.message || 'PTW 업로드 실패')
    } finally {
      setPtwUploading(false)
    }
  }, [canUploadPTW, ptwFile, siteId])

  const componentOptions = useMemo(() => componentTypes.map(c => c.option_label), [componentTypes])
  const processOptions = useMemo(() => processTypes.map(p => p.option_label), [processTypes])

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 기본 정보 */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="site-name">현장명 *</Label>
          <Input
            id="site-name"
            value={form.name}
            onChange={e => handleChange('name', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="site-status">상태</Label>
          <CustomSelect value={form.status} onValueChange={v => handleChange('status', v)}>
            <CustomSelectTrigger>
              <CustomSelectValue placeholder="상태 선택" />
            </CustomSelectTrigger>
            <CustomSelectContent>
              <CustomSelectItem value="active">진행 중</CustomSelectItem>
              <CustomSelectItem value="inactive">중단</CustomSelectItem>
              <CustomSelectItem value="completed">완료</CustomSelectItem>
            </CustomSelectContent>
          </CustomSelect>
        </div>
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="site-address">주소 *</Label>
          <Input
            id="site-address"
            value={form.address}
            onChange={e => handleChange('address', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="site-start">시작일 *</Label>
          <Input
            id="site-start"
            type="date"
            value={form.start_date}
            onChange={e => handleChange('start_date', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="site-end">종료일</Label>
          <Input
            id="site-end"
            type="date"
            value={form.end_date}
            onChange={e => handleChange('end_date', e.target.value)}
          />
        </div>
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="site-desc">설명</Label>
          <Textarea
            id="site-desc"
            value={form.description}
            onChange={e => handleChange('description', e.target.value)}
            rows={3}
          />
        </div>
      </section>

      {/* 담당자 */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="site-manager">현장관리자</Label>
          <Input
            id="site-manager"
            value={form.manager_name}
            onChange={e => handleChange('manager_name', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="site-manager-phone">현장관리자 연락처</Label>
          <Input
            id="site-manager-phone"
            inputMode="tel"
            value={form.construction_manager_phone}
            onChange={e => handleChange('construction_manager_phone', e.target.value)}
            placeholder="010-0000-0000"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="site-safety">안전관리자</Label>
          <Input
            id="site-safety"
            value={form.safety_manager_name}
            onChange={e => handleChange('safety_manager_name', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="site-safety-phone">안전관리자 연락처</Label>
          <Input
            id="site-safety-phone"
            inputMode="tel"
            value={form.safety_manager_phone}
            onChange={e => handleChange('safety_manager_phone', e.target.value)}
            placeholder="010-0000-0000"
          />
        </div>
      </section>

      {/* 숙소 */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="site-acc-name">숙소명</Label>
          <Input
            id="site-acc-name"
            value={form.accommodation_name}
            onChange={e => handleChange('accommodation_name', e.target.value)}
          />
        </div>
        <div className="space-y-2 md:col-span-1">
          <Label htmlFor="site-acc-addr">숙소 주소</Label>
          <Input
            id="site-acc-addr"
            value={form.accommodation_address}
            onChange={e => handleChange('accommodation_address', e.target.value)}
          />
        </div>
      </section>

      {/* 작업 옵션 */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>부재명</Label>
          <CustomSelect
            value={form.component_name?.startsWith('기타:') ? '기타' : form.component_name || ''}
            onValueChange={v => {
              if (v === '기타') handleChange('component_name', '기타:')
              else handleChange('component_name', v)
            }}
          >
            <CustomSelectTrigger>
              <CustomSelectValue placeholder="선택" />
            </CustomSelectTrigger>
            <CustomSelectContent>
              {componentOptions.map(label => (
                <CustomSelectItem key={label} value={label}>
                  {label}
                </CustomSelectItem>
              ))}
              <CustomSelectItem value="기타">기타</CustomSelectItem>
            </CustomSelectContent>
          </CustomSelect>
          {form.component_name?.startsWith('기타:') && (
            <Input
              className="mt-2"
              value={form.component_name.replace('기타:', '')}
              onChange={e => handleChange('component_name', '기타:' + e.target.value)}
              placeholder="기타 부재명 입력"
            />
          )}
        </div>

        <div className="space-y-2">
          <Label>작업공정</Label>
          <CustomSelect
            value={form.work_process?.startsWith('기타:') ? '기타' : form.work_process || ''}
            onValueChange={v => {
              if (v === '기타') handleChange('work_process', '기타:')
              else handleChange('work_process', v)
            }}
          >
            <CustomSelectTrigger>
              <CustomSelectValue placeholder="선택" />
            </CustomSelectTrigger>
            <CustomSelectContent>
              {processOptions.map(label => (
                <CustomSelectItem key={label} value={label}>
                  {label}
                </CustomSelectItem>
              ))}
              <CustomSelectItem value="기타">기타</CustomSelectItem>
            </CustomSelectContent>
          </CustomSelect>
          {form.work_process?.startsWith('기타:') && (
            <Input
              className="mt-2"
              value={form.work_process.replace('기타:', '')}
              onChange={e => handleChange('work_process', '기타:' + e.target.value)}
              placeholder="기타 작업공정 입력"
            />
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="work-section">작업구간</Label>
          <Input
            id="work-section"
            value={form.work_section}
            onChange={e => handleChange('work_section', e.target.value)}
            placeholder="예: A동"
          />
        </div>
      </section>

      {/* PTW 업로드 */}
      <section className="space-y-2">
        <Label>PTW(작업허가서)</Label>
        {canUploadPTW ? (
          <div className="flex items-center gap-3">
            <Input
              type="file"
              accept="application/pdf,image/*"
              onChange={e => setPtwFile(e.target.files?.[0] || null)}
            />
            <Button type="button" onClick={uploadPTW} disabled={!ptwFile || ptwUploading}>
              {ptwUploading ? '업로드 중…' : 'PTW 업로드'}
            </Button>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">현장 생성 후 업로드할 수 있습니다.</div>
        )}
      </section>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" onClick={submit} disabled={saving}>
          {saving ? '저장 중…' : mode === 'create' ? '현장 생성' : '변경사항 저장'}
        </Button>
      </div>
    </div>
  )
}
