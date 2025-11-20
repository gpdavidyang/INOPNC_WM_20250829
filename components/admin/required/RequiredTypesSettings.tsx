'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import DocumentRequirementsTable from '@/components/admin/DocumentRequirementsTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { useConfirm } from '@/components/ui/use-confirm'
type DocumentType = {
  id: string
  code: string
  name_ko?: string | null
  name_en?: string | null
  description?: string | null
  instructions?: string | null
  file_types?: string[] | null
  max_file_size?: number | null
  is_active?: boolean | null
  sort_order?: number | null
  created_at?: string | null
}

type FormState = {
  code: string
  name_ko: string
  name_en: string
  description: string
  instructions: string
  max_file_size_mb: number
  sort_order: number
  is_active: boolean
}

const DEFAULT_FILE_TYPES = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx']

const DEFAULT_FORM: FormState = {
  code: '',
  name_ko: '',
  name_en: '',
  description: '',
  instructions: '',
  max_file_size_mb: 10,
  sort_order: 0,
  is_active: true,
}

type Props = {
  initialTypes: DocumentType[]
  onTypesUpdated?: (types: DocumentType[]) => void
}

export default function RequiredTypesSettings({ initialTypes, onTypesUpdated }: Props) {
  const [types, setTypes] = useState<DocumentType[]>(initialTypes || [])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<DocumentType | null>(null)
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const { confirm } = useConfirm()

  const setTypesWithNotify = useCallback(
    (next: DocumentType[] | ((prev: DocumentType[]) => DocumentType[])) => {
      setTypes(prev => {
        const resolved = typeof next === 'function' ? next(prev) : next
        onTypesUpdated?.(resolved)
        return resolved
      })
    },
    [onTypesUpdated]
  )

  const sortTypes = useCallback((list: DocumentType[]) => {
    return [...list].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  }, [])

  useEffect(() => {
    setTypesWithNotify(initialTypes || [])
  }, [initialTypes, setTypesWithNotify])

  const loadTypes = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/required-document-types?include_inactive=true', {
        cache: 'no-store',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || '목록을 불러오지 못했습니다.')
      const fetched = Array.isArray(data?.document_types) ? data.document_types : []
      setTypesWithNotify(fetched)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '목록 오류',
        description: error instanceof Error ? error.message : '목록 갱신에 실패했습니다.',
      })
    } finally {
      setLoading(false)
    }
  }, [toast, setTypesWithNotify])

  const openCreate = () => {
    setEditing(null)
    setForm(DEFAULT_FORM)
    setModalOpen(true)
  }

  const openEdit = (row: DocumentType) => {
    setEditing(row)
    setForm({
      code: row.code || '',
      name_ko: row.name_ko || '',
      name_en: row.name_en || '',
      description: row.description || '',
      instructions: row.instructions || '',
      max_file_size_mb: row.max_file_size
        ? Math.round(row.max_file_size / (1024 * 1024))
        : DEFAULT_FORM.max_file_size_mb,
      sort_order: row.sort_order ?? 0,
      is_active: row.is_active ?? true,
    })
    setModalOpen(true)
  }

  const handleInput = (field: keyof FormState, value: string | number | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.code.trim() || !form.name_ko.trim()) {
      toast({
        variant: 'warning',
        title: '필수 정보',
        description: '코드와 국문명을 입력하세요.',
      })
      return
    }
    setSaving(true)
    try {
      const payload = {
        code: form.code.trim(),
        name_ko: form.name_ko.trim(),
        name_en: form.name_en.trim() || null,
        description: form.description.trim() || null,
        instructions: form.instructions.trim() || null,
        file_types: DEFAULT_FILE_TYPES,
        max_file_size:
          Math.max(1, Number(form.max_file_size_mb) || DEFAULT_FORM.max_file_size_mb) * 1024 * 1024,
        sort_order: Number.isFinite(form.sort_order) ? form.sort_order : 0,
        is_active: form.is_active,
      }
      const url = editing
        ? `/api/admin/required-document-types/${editing.id}`
        : '/api/admin/required-document-types'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || '저장에 실패했습니다.')
      const savedType = editing ? (data as DocumentType) : (data?.data as DocumentType | undefined)
      if (savedType) {
        setTypesWithNotify(prev => {
          const next = prev.filter(t => t.id !== savedType.id)
          next.push(savedType)
          return sortTypes(next)
        })
      }
      toast({ title: '저장 완료', description: '변경사항이 적용되었습니다.' })
      setModalOpen(false)
      setEditing(null)
      setForm(DEFAULT_FORM)
      if (!savedType) {
        await loadTypes()
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '저장 오류',
        description: error instanceof Error ? error.message : '저장 중 문제가 발생했습니다.',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (row: DocumentType) => {
    try {
      const res = await fetch(`/api/admin/required-document-types/${row.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !row.is_active }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || '상태 변경 실패')
      toast({
        title: '상태 변경',
        description: `${row.name_ko || row.code} 상태가 업데이트되었습니다.`,
      })
      await loadTypes()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '상태 변경 오류',
        description: error instanceof Error ? error.message : '상태 변경 중 오류가 발생했습니다.',
      })
    }
  }

  const handleDelete = async (row: DocumentType) => {
    const ok = await confirm({
      title: '유형 삭제',
      description: `${row.name_ko || row.code} 유형을 삭제하시겠습니까? 되돌릴 수 없습니다.`,
      confirmText: '삭제',
      cancelText: '취소',
      variant: 'destructive',
    })
    if (!ok) return
    try {
      const res = await fetch(`/api/admin/required-document-types/${row.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || '삭제 실패')
      toast({ title: '삭제 완료', description: '유형이 삭제되었습니다.' })
      await loadTypes()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '삭제 오류',
        description: error instanceof Error ? error.message : '삭제 중 문제가 발생했습니다.',
      })
    }
  }

  const formId = 'required-type-editor'

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">필수서류 유형</h3>
          <p className="text-sm text-muted-foreground">
            모바일/현장 화면과 연동되는 필수서류 유형을 관리합니다.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="compact"
            onClick={loadTypes}
            disabled={loading}
          >
            새로고침
          </Button>
          <Button type="button" size="compact" onClick={openCreate}>
            새 유형 추가
          </Button>
        </div>
      </div>
      {modalOpen ? (
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {editing ? '필수서류 유형 수정' : '필수서류 유형 추가'}
              </h3>
              <p className="text-sm text-muted-foreground">
                파일 형식, 크기 제한 등 세부 설정을 입력하세요.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="compact"
                onClick={() => setModalOpen(false)}
                disabled={saving}
              >
                닫기
              </Button>
              <Button type="submit" form={formId} size="compact" disabled={saving}>
                {saving ? '저장 중...' : '저장'}
              </Button>
            </div>
          </div>
          <div className="px-5 py-5 sm:px-6">
            <form id={formId} className="space-y-3" onSubmit={handleSubmit}>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <div>
                  <Label htmlFor="code">코드</Label>
                  <Input
                    id="code"
                    value={form.code}
                    onChange={e => handleInput('code', e.target.value)}
                    placeholder="예: id-card"
                    required
                    disabled={!!editing}
                    className="h-10 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="name_ko">이름(국문)</Label>
                  <Input
                    id="name_ko"
                    value={form.name_ko}
                    onChange={e => handleInput('name_ko', e.target.value)}
                    required
                    className="h-10 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="name_en">이름(영문)</Label>
                  <Input
                    id="name_en"
                    value={form.name_en}
                    onChange={e => handleInput('name_en', e.target.value)}
                    placeholder="선택 입력"
                    className="h-10 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="sort_order">정렬 순서</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={form.sort_order}
                    onChange={e => handleInput('sort_order', Number(e.target.value))}
                    className="h-10 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="max_file_size">최대 크기(MB)</Label>
                  <Input
                    id="max_file_size"
                    type="number"
                    min={1}
                    value={form.max_file_size_mb}
                    onChange={e => handleInput('max_file_size_mb', Number(e.target.value))}
                    className="h-10 text-sm"
                  />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label htmlFor="description">설명</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={e => handleInput('description', e.target.value)}
                    rows={3}
                    className="min-h-[72px] text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="instructions">제출 안내</Label>
                  <Textarea
                    id="instructions"
                    value={form.instructions}
                    onChange={e => handleInput('instructions', e.target.value)}
                    rows={3}
                    className="min-h-[72px] text-sm"
                  />
                </div>
              </div>
              <div className="rounded-lg border bg-muted/40 px-3 py-2.5 text-sm sm:flex sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">활성 상태</p>
                  <p className="text-xs text-muted-foreground">
                    비활성 시 모바일 화면에서 숨겨집니다.
                  </p>
                </div>
                <Switch
                  checked={form.is_active}
                  onCheckedChange={checked => handleInput('is_active', checked)}
                />
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <div className="rounded-lg border bg-card p-4 shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">목록을 불러오는 중…</div>
        ) : (
          <DocumentRequirementsTable
            types={types}
            onEdit={openEdit}
            onToggleActive={handleToggleActive}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  )
}
