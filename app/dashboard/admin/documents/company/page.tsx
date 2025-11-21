'use client'
import React from 'react'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useConfirm } from '@/components/ui/use-confirm'
import { PageHeader } from '@/components/ui/page-header'
import { useToast } from '@/components/ui/use-toast'
import {
  DEFAULT_COMPANY_DOCUMENT_TYPES,
  buildCompanyDocTypeMap,
  type CompanyDocumentType,
} from '@/lib/documents/company-types'
import { FileActionMenu } from '@/components/files/FileActionButtons'

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
  const [msg, setMsg] = useState('')
  const [unmatchedDocs, setUnmatchedDocs] = useState<Row[]>([])
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({})
  const fileActionButtonClass =
    'inline-flex items-center justify-center min-w-[80px] px-3 py-1 text-[11px] font-medium rounded border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-400 disabled:opacity-50'

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
    // ensure file input refs map keeps valid entries
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
      // 회사서류 유형을 태그로 저장하여 모바일/관리자에서 구분 가능하도록 함
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
        } catch {
          /* ignore */
        }
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

  return (
    <div className="px-0 pb-8">
      <PageHeader
        title="이노피앤씨 설정"
        description="사업자등록증/통장사본/NPC-1000/완료확인서 및 유형 관리"
        breadcrumbs={[{ label: '대시보드', href: '/dashboard/admin' }, { label: '시스템' }, { label: '이노피앤씨 설정' }]}
        showBackButton
        backButtonHref="/dashboard/admin/system"
      />
      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold">회사 문서 유형</h1>
            <p className="text-xs text-muted-foreground">
              각 유형에서 바로 문서를 업로드하고 관리할 수 있습니다.
            </p>
          </div>
          <button
            className="px-3 py-1.5 text-xs rounded-md border"
            onClick={openCreateTypeForm}
            disabled={typesLoading}
          >
            + 유형 추가
          </button>
        </div>
        {msg && <div className="text-xs text-blue-600">{msg}</div>}
        {typeFormOpen && !editingType && (
          <section className="rounded-lg border bg-card p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">새 회사 문서 유형</h2>
                <p className="text-sm text-muted-foreground">
                  한글 이름과 문서유형 ID를 입력해 새로운 카테고리를 추가하세요.
                </p>
              </div>
              <button className="text-sm text-muted-foreground" onClick={closeTypeForm}>
                닫기
              </button>
            </div>
            <div className="space-y-3">
              <label className="flex flex-col gap-1 text-sm">
                <span>이름</span>
                <input
                  className="border rounded px-2 py-1 text-sm"
                  value={typeForm.name}
                  onChange={e => setTypeForm(f => ({ ...f, name: e.target.value }))}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span>문서유형 ID (영문/숫자/하이픈)</span>
                <input
                  className="border rounded px-2 py-1 text-sm"
                  value={typeForm.slug}
                  onChange={e => setTypeForm(f => ({ ...f, slug: e.target.value }))}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span>설명</span>
                <textarea
                  className="border rounded px-2 py-1 text-sm"
                  rows={3}
                  value={typeForm.description}
                  onChange={e => setTypeForm(f => ({ ...f, description: e.target.value }))}
                />
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-sm">
                  <span>정렬 순서</span>
                  <input
                    type="number"
                    className="border rounded px-2 py-1 text-sm"
                    value={typeForm.display_order}
                    onChange={e =>
                      setTypeForm(f => ({
                        ...f,
                        display_order: Number(e.target.value),
                      }))
                    }
                  />
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={typeForm.is_required}
                    onChange={e => setTypeForm(f => ({ ...f, is_required: e.target.checked }))}
                  />
                  필수 문서
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={typeForm.is_active}
                    onChange={e => setTypeForm(f => ({ ...f, is_active: e.target.checked }))}
                  />
                  사용 중
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button className="px-3 py-2 text-sm rounded border" onClick={closeTypeForm}>
                취소
              </button>
              <button
                className="px-3 py-2 text-sm rounded bg-blue-600 text-white disabled:opacity-50"
                onClick={submitTypeForm}
                disabled={!typeForm.name || !typeForm.slug}
              >
                저장
              </button>
            </div>
          </section>
        )}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {typesLoading && (
            <>
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border bg-card p-4 text-sm text-muted-foreground animate-pulse h-40"
                >
                  로딩 중...
                </div>
              ))}
            </>
          )}
          {!typesLoading && docTypes.length === 0 && (
            <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground col-span-full">
              등록된 회사 문서 유형이 없습니다. 우측 상단 버튼을 눌러 새 유형을 추가하세요.
            </div>
          )}
          {docTypes.map(type => {
            const docsForType = (Array.isArray(type.documents) ? type.documents : []).slice()
              .sort(
                (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
              )
            const isEditing =
              typeFormOpen &&
              editingType &&
              ((editingType.id && editingType.id === type.id) ||
                (!editingType.id && editingType.slug === type.slug))
            return (
              <section
                key={type.slug}
                className={`rounded-lg border bg-card p-3 shadow-sm space-y-3 flex flex-col ${type.is_active ? '' : 'opacity-70'}`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-semibold">{type.name}</h2>
                        {type.is_required && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                            필수
                          </span>
                        )}
                        {!type.is_active && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                            비활성
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        ID: {type.slug}
                      </div>
                      {type.description && (
                        <p className="text-xs text-muted-foreground">{type.description}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      <button
                        className="px-2 py-1 text-[11px] rounded border"
                        onClick={() => openEditTypeForm(type)}
                      >
                        수정
                      </button>
                      <button
                        className="px-2 py-1 text-[11px] rounded border"
                        onClick={() => handleToggleTypeActive(type, !type.is_active)}
                      >
                        {type.is_active ? '비활성' : '활성'}
                      </button>
                      <button
                        className="px-2 py-1 text-[11px] rounded bg-blue-600 text-white disabled:opacity-50"
                        onClick={() => onPick(type.slug)}
                        disabled={!type.is_active || busy}
                      >
                        업로드
                      </button>
                      <input
                        ref={el => (fileInputs.current[type.slug] = el)}
                        type="file"
                        hidden
                        onChange={e => onFile(type.slug, e.target.files?.[0] || undefined)}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  {docsForType.length === 0 && (
                    <div className="text-xs text-muted-foreground border rounded p-3 bg-muted/40">
                      등록된 문서가 없습니다.
                    </div>
                  )}
                  {docsForType.map(doc => (
                    <div
                      key={doc.id}
                      className="border rounded p-2 flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-medium truncate">
                          {doc.title || doc.file_name || '문서'}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {doc.created_at ? new Date(doc.created_at).toLocaleDateString('ko-KR') : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-wrap justify-end">
                        <FileActionMenu
                          document={toFileRecord(doc)}
                          buttonVariant="unstyled"
                          buttonClassName={fileActionButtonClass}
                          className="flex items-center gap-2"
                        />
                        <button
                          className="inline-flex items-center justify-center min-w-[80px] px-3 py-1 text-[11px] font-medium rounded border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-400 disabled:opacity-50"
                          onClick={() => onDelete(doc.id!)}
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {isEditing && (
                  <div className="border-t pt-3 space-y-2 text-xs">
                    <div className="font-semibold">유형 정보 수정</div>
                    <label className="flex flex-col gap-1">
                      <span>이름</span>
                      <input
                        className="border rounded px-2 py-1 text-xs"
                        value={typeForm.name}
                        onChange={e => setTypeForm(f => ({ ...f, name: e.target.value }))}
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span>문서유형 ID (수정 불가)</span>
                      <input className="border rounded px-2 py-1 text-xs bg-muted" value={typeForm.slug} disabled />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span>설명</span>
                      <textarea
                        className="border rounded px-2 py-1 text-xs"
                        rows={2}
                        value={typeForm.description}
                        onChange={e => setTypeForm(f => ({ ...f, description: e.target.value }))}
                      />
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex flex-col gap-1">
                        <span>정렬</span>
                        <input
                          type="number"
                          className="border rounded px-2 py-1 text-xs"
                          value={typeForm.display_order}
                          onChange={e =>
                            setTypeForm(f => ({
                              ...f,
                              display_order: Number(e.target.value),
                            }))
                          }
                        />
                      </label>
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={typeForm.is_required}
                          onChange={e => setTypeForm(f => ({ ...f, is_required: e.target.checked }))}
                        />
                        필수
                      </label>
                    </div>
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={typeForm.is_active}
                        onChange={e => setTypeForm(f => ({ ...f, is_active: e.target.checked }))}
                      />
                      사용 중
                    </label>
                    <div className="flex justify-end gap-1">
                      <button className="px-2 py-1 text-xs rounded border" onClick={closeTypeForm}>
                        취소
                      </button>
                      <button
                        className="px-2 py-1 text-xs rounded bg-blue-600 text-white disabled:opacity-50"
                        onClick={submitTypeForm}
                        disabled={!typeForm.name}
                      >
                        저장
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )
          })}
          {unmatchedDocs.length > 0 && (
            <section className="rounded-lg border bg-card p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-semibold">분류되지 않은 문서</div>
                <p className="text-xs text-muted-foreground">
                  company_slug 태그가 없는 문서입니다. 적절한 유형으로 다시 업로드해주세요.
                </p>
              </div>
              {unmatchedDocs.map(doc => (
                <div
                  key={doc.id}
                  className="border rounded-md p-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="font-medium">{doc.title || doc.file_name || '문서'}</div>
                    <div className="text-xs text-muted-foreground">
                      {(doc.file_name || '파일명 없음')}{' '}
                      {doc.created_at ? `· ${new Date(doc.created_at).toLocaleDateString('ko-KR')}` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <FileActionMenu
                      document={toFileRecord(doc)}
                      buttonVariant="unstyled"
                      buttonClassName={fileActionButtonClass}
                    />
                    <button
                      className="inline-flex items-center justify-center min-w-[80px] px-3 py-1 text-[11px] font-medium rounded border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-400 disabled:opacity-50"
                      onClick={() => onDelete(doc.id!)}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
