'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
  source?: 'markup' | 'shared'
}

export default function ToolPageClient({
  docs,
  siteOptions,
}: {
  docs: any[]
  siteOptions: SiteOption[]
}) {
  const router = useRouter()
  const sp = useSearchParams()
  const docId = (sp.get('docId') || '').trim()
  const blueprintUrl = (sp.get('blueprintUrl') || '').trim()
  const blueprintSiteId = (sp.get('siteId') || '').trim()
  const title = (sp.get('title') || '').trim()
  const startEmpty = (sp.get('startEmpty') || '').trim() === '1'

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
    // 1) docId 우선
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(docId)
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

    const run = async () => {
      // 빈 마크업
      if (startEmpty) {
        startEditor({
          id: undefined,
          title: title || '무제 도면',
          original_blueprint_url: '',
          original_blueprint_filename: '',
          markup_data: [],
        })
        return
      }
      // docId로 로드
      if (isUuid) {
        try {
          setState('loading')
          const r = await fetch(`/api/markup-documents/${docId}`, { cache: 'no-store' })
          const j = await r.json().catch(() => ({}))
          if (r.ok && j?.data) {
            startEditor(j.data)
            return
          }
        } catch (err) {
          if (process.env.NODE_ENV !== 'production')
            console.debug('fetch markup-doc by id failed', err)
        }
      }
      // blueprintUrl로 시작
      if (isUrl) {
        startEditor({
          id: undefined,
          title: title || '무제 도면',
          original_blueprint_url: blueprintUrl,
          original_blueprint_filename: 'blueprint.png',
          markup_data: [],
          site_id: blueprintSiteId || undefined,
        })
        return
      }
      // 로컬 스토리지에서 이어서
      if (tryFromLocal()) return
      // 폴백: 런처
      setState('launcher')
    }
    run()
  }, [docId, blueprintUrl, title, startEmpty, startEditor])

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
      const hasWorklog = Boolean(doc.daily_report)
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
