'use client'
import React from 'react'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useConfirm } from '@/components/ui/use-confirm'
import { PageHeader } from '@/components/ui/page-header'
import { useToast } from '@/components/ui/use-toast'

// Canonical slugs used across the app (aligns with mobile/company tab)
type CompanySlug = 'biz_reg' | 'bankbook' | 'npc1000_form' | 'completion_form'

const COMPANY_DOCS: Array<{ slug: CompanySlug; label: string; hint?: string }> = [
  { slug: 'biz_reg', label: '사업자등록증' },
  { slug: 'bankbook', label: '통장사본' },
  { slug: 'npc1000_form', label: 'NPC-1000 승인확인서(양식)' },
  { slug: 'completion_form', label: '작업완료확인서(양식)' },
]

// Accept legacy/admin-specific aliases so existing data shows up
const COMPANY_TYPE_ALIASES: Record<CompanySlug, string[]> = {
  biz_reg: ['biz_reg', 'company_biz_reg'],
  bankbook: ['bankbook', 'company_bankbook'],
  npc1000_form: ['npc1000_form'],
  completion_form: ['completion_form'],
}

const DOC_TYPE_TO_LABEL: Record<string, string> = {
  biz_reg: '사업자등록증',
  company_biz_reg: '사업자등록증',
  bankbook: '통장사본',
  company_bankbook: '통장사본',
  npc1000_form: 'NPC-1000 승인확인서(양식)',
  completion_form: '작업완료확인서(양식)',
}

type Row = {
  id: string
  title?: string
  file_name?: string
  file_url?: string
  document_type?: string
  created_at?: string
  file_size?: number
  mime_type?: string
  description?: string
}

type TabKey = 'all' | CompanySlug

