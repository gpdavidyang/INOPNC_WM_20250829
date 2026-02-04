'use client'

import { FileActionMenu } from '@/components/files/FileActionButtons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { Textarea } from '@/components/ui/textarea'
import { useConfirm } from '@/components/ui/use-confirm'
import { useToast } from '@/components/ui/use-toast'
import {
    DEFAULT_COMPANY_DOCUMENT_TYPES,
    buildCompanyDocTypeMap,
    type CompanyDocumentType,
} from '@/lib/documents/company-types'
import { cn } from '@/lib/utils'
import {
    AlertCircle,
    CheckCircle2,
    Edit2,
    FileText,
    LayoutGrid,
    List,
    Plus,
    RefreshCcw,
    Settings,
    Trash2,
    X
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type Row = {
  id: string
  title?: string
  file_name?: string
  file_url?: string
  storage_bucket?: string | null
  storage_path?: string | null
  folder_path?: string | null
  metadata?: Record<string, any> | null
  document_type?: string
  tags?: string[]
  created_at?: string
  file_size?: number
  mime_type?: string
  description?: string
}

const MAX_COMPANY_DOC_SLUG_LENGTH = 64

const slugifyDocTypeName = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s/]+/g, '_')
    .replace(/[^a-z0-9_-]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, MAX_COMPANY_DOC_SLUG_LENGTH)

const ensureSlugLength = (value: string): string => {
  const trimmed = value.replace(/_+$/g, '')
  if (trimmed.length >= 2) return trimmed.slice(0, MAX_COMPANY_DOC_SLUG_LENGTH)
  if (!trimmed) return 'doc'
  return (trimmed + 'xx').slice(0, 2)
}

const buildSlugCandidate = (base: string, suffix: number): string => {
  const suffixText = suffix === 0 ? '' : `_${suffix}`
  const maxBaseLength = Math.max(2, MAX_COMPANY_DOC_SLUG_LENGTH - suffixText.length)
  const sanitizedBase = (base || 'doc').slice(0, maxBaseLength).replace(/_+$/g, '') || 'doc'
  return ensureSlugLength(`${sanitizedBase}${suffixText}`)
}

const generateCompanyDocSlug = (label: string, usedSlugs: Iterable<string>): string => {
  const used = new Set<string>()
  Array.from(usedSlugs).forEach(slug => {
    if (typeof slug === 'string') {
      used.add(slug.toLowerCase())
    }
  })
  const base = slugifyDocTypeName(label) || 'doc'
  let suffix = 0
  while (suffix < 10_000) {
    const candidate = buildSlugCandidate(base, suffix)
    if (!used.has(candidate)) return candidate
    suffix += 1
  }
  return `doc_${Math.random().toString(36).slice(2, 8)}`
}

