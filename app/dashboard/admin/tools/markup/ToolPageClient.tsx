'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import AdminMarkupToolClient from './AdminMarkupToolClient'
import RecentDocsTable from './RecentDocsTable'
import { PageHeader } from '@/components/ui/page-header'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import type { SiteOption } from '@/components/admin/markup/MarkupMetadataForm'
// no top input card; launcher keeps only recent list and the open button

type AnyDoc = {
  id?: string
  title?: string
  description?: string
  original_blueprint_url?: string
  original_blueprint_filename?: string
  markup_data?: any[]
  site_id?: string | null
  site?: { id?: string | null; name?: string | null } | null
  linked_worklog_id?: string | null
  linked_worklog_ids?: string[] | null
  source?: 'markup' | 'shared'
  unified_document_id?: string | null
  linked_markup_document_id?: string | null
}

export type ToolPageClientSearchParams = {
  docId?: string
  blueprintUrl?: string
  siteId?: string
  title?: string
  unifiedDocumentId?: string
  markupDocumentId?: string
  startEmpty?: boolean
}

export default function ToolPageClient({
  docs,
  siteOptions,
  initialQuery,
}: {
  docs: any[]
  siteOptions: SiteOption[]
  initialQuery?: ToolPageClientSearchParams
}) {
  const router = useRouter()
  const docId = (initialQuery?.docId || '').trim()
  const blueprintUrl = (initialQuery?.blueprintUrl || '').trim()
  const blueprintSiteId = (initialQuery?.siteId || '').trim()
  const titleParam = (initialQuery?.title || '').trim()
  const unifiedDocumentId = (initialQuery?.unifiedDocumentId || '').trim()
  const markupDocumentIdParam = (initialQuery?.markupDocumentId || '').trim()
  const startEmpty = Boolean(initialQuery?.startEmpty)
  const hasDirectLaunchParams = Boolean(
    docId || blueprintUrl || startEmpty || unifiedDocumentId || markupDocumentIdParam
  )

  const [initialDocument, setInitialDocument] = React.useState<AnyDoc | null>(null)
  const [state, setState] = React.useState<'launcher' | 'editor' | 'loading'>('loading')
  const [searchTerm, setSearchTerm] = React.useState('')
  const [siteFilter, setSiteFilter] = React.useState<string>('all')
  const [worklogFilter, setWorklogFilter] = React.useState<'all' | 'linked' | 'unlinked'>('all')
  // Local chooser state must be declared unconditionally before any early returns
  const fileRef = React.useRef<HTMLInputElement | null>(null)

  const startEditor = React.useCallback((doc: AnyDoc) => {
    setInitialDocument(doc)
    setState('editor')
  }, [])

  React.useEffect(() => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const isUuid = uuidRegex.test(docId)
    const isUrl = (() => {
      try {
        const u = new URL(blueprintUrl)
        return u.protocol === 'http:' || u.protocol === 'https:'
      } catch {
        return false
      }
    })()

    const tryFromLocal = () => {
      try {
        const raw = localStorage.getItem('selected_drawing')
        if (raw) {
          const d = JSON.parse(raw)
          if (d?.url) {
            startEditor({
              id: d.id,
              title: d.title || d.name || '무제 도면',
              original_blueprint_url: d.url,
              original_blueprint_filename: d.name || 'blueprint.png',
              markup_data: d.markupData || d.markup_data || [],
            })
            return true
          }
        }
      } catch (err) {
        if (process.env.NODE_ENV !== 'production')
          console.debug('selected_drawing parse failed', err)
      }
      return false
    }

    const loadSharedDocument = async () => {
      if (!unifiedDocumentId) return false
      try {
        setState('loading')
        const res = await fetch(`/api/unified-documents/${unifiedDocumentId}`, {
          cache: 'no-store',
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok || !json?.data) return false
        const row = json.data as Record<string, any>
        const metadata =
          row?.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
            ? (row.metadata as Record<string, any>)
            : {}
        const urlCandidates = [
          blueprintUrl,
          row?.file_url,
          row?.fileUrl,
          row?.original_file_url,
          metadata?.original_blueprint_url,
          metadata?.file_url,
          metadata?.public_url,
          metadata?.preview_url,
        ]
        let resolvedBlueprintUrl = ''
        for (const candidate of urlCandidates) {
          if (typeof candidate === 'string' && candidate.trim().length > 0) {
            resolvedBlueprintUrl = candidate
            break
          }
        }
        const markupDataFromRow =
          Array.isArray(row?.markup_data) && row.markup_data.length > 0
            ? row.markup_data
            : Array.isArray(metadata?.markup_data)
              ? metadata.markup_data
              : []
        const metadataLinkedIds =
          Array.isArray(metadata?.linked_worklog_ids) && metadata.linked_worklog_ids.length > 0
            ? metadata.linked_worklog_ids.filter(
                (value: unknown): value is string =>
                  typeof value === 'string' && value.trim().length > 0
              )
            : []
        const linkedMarkupCandidate =
          (markupDocumentIdParam &&
            uuidRegex.test(markupDocumentIdParam) &&
            markupDocumentIdParam) ||
          (metadata?.source_table === 'markup_documents'
            ? metadata.markup_document_id || metadata.source_id
            : metadata?.markup_document_id)
        let linkedMarkupDoc: AnyDoc | null = null
        if (linkedMarkupCandidate && uuidRegex.test(String(linkedMarkupCandidate))) {
          try {
            const linkedRes = await fetch(`/api/markup-documents/${linkedMarkupCandidate}`, {
              cache: 'no-store',
            })
            const linkedJson = await linkedRes.json().catch(() => ({}))
            if (linkedRes.ok && linkedJson?.data) {
              linkedMarkupDoc = {
                ...linkedJson.data,
                source: 'shared',
                unified_document_id: unifiedDocumentId,
                linked_markup_document_id: linkedMarkupCandidate,
              }
            }
          } catch (err) {
            if (process.env.NODE_ENV !== 'production')
              console.debug('linked markup fetch failed', err)
          }
        }
        const resolvedMarkupData =
          Array.isArray(linkedMarkupDoc?.markup_data) && linkedMarkupDoc.markup_data.length > 0
            ? linkedMarkupDoc.markup_data
            : markupDataFromRow
        const resolvedSiteId =
          linkedMarkupDoc?.site_id ??
          row?.site_id ??
          (typeof metadata?.site_id === 'string' ? metadata.site_id : null) ??
          (blueprintSiteId || null)
        const sharedDoc: AnyDoc = {
          ...(linkedMarkupDoc || {}),
          id: linkedMarkupDoc?.id,
          source: 'shared',
          unified_document_id: unifiedDocumentId,
          linked_markup_document_id: linkedMarkupCandidate || linkedMarkupDoc?.id || null,
          title: linkedMarkupDoc?.title || row?.title || row?.file_name || titleParam || '도면',
          description: linkedMarkupDoc?.description || row?.description || '',
          original_blueprint_url: linkedMarkupDoc?.original_blueprint_url || resolvedBlueprintUrl,
          original_blueprint_filename:
            linkedMarkupDoc?.original_blueprint_filename || row?.file_name || '도면',
          markup_data: resolvedMarkupData || [],
          site_id: resolvedSiteId || null,
          linked_worklog_id:
            linkedMarkupDoc?.linked_worklog_id ??
            metadata?.linked_worklog_id ??
            metadataLinkedIds[0] ??
            null,
          linked_worklog_ids:
            Array.isArray(linkedMarkupDoc?.linked_worklog_ids) &&
            linkedMarkupDoc.linked_worklog_ids.length > 0
              ? linkedMarkupDoc.linked_worklog_ids
              : metadataLinkedIds,
        }
        startEditor(sharedDoc)
        return true
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') console.debug('shared doc load failed', error)
      }
      return false
    }

    const run = async () => {
      if (startEmpty) {
        startEditor({
          id: undefined,
          title: titleParam || '무제 도면',
          original_blueprint_url: '',
          original_blueprint_filename: '',
          markup_data: [],
        })
        return
      }
      if (isUuid) {
        try {
          setState('loading')
          const r = await fetch(`/api/markup-documents/${docId}`, { cache: 'no-store' })
          const j = await r.json().catch(() => ({}))
          if (r.ok && j?.data) {
            startEditor({
              ...j.data,
              source: unifiedDocumentId ? 'shared' : 'markup',
              unified_document_id: unifiedDocumentId || j.data?.unified_document_id,
              linked_markup_document_id:
                unifiedDocumentId || markupDocumentIdParam ? j.data?.id : undefined,
            })
            return
          }
        } catch (err) {
          if (process.env.NODE_ENV !== 'production')
            console.debug('fetch markup-doc by id failed', err)
        }
      }

      if (await loadSharedDocument()) return

      if (isUrl) {
        startEditor({
          id: undefined,
          title: titleParam || '무제 도면',
          original_blueprint_url: blueprintUrl,
          original_blueprint_filename: 'blueprint.png',
          markup_data: [],
          site_id: blueprintSiteId || undefined,
          source: unifiedDocumentId ? 'shared' : 'markup',
          unified_document_id: unifiedDocumentId || undefined,
        })
        return
      }
      if (tryFromLocal()) return
      setState('launcher')
    }

    run()
  }, [
    docId,
    blueprintUrl,
    blueprintSiteId,
    titleParam,
    startEmpty,
    unifiedDocumentId,
    markupDocumentIdParam,
    startEditor,
  ])

  const onPickFile = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files && e.target.files[0] ? e.target.files[0] : null
      if (!f) return
      let imageUrl = ''
      try {
        imageUrl = URL.createObjectURL(f)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.debug('createObjectURL failed', err)
      }
      const imageName = f.name || 'blueprint.png'
      startEditor({
        id: undefined,
        title: imageName || '무제 도면',
        original_blueprint_url: imageUrl,
        original_blueprint_filename: imageName,
        markup_data: [],
      })
      // reset input value to allow picking the same file again later
      try {
        e.target.value = ''
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.debug('file input reset failed', err)
      }
    },
    [startEditor]
  )

  const handleCloseEditor = React.useCallback(() => {
    try {
      // remove query to avoid re-entry on reload
      router.replace('/dashboard/admin/tools/markup')
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.debug('router.replace failed', err)
    }
    setInitialDocument(null)
    setState('launcher')
  }, [router])

  const filteredDocs = React.useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return docs.filter(doc => {
      const matchesTerm =
        !term ||
        [doc.title, doc.description, doc.site?.name]
          .filter(Boolean)
          .some(value => String(value).toLowerCase().includes(term))
      const matchesSite = siteFilter === 'all' || doc.site_id === siteFilter
      const hasWorklog =
        (Array.isArray(doc.linked_worklog_ids) && doc.linked_worklog_ids.length > 0) ||
        Boolean(doc.linked_worklog_id) ||
        Boolean(doc.daily_report)
      const matchesWorklog =
        worklogFilter === 'all' || (worklogFilter === 'linked' ? hasWorklog : !hasWorklog)
      return matchesTerm && matchesSite && matchesWorklog
    })
  }, [docs, searchTerm, siteFilter, worklogFilter])

  if (state === 'editor' && initialDocument) {
    return (
      <div className="px-0 pb-8">
        <PageHeader
          title="도면마킹 도구"
          description="브라우저에서 도면에 주석/스탬프를 추가하고 저장합니다."
          breadcrumbs={[
            { label: '대시보드', href: '/dashboard/admin' },
            { label: '현장작업 관리' },
            { label: '도면마킹 도구' },
          ]}
          showBackButton
          backButtonHref="/dashboard/admin/tools/markup"
        />
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <AdminMarkupToolClient
            initialDocument={initialDocument}
            siteOptions={siteOptions}
            onClose={handleCloseEditor}
          />
        </div>
      </div>
    )
  }

  if (state === 'loading' && hasDirectLaunchParams) {
    return (
      <div className="px-0 pb-8">
        <PageHeader
          title="도면마킹 도구"
          description="도면을 불러오고 있습니다. 잠시만 기다려주세요."
          breadcrumbs={[
            { label: '대시보드', href: '/dashboard/admin' },
            { label: '현장작업 관리' },
            { label: '도면마킹 도구' },
          ]}
          showBackButton
          backButtonHref="/dashboard/admin/tools/markup"
        />
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
            도면마킹 도구를 준비 중입니다...
          </div>
        </div>
      </div>
    )
  }

  // Launcher

  return (
    <div className="px-0 pb-8">
      <PageHeader
        title="도면마킹 관리"
        description="최근 문서를 열거나 새 도면마킹 작업을 시작하세요."
        breadcrumbs={[
          { label: '대시보드', href: '/dashboard/admin' },
          { label: '현장작업 관리' },
          { label: '도면마킹 관리' },
        ]}
      />
      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {state === 'loading' && (
          <div className="rounded-md border bg-card p-4 text-sm text-muted-foreground">
            로딩 중...
          </div>
        )}
        <div className="rounded-lg border bg-card p-4 shadow-sm space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-sm font-medium">도면마킹 문서</div>
              <p className="text-xs text-muted-foreground">
                모든 문서를 검색하고 필터링한 뒤 바로 편집하세요.
              </p>
              <div className="mt-2 rounded-md bg-blue-50/80 px-3 py-2 text-[11px] text-blue-900">
                <p className="font-semibold">문서 유형 & 작업 버튼 안내</p>
                <p className="mt-1">
                  모든 문서는 <span className="font-semibold">‘열기’</span> 버튼으로 시작합니다.
                  열람 후 바로 편집/저장이 가능하며, 문서 유형 배지에서 출처와 동기화 방향을
                  확인하세요.
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-4">
                  <li>
                    <span className="font-semibold">현장 공유 도면</span> — 작업자/현장관리자가
                    업로드한 도면으로 이미 저장된 마킹 데이터를 그대로 불러옵니다. 본사에서 수정 후
                    저장하면 다시 현장 공유함과 모바일에 즉시 반영됩니다.
                  </li>
                  <li>
                    <span className="font-semibold">본사 기준 도면</span> — 본사관리자가 작성/등록한
                    도면입니다. 기존 마킹을 이어서 편집하고 저장하며, 필요 시 버전 스냅샷이 자동
                    보관되어 추적할 수 있습니다.
                  </li>
                </ul>
              </div>
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center rounded-md bg-[--brand-600] hover:bg-[--brand-700] text-white px-4 py-2 text-sm shadow-button"
            >
              도면파일 불러오기
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="md:col-span-1">
              <label className="block text-xs font-medium text-muted-foreground mb-1">검색어</label>
              <Input
                placeholder="제목/현장/설명"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs font-medium text-muted-foreground mb-1">현장</label>
              <Select value={siteFilter} onValueChange={value => setSiteFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="현장 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {siteOptions.map(option => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                작업일지 연결
              </label>
              <Select value={worklogFilter} onValueChange={value => setWorklogFilter(value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="작업일지 상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="linked">연결됨</SelectItem>
                  <SelectItem value="unlinked">미연결</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('')
                setSiteFilter('all')
                setWorklogFilter('all')
              }}
            >
              필터 초기화
            </Button>
          </div>
          <div className="overflow-x-auto">
            <RecentDocsTable docs={filteredDocs} />
          </div>
        </div>
        <input
          ref={fileRef}
          className="hidden"
          type="file"
          accept="image/*"
          onChange={onPickFile}
        />
      </div>
    </div>
  )
}
