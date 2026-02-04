'use client'

import DocumentRequirementsTable from '@/components/admin/DocumentRequirementsTable'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useConfirm } from '@/components/ui/use-confirm'
import { useToast } from '@/components/ui/use-toast'
import { generateEnglishNameFromCode } from '@/lib/documents/required-document-types'
import { cn } from '@/lib/utils'
import { FileEdit, Info, Plus, RefreshCw, Save, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

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

  const resolveEnglishName = useCallback(
    (codeValue: string) => {
      const derived = generateEnglishNameFromCode(codeValue)
      if (!editing) return derived

      const originalCode = (editing.code || '').trim()
      const currentCode = codeValue.trim()
      const existingName = (editing.name_en || '').trim()

      if (existingName && originalCode === currentCode) {
        return existingName
      }

      return derived
    },
    [editing]
  )

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
      const autoNameEn = resolveEnglishName(form.code)
      const payload = {
        code: form.code.trim(),
        name_ko: form.name_ko.trim(),
        name_en: autoNameEn || null,
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <div className="w-1.5 h-6 bg-blue-600 rounded-sm" />
            필수서류 유형 관리
          </h2>
          <p className="text-sm text-gray-500 ml-3.5 font-medium">
            모바일 및 배정 시스템에서 요구하는 서류 유형을 구성합니다.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-xl px-4 border-gray-200 font-bold"
            onClick={loadTypes}
            disabled={loading}
          >
            새로고침
          </Button>
          <Button
            type="button"
            className="h-10 rounded-xl px-4 gap-2 bg-[#1A254F] hover:bg-[#1A254F]/90"
            onClick={openCreate}
          >
            <Plus className="w-4 h-4" />새 유형 추가
          </Button>
        </div>
      </div>

      {modalOpen && (
        <Card className="rounded-3xl border-blue-200 bg-blue-50/30 overflow-hidden shadow-md shadow-blue-100/20">
          <div className="flex items-center justify-between border-b border-blue-100/50 px-6 py-4 bg-white/50 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-xl text-white">
                <FileEdit className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {editing ? '서류 유형 수정' : '새 서류 유형 등록'}
                </h3>
                <p className="text-[11px] font-semibold text-blue-600/70 uppercase tracking-tighter">
                  {editing ? 'Edit Document Requirement' : 'Create New Requirement'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                className="h-10 rounded-xl px-4 gap-2 text-gray-500 hover:bg-white/60"
                onClick={() => setModalOpen(false)}
                disabled={saving}
              >
                <X className="w-4 h-4" />
                닫기
              </Button>
              <Button
                type="submit"
                form={formId}
                className="h-10 rounded-xl px-6 gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200"
                disabled={saving}
              >
                <Save className="w-4 h-4" />
                {saving ? '저장 중...' : '설정 저장'}
              </Button>
            </div>
          </div>
          <CardContent className="p-6">
            <form id={formId} className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="code"
                    className="text-[11px] font-semibold text-muted-foreground tracking-tight ml-1"
                  >
                    식별 코드 (고유)
                  </Label>
                  <Input
                    id="code"
                    value={form.code}
                    onChange={e => handleInput('code', e.target.value)}
                    placeholder="예: id-card"
                    required
                    disabled={!!editing}
                    className="h-10 rounded-xl bg-white border-none shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500 font-medium"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="name_ko"
                    className="text-[11px] font-semibold text-muted-foreground tracking-tight ml-1"
                  >
                    유형 명칭 (국문)
                  </Label>
                  <Input
                    id="name_ko"
                    value={form.name_ko}
                    onChange={e => handleInput('name_ko', e.target.value)}
                    placeholder="예: 신분증 사본"
                    required
                    className="h-10 rounded-xl bg-white border-none shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500 font-medium"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="sort_order"
                    className="text-[11px] font-semibold text-muted-foreground tracking-tight ml-1"
                  >
                    노출 순서
                  </Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={form.sort_order}
                    onChange={e => handleInput('sort_order', Number(e.target.value))}
                    className="h-10 rounded-xl bg-white border-none shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500 font-medium"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="max_file_size"
                    className="text-[11px] font-semibold text-muted-foreground tracking-tight ml-1"
                  >
                    최대 용량 (MB)
                  </Label>
                  <div className="relative">
                    <Input
                      id="max_file_size"
                      type="number"
                      min={1}
                      value={form.max_file_size_mb}
                      onChange={e => handleInput('max_file_size_mb', Number(e.target.value))}
                      className="h-10 rounded-xl bg-white border-none shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500 font-medium pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold opacity-30">
                      MB
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="description"
                    className="text-[11px] font-semibold text-muted-foreground tracking-tight ml-1"
                  >
                    세부 설명
                  </Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={e => handleInput('description', e.target.value)}
                    placeholder="이 서류 유형에 대한 간단한 설명을 입력하세요."
                    rows={3}
                    className="min-h-[80px] rounded-xl bg-white border-none shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500 font-medium"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="instructions"
                    className="text-[11px] font-semibold text-muted-foreground tracking-tight ml-1"
                  >
                    제출 지침 (사용자 안내용)
                  </Label>
                  <Textarea
                    id="instructions"
                    value={form.instructions}
                    onChange={e => handleInput('instructions', e.target.value)}
                    placeholder="사용자가 서류를 준비할 때 주의해야 할 사항을 입력하세요."
                    rows={3}
                    className="min-h-[80px] rounded-xl bg-white border-none shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="bg-white/50 p-4 rounded-2xl flex items-center justify-between border border-blue-100/30">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'p-1.5 rounded-lg text-white',
                      form.is_active ? 'bg-emerald-500' : 'bg-gray-400'
                    )}
                  >
                    <Info className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-900">시스템 활성화 상태</span>
                    <p className="text-[11px] text-gray-500 font-medium">
                      활성화 시 즉시 사용자 앱 및 관리자 화면에 반영됩니다.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'text-sm font-bold italic uppercase',
                      form.is_active ? 'text-emerald-600' : 'text-gray-400'
                    )}
                  >
                    {form.is_active ? 'Active' : 'Hidden'}
                  </span>
                  <Switch
                    checked={form.is_active}
                    onCheckedChange={checked => handleInput('is_active', checked)}
                  />
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="pt-4">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin opacity-20" />
            <p className="text-sm font-medium">유형 목록을 불러오는 중...</p>
          </div>
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