export default function AdminCompanyDocumentsPage() {
  const { toast } = useToast()
  const [rows, setRows] = useState<Row[]>([])
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({})
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [active, setActive] = useState<TabKey>('biz_reg')
  const [uploadSlug, setUploadSlug] = useState<CompanySlug>('biz_reg')

  const load = async () => {
    setBusy(true)
    try {
      const res = await fetch('/api/documents?type=shared&limit=200', { credentials: 'include' })
      const j = await res.json()
      if (res.ok && j?.success) setRows(Array.isArray(j.data) ? j.data : [])
      else setRows([])
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  // Reset selection when list changes
  useEffect(() => {
    setSelected(new Set())
  }, [rows.length])

  const listBySlug = useMemo(() => {
    const map: Record<CompanySlug, Row[]> = {
      biz_reg: [],
      bankbook: [],
      npc1000_form: [],
      completion_form: [],
    }
    const typeToCanonical: Record<string, CompanySlug> = {}
    for (const key of Object.keys(COMPANY_TYPE_ALIASES) as CompanySlug[]) {
      for (const alias of COMPANY_TYPE_ALIASES[key]) typeToCanonical[alias] = key
    }
    for (const d of rows) {
      const t = String(d.document_type || '')
      const canonical = typeToCanonical[t]
      if (canonical) {
        map[canonical].push(d)
        continue
      }
      // Fallback: infer from description marker (company_slug:...)
      const desc = String(d.description || '')
      const m = desc.match(/company_slug:([a-zA-Z0-9_\-]+)/)
      if (m) {
        const slug = m[1] as CompanySlug
        if (
          slug &&
          (['biz_reg', 'bankbook', 'npc1000_form', 'completion_form'] as string[]).includes(slug)
        ) {
          map[slug as CompanySlug].push(d)
        }
      }
    }
    return map
  }, [rows])

  const latest = (slug: CompanySlug) => {
    const arr = (listBySlug[slug] || [])
      .slice()
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    return arr[0]
  }

  const onPick = (slug: CompanySlug) => fileInputs.current[slug]?.click()

  const onFile = async (slug: CompanySlug, f?: File) => {
    if (!f) return
    setBusy(true)
    setMsg('')
    try {
      const form = new FormData()
      form.append('file', f)
      form.append('category', 'company')
      form.append('documentType', slug)
      form.append('isPublic', 'true')
      const res = await fetch('/api/documents', {
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
      setMsg(`${slug} 업로드 완료`)
      toast({ title: '업로드 완료', description: `${slug} 업로드가 완료되었습니다.` })
      await load()
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
      const res = await fetch(`/api/documents?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const j = await res.json()
      if (!res.ok || j?.error) throw new Error(j?.error || '삭제 실패')
      await load()
    } catch (e: any) {
      toast({ title: '삭제 실패', description: e?.message || '삭제 실패', variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  // Bulk delete selected rows
  const onBulkDelete = async () => {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    const ok = await confirm({
      title: '선택 삭제',
      description: `선택한 ${ids.length}개의 문서를 삭제하시겠습니까?`,
      confirmText: '삭제',
      cancelText: '취소',
      variant: 'destructive',
    })
    if (!ok) return
    setBusy(true)
    setMsg('')
    try {
      const results = await Promise.allSettled(
        ids.map(id =>
          fetch(`/api/documents?id=${encodeURIComponent(id)}`, {
            method: 'DELETE',
            credentials: 'include',
          })
        )
      )
      const failed = results.filter(
        r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.ok)
      )
      if (failed.length > 0) {
        setMsg(`일부 문서 삭제 실패 (${failed.length}/${ids.length})`)
      }
      await load()
    } finally {
      setBusy(false)
      setSelected(new Set())
    }
  }

  const allSelected = rows.length > 0 && selected.size === rows.length
  const toggleSelectAll = () => {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(rows.map(r => String(r.id))))
  }
  const toggleSelectOne = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  const filteredRows = useMemo(() => {
    if (active === 'all') {
      // Show only recognized company docs across all slugs
      return (['biz_reg', 'bankbook', 'npc1000_form', 'completion_form'] as CompanySlug[])
        .flatMap(slug => listBySlug[slug])
        .sort(
          (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        )
    }
    return (listBySlug[active] || [])
      .slice()
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
  }, [active, listBySlug])

  useEffect(() => {
    // keep upload type in sync with active tab (except for 'all')
    if (active !== 'all') setUploadSlug(active)
  }, [active])

  return (
    <div className="px-0 pb-8">
      <PageHeader
        title="회사서류 관리"
        description="사업자등록증/통장사본/NPC-1000/완료확인서 관리"
        breadcrumbs={[{ label: '대시보드', href: '/dashboard/admin' }, { label: '문서 관리', href: '/dashboard/admin/documents' }, { label: '회사서류' }]}
        showBackButton
        backButtonHref="/dashboard/admin/documents"
      />
      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">회사서류 관리</h1>
          <p className="text-sm text-muted-foreground">
            사업자등록증, 통장사본, NPC-1000 승인확인서, 작업완료확인서 업로드/관리
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="px-2 py-2 border rounded-md text-sm"
            value={uploadSlug}
            onChange={e => setUploadSlug(e.target.value as CompanySlug)}
          >
            {COMPANY_DOCS.map(d => (
              <option key={d.slug} value={d.slug}>
                {d.label} 업로드
              </option>
            ))}
          </select>
          <button
            className="px-3 py-2 text-sm rounded-md bg-blue-600 text-white disabled:opacity-50"
            onClick={() => onPick(uploadSlug)}
            disabled={busy}
          >
            업로드
          </button>
          <input
            ref={el => (fileInputs.current[uploadSlug] = el)}
            type="file"
            hidden
            onChange={e => onFile(uploadSlug, e.target.files?.[0] || undefined)}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b">
        {(['all', ...COMPANY_DOCS.map(d => d.slug)] as TabKey[]).map(key => {
          const label = key === 'all' ? '전체' : COMPANY_DOCS.find(d => d.slug === key)!.label
          const isActive = active === key
          return (
            <button
              key={key}
              className={`px-3 py-2 text-sm border-b-2 ${isActive ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
              onClick={() => setActive(key)}
            >
              {label}
            </button>
          )
        })}
      </div>

      {msg && <div className="text-sm text-foreground">{msg}</div>}

      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold">회사서류 목록</div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-2 text-sm rounded-md border disabled:opacity-50"
              onClick={toggleSelectAll}
              disabled={filteredRows.length === 0}
            >
              {allSelected ? '전체 해제' : '전체 선택'}
            </button>
            <button
              className="px-3 py-2 text-sm rounded-md bg-rose-600 text-white disabled:opacity-50"
              onClick={onBulkDelete}
              disabled={selected.size === 0 || busy}
            >
              선택 삭제
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-muted text-left">
                <th className="px-3 py-2 w-10">
                  <input
                    type="checkbox"
                    aria-label="전체 선택"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-3 py-2">유형</th>
                <th className="px-3 py-2">파일명</th>
                <th className="px-3 py-2">등록일</th>
                <th className="px-3 py-2">액션</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map(r => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      aria-label="선택"
                      checked={selected.has(String(r.id))}
                      onChange={() => toggleSelectOne(String(r.id))}
                    />
                  </td>
                  <td className="px-3 py-2">{mapDocType(r.document_type, r.description)}</td>
                  <td className="px-3 py-2">{r.title || r.file_name || '-'}</td>
                  <td className="px-3 py-2">
                    {r.created_at ? new Date(r.created_at).toLocaleDateString('ko-KR') : '-'}
                  </td>
                  <td className="px-3 py-2 flex items-center gap-2">
                    <button
                      className="px-2 py-1 text-xs rounded border"
                      onClick={async () => {
                        if (!r.file_url) return
                        try {
                          const res = await fetch(`/api/files/signed-url?url=${encodeURIComponent(r.file_url)}`)
                          const j = await res.json().catch(() => ({}))
                          const url = (j?.url as string) || r.file_url
                          window.open(url, '_blank')
                        } catch {
                          window.open(r.file_url, '_blank')
                        }
                      }}
                    >
                      보기
                    </button>
                    <button
                      className="px-2 py-1 text-xs rounded bg-rose-600 text-white"
                      onClick={() => onDelete(r.id!)}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-center text-gray-500" colSpan={5}>
                    등록된 회사서류가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </div>
  )
}

function mapDocType(t?: string, desc?: string) {
  if (!t) return '-'
  // Company docs saved as shared: decode company_slug marker from description
  if (t === 'shared' && desc) {
    const m = String(desc).match(/company_slug:([a-zA-Z0-9_\-]+)/)
    if (m) {
      const slug = m[1]
      const label = DOC_TYPE_TO_LABEL[slug]
      if (label) return label
    }
  }
  return DOC_TYPE_TO_LABEL[t] || t
}
