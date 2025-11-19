'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { linkUnifiedDocumentToMarkupDoc } from '@/lib/unified-documents'

type AnyDoc = {
  id?: string
  title?: string
  description?: string
  original_blueprint_url?: string
  original_blueprint_filename?: string
  site_id?: string | null
  site?: { id?: string | null; name?: string | null } | null
  linked_worklog_id?: string | null
  linked_worklog_ids?: string[] | null
  source?: 'markup' | 'shared'
  unified_document_id?: string | null
  markup_data?: any[]
  daily_report?: { id?: string }
}

export interface SiteOption {
  id: string
  name: string
}

interface WorklogOption {
  id: string
  work_date: string
  member_name?: string | null
  status?: string | null
  work_process?: string | null
  process_type?: string | null
  component_name?: string | null
  total_workers?: number | null
}

interface MarkupMetadataFormProps {
  document: AnyDoc
  siteOptions: SiteOption[]
  onDocumentChange?: (doc: AnyDoc) => void
}

export default function MarkupMetadataForm({
  document,
  siteOptions,
  onDocumentChange,
}: MarkupMetadataFormProps) {
  const [title, setTitle] = React.useState(document?.title || '')
  const [siteId, setSiteId] = React.useState(document?.site_id || '')
  const deriveWorklogIds = (doc: AnyDoc | undefined | null) => {
    if (Array.isArray(doc?.linked_worklog_ids) && doc?.linked_worklog_ids.length > 0) {
      return doc.linked_worklog_ids.filter(
        (value): value is string => typeof value === 'string' && value.trim().length > 0
      )
    }
    const fallback = doc?.linked_worklog_id || doc?.daily_report?.id
    return fallback ? [fallback] : []
  }
  const [worklogIds, setWorklogIds] = React.useState<string[]>(deriveWorklogIds(document))
  const [worklogInput, setWorklogInput] = React.useState('')
  const [worklogSelectValue, setWorklogSelectValue] = React.useState<'none' | string>('none')
  const [worklogs, setWorklogs] = React.useState<WorklogOption[]>([])
  const [worklogsLoading, setWorklogsLoading] = React.useState(false)
  const [worklogsError, setWorklogsError] = React.useState<string | null>(null)
  const [message, setMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  )
  const [isSaving, setIsSaving] = React.useState(false)
  const [worklogMeta, setWorklogMeta] = React.useState<
    Record<
      string,
      {
        work_date?: string | null
        component_name?: string | null
        work_process?: string | null
        process_type?: string | null
      }
    >
  >({})
  const [worklogMetaLoading, setWorklogMetaLoading] = React.useState(false)

  React.useEffect(() => {
    setTitle(document?.title || '')
    setSiteId(document?.site_id || '')
    setWorklogIds(deriveWorklogIds(document))
    setWorklogInput('')
    setWorklogSelectValue('none')
    setWorklogMeta({})
  }, [
    document?.title,
    document?.site_id,
    document?.linked_worklog_id,
    document?.linked_worklog_ids,
    document?.daily_report?.id,
  ])

  const resolveSiteName = (id?: string | null) => {
    if (!id) return ''
    return siteOptions.find(option => option.id === id)?.name || document?.site?.name || ''
  }

  const applyLocalUpdate = React.useCallback(
    (nextTitle: string, nextSiteId: string, nextWorklogIds: string[]) => {
      const normalized = Array.from(
        new Set(
          nextWorklogIds
            .map(id => id.trim())
            .filter((value): value is string => typeof value === 'string' && value.length > 0)
        )
      )
      onDocumentChange?.({
        ...document,
        title: nextTitle,
        site_id: nextSiteId ? nextSiteId : null,
        site: nextSiteId
          ? { ...(document?.site || {}), id: nextSiteId, name: resolveSiteName(nextSiteId) }
          : null,
        linked_worklog_id: normalized[0] ?? null,
        linked_worklog_ids: normalized,
      })
    },
    [document, onDocumentChange]
  )

  const fetchWorklogs = React.useCallback(
    async (targetSiteId: string, ensureId?: string | null) => {
      if (!targetSiteId) {
        setWorklogs([])
        return
      }
      setWorklogsLoading(true)
      setWorklogsError(null)
      try {
        const params = new URLSearchParams({ limit: '100' })
        if (ensureId) params.set('worklogId', ensureId)
        const res = await fetch(`/api/admin/sites/${targetSiteId}/worklogs?${params.toString()}`)
        const json = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(json?.error || '작업일지를 불러올 수 없습니다.')
        }
        setWorklogs(Array.isArray(json?.data) ? json.data : [])
      } catch (err) {
        setWorklogs([])
        setWorklogsError(
          err instanceof Error ? err.message : '작업일지 목록을 불러오지 못했습니다.'
        )
      } finally {
        setWorklogsLoading(false)
      }
    },
    []
  )

  const initialWorklogIdRef = React.useRef<string | null>(null)
  React.useEffect(() => {
    initialWorklogIdRef.current =
      document?.linked_worklog_id || document?.linked_worklog_ids?.[0] || null
  }, [document?.linked_worklog_id, document?.linked_worklog_ids])

  const primaryWorklogId = React.useMemo(() => worklogIds[0] || null, [worklogIds])

  React.useEffect(() => {
    if (!siteId) {
      if (worklogIds.length > 0) setWorklogIds([])
      setWorklogs([])
      setWorklogInput('')
      return
    }
    const ensureId = primaryWorklogId || initialWorklogIdRef.current
    fetchWorklogs(siteId, ensureId || undefined)
  }, [siteId, primaryWorklogId, fetchWorklogs])

  React.useEffect(() => {
    if (worklogIds.length === 0) {
      setWorklogMeta({})
      return
    }
    const controller = new AbortController()
    const ids = Array.from(new Set(worklogIds))
    setWorklogMetaLoading(true)
    fetch(`/api/daily-reports/meta?${new URLSearchParams({ ids: ids.join(',') }).toString()}`, {
      signal: controller.signal,
      cache: 'no-store',
    })
      .then(res => res.json().catch(() => ({})))
      .then(json => {
        if (controller.signal.aborted) return
        if (json?.success && json?.data && typeof json.data === 'object') {
          setWorklogMeta(json.data as Record<string, any>)
        }
      })
      .catch(() => void 0)
      .finally(() => {
        if (!controller.signal.aborted) setWorklogMetaLoading(false)
      })
    return () => controller.abort()
  }, [worklogIds])

  const formatWorklogChipLabel = React.useCallback(
    (id: string) => {
      const meta = worklogMeta[id]
      if (!meta) return `#${id}`
      const dateLabel = meta.work_date
        ? new Date(meta.work_date).toLocaleDateString('ko-KR')
        : '날짜 미정'
      const componentLabel = meta.component_name || '부재 미정'
      const processLabel = meta.work_process || meta.process_type || '공정 미정'
      return `${dateLabel} · ${componentLabel} · ${processLabel}`
    },
    [worklogMeta]
  )

  const addWorklogId = React.useCallback(
    (rawId: string) => {
      const trimmed = rawId.trim()
      if (!trimmed) return
      setWorklogIds(prev => {
        if (prev.includes(trimmed)) return prev
        const next = [trimmed, ...prev]
        if (!document?.id) {
          applyLocalUpdate(title, siteId, next)
        }
        return next
      })
    },
    [applyLocalUpdate, document?.id, siteId, title]
  )

  const removeWorklogId = React.useCallback(
    (targetId: string) => {
      setWorklogIds(prev => {
        const next = prev.filter(id => id !== targetId)
        if (!document?.id) {
          applyLocalUpdate(title, siteId, next)
        }
        return next
      })
    },
    [applyLocalUpdate, document?.id, siteId, title]
  )

  const clearWorklogIds = React.useCallback(() => {
    setWorklogIds([])
    setWorklogInput('')
    setWorklogSelectValue('none')
    if (!document?.id) {
      applyLocalUpdate(title, siteId, [])
    }
  }, [applyLocalUpdate, document?.id, siteId, title])

  const ensureMarkupDocument = React.useCallback(
    async (nextTitle: string, nextSiteId: string, nextWorklogIds: string[]) => {
      if (document?.id) return document.id
      const blueprintUrl = document?.original_blueprint_url
      if (!blueprintUrl) {
        throw new Error('도면 원본을 찾을 수 없습니다. 공유자료에서 다시 열어주세요.')
      }
      const blueprintFileName =
        document?.original_blueprint_filename || `${nextTitle || '도면'}.png`
      const payload = {
        title: nextTitle || document?.title || '무제 도면',
        description: document?.description || '',
        original_blueprint_url: blueprintUrl,
        original_blueprint_filename: blueprintFileName,
        markup_data: Array.isArray(document?.markup_data) ? document?.markup_data : [],
        preview_image_url: null,
        site_id: nextSiteId || document?.site_id || null,
        linked_worklog_ids:
          nextWorklogIds && nextWorklogIds.length > 0
            ? nextWorklogIds
            : document?.linked_worklog_ids || [],
        linked_worklog_id:
          nextWorklogIds[0] ||
          document?.linked_worklog_id ||
          document?.linked_worklog_ids?.[0] ||
          null,
      }
      const res = await fetch('/api/markup-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.data?.id) {
        throw new Error(json?.error || '도면마킹 문서를 생성할 수 없습니다.')
      }
      const created = json.data as AnyDoc
      onDocumentChange?.({
        ...document,
        ...created,
        id: created.id,
        source: 'markup',
      })
      if (document?.unified_document_id) {
        await linkUnifiedDocumentToMarkupDoc({
          unifiedDocumentId: document.unified_document_id,
          markupDocumentId: created.id,
          extraMetadata: {
            linked_worklog_id: payload.linked_worklog_id,
            linked_worklog_ids: payload.linked_worklog_ids,
            site_id: payload.site_id,
          },
        })
      }
      return created.id as string
    },
    [document, onDocumentChange]
  )

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const nextTitle = title.trim()
    if (!nextTitle) {
      setMessage({ type: 'error', text: '제목을 입력해 주세요.' })
      return
    }
    setIsSaving(true)
    setMessage(null)
    try {
      const ensuredId = await ensureMarkupDocument(nextTitle, siteId, worklogIds)
      const res = await fetch(`/api/markup-documents/${ensuredId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: nextTitle,
          site_id: siteId ? siteId : null,
          linked_worklog_id: worklogIds[0] ?? null,
          linked_worklog_ids: worklogIds,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || '메타데이터 저장 실패')
      }
      applyLocalUpdate(nextTitle, siteId, worklogIds)
      setMessage({ type: 'success', text: '제목/현장/작업일지 연결을 저장했습니다.' })
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const siteSelectValue = siteId || 'none'

  const formatWorklogLabel = (worklog: WorklogOption) => {
    const dateLabel = worklog.work_date
      ? new Date(worklog.work_date).toLocaleDateString('ko-KR')
      : '날짜 미정'
    const componentLabel = worklog.component_name || '부재 미정'
    const processLabel = worklog.work_process || worklog.process_type || '공정 미정'
    return `${dateLabel} · ${componentLabel} · ${processLabel}`
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-4 shadow-sm space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-1">
          <label className="mb-1 block text-sm font-medium text-foreground">제목</label>
          <Input
            value={title}
            onChange={e => {
              setTitle(e.target.value)
              if (!document?.id) {
                applyLocalUpdate(e.target.value, siteId, worklogIds)
              }
            }}
            placeholder="도면 제목을 입력하세요"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">현장</label>
          <Select
            value={siteSelectValue}
            onValueChange={value => {
              const nextSite = value === 'none' ? '' : value
              setSiteId(nextSite)
              // 새 현장을 선택하면 작업일지 선택도 초기화
              setWorklogIds([])
              setWorklogInput('')
              setWorklogSelectValue('none')
              if (!document?.id) {
                applyLocalUpdate(title, nextSite, [])
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="현장 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">미지정</SelectItem>
              {siteOptions.map(option => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">작업일지 연결</label>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Input
                value={worklogInput}
                onChange={e => setWorklogInput(e.target.value)}
                placeholder="작업일지 ID 입력"
                className="flex-1"
              />
              <Button
                type="button"
                onClick={() => {
                  addWorklogId(worklogInput)
                  setWorklogInput('')
                }}
                disabled={!worklogInput.trim()}
              >
                추가
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={clearWorklogIds}
                disabled={worklogIds.length === 0}
              >
                전체 해제
              </Button>
            </div>
            <Select
              value={worklogSelectValue}
              onValueChange={value => {
                if (value === 'none') return
                addWorklogId(value)
                setWorklogSelectValue('none')
              }}
              disabled={!siteId || worklogsLoading}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={siteId ? '최근 작업일지에서 선택' : '현장을 먼저 선택하세요'}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">선택 안 함</SelectItem>
                {worklogs.map(option => (
                  <SelectItem key={option.id} value={option.id}>
                    {formatWorklogLabel(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-2">
              {worklogIds.length === 0 ? (
                <span className="text-xs text-muted-foreground">
                  현재 연결된 작업일지가 없습니다.
                </span>
              ) : (
                worklogIds.map(id => (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700"
                  >
                    {formatWorklogChipLabel(id)}
                    <button
                      type="button"
                      aria-label={`작업일지 ${id} 제거`}
                      className="text-blue-500 hover:text-blue-700"
                      onClick={() => removeWorklogId(id)}
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {siteId
              ? worklogsLoading || worklogMetaLoading
                ? '작업일지를 불러오는 중입니다...'
                : worklogsError || '최근 100건의 작업일지를 선택하거나 직접 ID를 입력해 추가하세요.'
              : '작업일지를 선택하려면 먼저 현장을 지정하세요.'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? '저장 중...' : document?.id ? '메타데이터 저장' : '메타데이터 적용'}
        </Button>
        {message && (
          <span
            className={`text-sm ${message.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}
          >
            {message.text}
          </span>
        )}
      </div>
    </form>
  )
}