export default function AdminCompanyDocumentsPage() {
  const { toast } = useToast()
  const [docTypes, setDocTypes] = useState<(CompanyDocumentType & { documents?: Row[] })[]>([])
  const [typesLoading, setTypesLoading] = useState(true)
  const [typeFormOpen, setTypeFormOpen] = useState(false)
  const [editingType, setEditingType] = useState<CompanyDocumentType | null>(null)
  const [typeForm, setTypeForm] = useState({
    slug: '',
    name: '',
    description: '',
    display_order: 100,
    is_required: false,
    is_active: true,
  })
  const [busy, setBusy] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [msg, setMsg] = useState('')
  const [unmatchedDocs, setUnmatchedDocs] = useState<Row[]>([])
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({})
  
  const existingSlugs = useMemo(
    () => docTypes.map(type => type.slug).filter(Boolean) as string[],
    [docTypes]
  )

  const loadDocTypes = useCallback(async (activeOnly = false, includeDocs = false) => {
    setTypesLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeOnly) params.set('active', 'true')
      if (includeDocs) params.set('include_docs', 'true')
      const res = await fetch(
        `/api/company-doc-types${params.toString() ? `?${params.toString()}` : ''}`,
        {
          credentials: 'include',
        }
      )
      const json = await res.json().catch(() => null)
      if (res.ok && Array.isArray(json?.data)) {
        setDocTypes(json.data)
        if (includeDocs) {
          const unmatched = Array.isArray(json?.unmatchedDocuments) ? json.unmatchedDocuments : []
          setUnmatchedDocs(unmatched)
        }
        return
      }
    } catch (error) {
      console.warn('회사 문서 유형 불러오기 실패', error)
    } finally {
      setTypesLoading(false)
    }
    setDocTypes(DEFAULT_COMPANY_DOCUMENT_TYPES)
    if (includeDocs) setUnmatchedDocs([])
  }, [])

  useEffect(() => {
    loadDocTypes(false, true)
  }, [loadDocTypes])

  const typeMap = useMemo(() => buildCompanyDocTypeMap(docTypes), [docTypes])

  useEffect(() => {
    docTypes.forEach(type => {
      if (!fileInputs.current[type.slug]) {
        fileInputs.current[type.slug] = null
      }
    })
  }, [docTypes])

  const toFileRecord = useCallback(
    (row: Row) => ({
      file_url: row.file_url,
      storage_bucket: row.storage_bucket || (row.metadata as any)?.storage_bucket,
      storage_path: row.storage_path || row.folder_path || (row.metadata as any)?.storage_path,
      file_name: row.file_name || row.title,
      title: row.title || row.file_name || '회사 문서',
    }),
    []
  )

  const openCreateTypeForm = () => {
    setEditingType(null)
    setTypeForm({
      slug: '',
      name: '',
      description: '',
      display_order: 100,
      is_required: false,
      is_active: true,
    })
    setTypeFormOpen(true)
  }

  const openEditTypeForm = (type: CompanyDocumentType) => {
    setEditingType(type)
    setTypeForm({
      slug: type.slug,
      name: type.name,
      description: type.description || '',
      display_order: type.display_order,
      is_required: type.is_required,
      is_active: type.is_active,
    })
    setTypeFormOpen(true)
  }

  const closeTypeForm = () => {
    setTypeFormOpen(false)
    setEditingType(null)
  }

  const submitTypeForm = async () => {
    try {
      const payload = {
        ...typeForm,
        display_order: Number(typeForm.display_order) || 100,
      }
      const res = await fetch(
        editingType ? `/api/company-doc-types/${editingType.id}` : '/api/company-doc-types',
        {
          method: editingType ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        }
      )
      const json = await res.json().catch(() => null)
      if (!res.ok || json?.error) {
        throw new Error(json?.error || '저장 실패')
      }
      toast({
        title: '유형 저장 완료',
        description: editingType ? '회사 문서 유형을 수정했습니다.' : '새 회사 문서 유형을 추가했습니다.',
      })
      closeTypeForm()
      await loadDocTypes(false, true)
    } catch (error: any) {
      toast({
        title: '유형 저장 실패',
        description: error?.message || '회사 문서 유형을 저장하지 못했습니다.',
        variant: 'destructive',
      })
    }
  }

  const handleToggleTypeActive = async (type: CompanyDocumentType, active: boolean) => {
    try {
      const res = await fetch(`/api/company-doc-types/${type.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_active: active }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || json?.error) throw new Error(json?.error || '토글 실패')
      toast({
        title: active ? '유형 활성화' : '유형 비활성화',
        description: `${type.name} 상태를 변경했습니다.`,
      })
      await loadDocTypes(false, true)
    } catch (error: any) {
      toast({
        title: '상태 변경 실패',
        description: error?.message || '회사 문서 유형 상태를 변경하지 못했습니다.',
        variant: 'destructive',
      })
    }
  }

  const onPick = (slug: string) => fileInputs.current[slug]?.click()

  const onFile = async (slug: string, f?: File) => {
    if (!f) return
    setBusy(true)
    setMsg('')
    try {
      const form = new FormData()
      form.append('file', f)
      form.append('categoryType', 'shared')
      form.append('title', f.name)
      form.append('tags', `company_slug:${slug}`)
      form.append('companyDocSlug', slug)
      const docType = typeMap[slug]
      if (docType?.id) {
        form.append('companyDocTypeId', docType.id)
      }
      const res = await fetch('/api/unified-documents/v2/upload', {
        method: 'POST',
        body: form,
        credentials: 'include',
      })
      let data: any = null
      let raw = ''
      try {
        data = await res.json()
      } catch {
        try {
          raw = await res.text()
        } catch { /* ignore */ }
      }
      if (!res.ok || data?.error) {
        const detail = data?.details || data?.error || raw || res.statusText || '업로드 실패'
        throw new Error(`${res.status} ${detail}`)
      }
      const label = docType?.name || slug
      setMsg(`${label} 업로드 완료`)
      toast({ title: '업로드 완료', description: `${label} 업로드가 완료되었습니다.` })
      await loadDocTypes(false, true)
    } catch (e: any) {
      console.error('회사서류 업로드 실패:', e)
      setMsg(e?.message || '업로드 실패')
      toast({ title: '업로드 실패', description: e?.message || '업로드 실패', variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  const { confirm } = useConfirm()

  useEffect(() => {
    if (!typeFormOpen || editingType) return
    const trimmed = typeForm.name.trim()
    if (!trimmed) {
      if (typeForm.slug) setTypeForm(f => ({ ...f, slug: '' }))
      return
    }
    const nextSlug = generateCompanyDocSlug(trimmed, existingSlugs)
    if (nextSlug !== typeForm.slug) {
      setTypeForm(f => ({ ...f, slug: nextSlug }))
    }
  }, [typeForm.name, typeForm.slug, typeFormOpen, editingType, existingSlugs])

  const onDelete = async (id: string) => {
    const ok = await confirm({
      title: '삭제',
      description: '해당 문서를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
      confirmText: '삭제',
      cancelText: '취소',
      variant: 'destructive',
    })
    if (!ok) return
    setBusy(true)
    try {
      const res = await fetch(`/api/unified-documents/v2/${encodeURIComponent(id)}?hard=true`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const j = await res.json()
      if (!res.ok || j?.error) throw new Error(j?.error || '삭제 실패')
      await loadDocTypes(false, true)
    } catch (e: any) {
      toast({ title: '삭제 실패', description: e?.message || '삭제 실패', variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  // --- Stats Section ---
  const stats = useMemo(() => {
    const activeTypes = docTypes.filter(t => t.is_active).length
    const requiredTypes = docTypes.filter(t => t.is_required && t.is_active).length
    const totalDocs = docTypes.reduce((acc, t) => acc + (t.documents?.length || 0), 0)
    return [
      { label: '활성 유형', value: activeTypes, unit: '종', bg: 'bg-indigo-50/50', text: 'text-indigo-600' },
      { label: '필수 문서', value: requiredTypes, unit: '종', bg: 'bg-amber-50/50', text: 'text-amber-600' },
      { label: '전체 문서', value: totalDocs, unit: '건', bg: 'bg-blue-50/50', text: 'text-blue-600' },
      { label: '미분류', value: unmatchedDocs.length, unit: '건', bg: 'bg-rose-50/50', text: 'text-rose-600' },
    ]
  }, [docTypes, unmatchedDocs])

  return (
    <div className="px-0 pb-12 space-y-6">
      <PageHeader
        title="이노피앤씨 설정"
        description="회사의 핵심 서류(사업자등록증, 통장사본 등)와 관리 유형을 통합 관리합니다."
        breadcrumbs={[
          { label: '대시보드', href: '/dashboard/admin' },
          { label: '회사 관리' },
          { label: '이노피앤씨 설정' }
        ]}
      />

      <div className="px-4 sm:px-6 lg:px-8 space-y-8">
        {/* 1. Stats Grid (v1.66 Silent Efficiency) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <Card key={idx} className={cn('rounded-2xl border-none shadow-sm shadow-gray-200/40 overflow-hidden', stat.bg)}>
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">{stat.label}</p>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className={cn('text-2xl font-bold tracking-tight', stat.text)}>{stat.value}</span>
                  <span className="text-xs font-bold text-slate-400">{stat.unit}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 2. Management Container (회사 서류 관리) */}
        <Card className="rounded-3xl border-gray-200 shadow-sm shadow-gray-200/50 overflow-hidden">
          <CardHeader className="border-b border-gray-100 bg-gray-50/30 px-6 py-6 sm:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-[#1A254F] flex items-center gap-2">
                  <Settings className="w-5 h-5 text-indigo-500" />
                  회사 서류 관리
                </h2>
                <p className="text-sm font-medium text-slate-400">
                  각 유형별 서류를 업로드하거나 새로운 관리 유형을 정의합니다.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center p-1 bg-slate-100 rounded-xl mr-2">
                  <Button
                    size="icon"
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      "h-8 w-8 rounded-lg transition-all",
                      viewMode === 'grid' ? "bg-white text-indigo-600 shadow-sm hover:bg-white" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    onClick={() => setViewMode('list')}
                    className={cn(
                      "h-8 w-8 rounded-lg transition-all",
                      viewMode === 'list' ? "bg-white text-indigo-600 shadow-sm hover:bg-white" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
                <Button 
                  onClick={() => loadDocTypes(false, true)}
                  variant="outline"
                  size="sm"
                  className="h-10 rounded-xl border-slate-200 text-slate-600 font-bold px-4 hover:bg-slate-50 transition-all"
                >
                  새로고침
                </Button>
                <Button 
                  onClick={openCreateTypeForm}
                  className="h-10 rounded-xl bg-[#1A254F] hover:bg-[#2A355F] text-white font-bold px-6 shadow-sm transition-all gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  유형 추가
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 sm:p-8 space-y-8">
            {msg && (
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center gap-3 text-indigo-700 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                {msg}
              </div>
            )}

            {/* Create/Edit Form */}
            {typeFormOpen && (
              <div className="mb-8 p-6 sm:p-8 rounded-3xl border border-indigo-100 bg-indigo-50/20 shadow-xl shadow-indigo-100/10 animate-in fade-in slide-in-from-top-4 duration-300 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-[#1A254F]">
                      {editingType ? '회사 문서 유형 수정' : '새 회사 문서 유형 추가'}
                    </h3>
                    <p className="text-sm font-medium text-slate-400">
                      {editingType ? '기존 유형의 설정을 변경합니다.' : '이름을 입력하면 시스템 ID가 자동 생성됩니다.'}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={closeTypeForm} className="rounded-full text-slate-400">
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tight ml-1">유형 명칭</label>
                    <Input
                      className="h-11 rounded-xl bg-white border-slate-200 text-sm font-bold focus:ring-indigo-100 shadow-sm"
                      placeholder="예: 사업자등록증"
                      value={typeForm.name}
                      onChange={e => setTypeForm(f => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tight ml-1">시스템 ID (Slug)</label>
                    <Input
                      className="h-11 rounded-xl bg-slate-50 border-slate-100 text-xs font-mono font-bold text-slate-400 cursor-not-allowed"
                      value={typeForm.slug}
                      readOnly
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tight ml-1">상세 설명</label>
                  <Textarea
                    className="rounded-2xl bg-white border-slate-200 text-sm font-medium focus:ring-indigo-100 min-h-[100px]"
                    placeholder="관리 목적이나 주의사항을 적어주세요."
                    value={typeForm.description}
                    onChange={e => setTypeForm(f => ({ ...f, description: e.target.value }))}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-8 bg-white/50 p-4 rounded-2xl border border-white">
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">정렬 순서</label>
                    <Input
                      type="number"
                      className="w-20 h-9 rounded-lg border-slate-200 text-center font-bold"
                      value={typeForm.display_order}
                      onChange={e => setTypeForm(f => ({ ...f, display_order: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="flex items-center gap-2 px-1">
                    <input 
                      type="checkbox"
                      id="is_required" 
                      checked={typeForm.is_required} 
                      onChange={(e) => setTypeForm(f => ({ ...f, is_required: e.target.checked }))}
                      className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                    />
                    <label htmlFor="is_required" className="text-sm font-bold text-slate-600 cursor-pointer">필수 업로드 문서</label>
                  </div>
                  <div className="flex items-center gap-2 px-1">
                    <input 
                      type="checkbox"
                      id="is_active" 
                      checked={typeForm.is_active} 
                      onChange={(e) => setTypeForm(f => ({ ...f, is_active: e.target.checked }))}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                    />
                    <label htmlFor="is_active" className="text-sm font-bold text-slate-600 cursor-pointer">유형 활성화</label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="ghost" onClick={closeTypeForm} className="h-11 rounded-xl font-bold text-slate-400">취소</Button>
                  <Button 
                    onClick={() => void submitTypeForm()}
                    className="h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 shadow-md"
                    disabled={!typeForm.name || !typeForm.slug}
                  >
                    유형 정보 저장
                  </Button>
                </div>
              </div>
            )}

            {/* Type Cards Area */}
            <div className={cn(
              "gap-6",
              viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "flex flex-col"
            )}>
              {typesLoading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className={cn("rounded-3xl bg-slate-50 animate-pulse border border-slate-100", viewMode === 'grid' ? "h-64" : "h-24")} />
                ))
              ) : docTypes.length === 0 ? (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-100 rounded-3xl text-slate-400 font-medium">
                  등록된 회사 문서 유형이 없습니다.
                </div>
              ) : (
                docTypes.map(type => {
                  const docsForType = (Array.isArray(type.documents) ? type.documents : []).slice()
                    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
                  
                  const isRequired = type.is_required
                  const isActive = type.is_active

                  return (
                    <Card 
                      key={type.slug} 
                      className={cn(
                        "rounded-3xl border-slate-200/60 shadow-sm shadow-gray-200/40 overflow-hidden group transition-all duration-300 hover:shadow-xl hover:translate-y-[-4px]",
                        !isActive && "opacity-60 bg-slate-50/50 grayscale-[0.3]",
                        viewMode === 'list' && "flex flex-col md:flex-row"
                      )}
                    >
                      <CardHeader className={cn(
                        "p-6 border-slate-50 relative bg-white group-hover:bg-slate-50/30 transition-colors",
                        viewMode === 'grid' ? "border-b" : "border-r md:w-1/3 flex-shrink-0"
                      )}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <CardTitle className="text-base font-bold text-[#1A254F] truncate">{type.name}</CardTitle>
                              {isRequired && <Badge variant="warning" className="h-4 px-1.5 rounded-full text-[10px] font-bold">필수</Badge>}
                              {!isActive && <Badge variant="secondary" className="h-4 px-1.5 rounded-full text-[10px] font-bold">미활성</Badge>}
                            </div>
                            {type.description && <CardDescription className="text-xs font-medium text-slate-400 line-clamp-2">{type.description}</CardDescription>}
                          </div>
                          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              onClick={() => openEditTypeForm(type)} 
                              className="h-8 w-8 rounded-lg hover:bg-white text-slate-400 hover:text-indigo-600 shadow-sm"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              onClick={() => handleToggleTypeActive(type, !type.is_active)} 
                              className="h-8 w-8 rounded-lg hover:bg-white text-slate-400 hover:text-indigo-600 shadow-sm"
                            >
                              <RefreshCcw className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className={cn(
                        "p-6 space-y-4 bg-white/40",
                        viewMode === 'list' ? "flex-1 flex flex-col md:flex-row md:items-center gap-6" : "flex flex-col"
                      )}>
                        <div className={cn(
                          "space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1",
                          viewMode === 'list' ? "flex-1 h-full" : "w-full"
                        )}>
                          {docsForType.length === 0 ? (
                            <div className="py-4 text-center rounded-2xl bg-slate-50/50 border border-dashed border-slate-200">
                              <p className="text-[11px] font-bold text-slate-300">비어 있음</p>
                            </div>
                          ) : (
                            docsForType.map(doc => (
                              <div key={doc.id} className={cn(
                                "flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-100 shadow-sm group/doc hover:border-indigo-100 transition-all",
                                viewMode === 'list' ? "w-full" : ""
                              )}>
                                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                                  <FileText className="w-4 h-4 text-indigo-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-slate-700 truncate">{doc.title || doc.file_name || '문서'}</p>
                                  <p className="text-[10px] font-medium text-slate-300">
                                    {doc.created_at ? new Date(doc.created_at).toLocaleDateString('ko-KR') : '-'}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1">
                                  <FileActionMenu
                                    document={toFileRecord(doc)}
                                    buttonVariant="premium"
                                    buttonClassName="px-3 h-8 gap-1.5"
                                  />
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    onClick={() => onDelete(doc.id!)}
                                    className="h-8 w-8 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        
                        <div className={cn(
                          "shrink-0",
                          viewMode === 'list' ? "md:w-48" : "w-full pt-2"
                        )}>
                          <Button 
                            onClick={() => onPick(type.slug)} 
                            disabled={!isActive || busy}
                            className="w-full h-10 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-sm shadow-sm transition-all"
                          >
                            문서 업로드
                          </Button>
                          <input
                            ref={el => (fileInputs.current[type.slug] = el)}
                            type="file"
                            hidden
                            onChange={e => onFile(type.slug, e.target.files?.[0] || undefined)}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}

              {/* Unmatched Docs */}
              {unmatchedDocs.length > 0 && (
                <Card className="rounded-3xl border-rose-100 bg-rose-50/10 shadow-sm overflow-hidden flex flex-col">
                  <CardHeader className="p-6 bg-white/80 border-b border-rose-50">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base font-bold text-rose-700 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          미분류 회사 문서
                        </CardTitle>
                        <CardDescription className="text-xs font-medium text-rose-400 line-clamp-1">회사 문서 태그가 없는 독립 문서입니다.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                    {unmatchedDocs.map(doc => (
                      <div key={doc.id} className="p-3 rounded-2xl bg-white border border-rose-50 shadow-sm space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-700 truncate">{doc.title || doc.file_name || '문서'}</p>
                            <p className="text-[10px] font-medium text-slate-300">
                              {doc.created_at ? new Date(doc.created_at).toLocaleDateString('ko-KR') : '-'}
                            </p>
                          </div>
                          <Button size="icon" variant="ghost" onClick={() => onDelete(doc.id!)} className="h-6 w-6 text-rose-300 hover:text-rose-500 hover:bg-rose-50"><Trash2 className="w-3 h-3" /></Button>
                        </div>
                        <FileActionMenu
                          document={toFileRecord(doc)}
                          buttonVariant="premium"
                          buttonClassName="flex-1 h-8 gap-1.5"
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
