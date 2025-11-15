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
  const deriveWorklogId = (doc: AnyDoc | undefined | null) =>
    doc?.linked_worklog_id || doc?.daily_report?.id || ''
  const [worklogId, setWorklogId] = React.useState(deriveWorklogId(document))
  const [worklogs, setWorklogs] = React.useState<WorklogOption[]>([])
  const [worklogsLoading, setWorklogsLoading] = React.useState(false)
  const [worklogsError, setWorklogsError] = React.useState<string | null>(null)
  const [message, setMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  )
  const [isSaving, setIsSaving] = React.useState(false)

  React.useEffect(() => {
    setTitle(document?.title || '')
    setSiteId(document?.site_id || '')
    setWorklogId(deriveWorklogId(document))
  }, [document?.title, document?.site_id, document?.linked_worklog_id, document?.daily_report?.id])

  const resolveSiteName = (id?: string | null) => {
    if (!id) return ''
    return siteOptions.find(option => option.id === id)?.name || document?.site?.name || ''
  }

  const applyLocalUpdate = (nextTitle: string, nextSiteId: string, nextWorklogId: string) => {
    onDocumentChange?.({
      ...document,
      title: nextTitle,
      site_id: nextSiteId ? nextSiteId : null,
      site: nextSiteId
        ? { ...(document?.site || {}), id: nextSiteId, name: resolveSiteName(nextSiteId) }
        : null,
      linked_worklog_id: nextWorklogId ? nextWorklogId : null,
    })
  }

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

  React.useEffect(() => {
    if (!siteId) {
      setWorklogs([])
      setWorklogId('')
      return
    }
    fetchWorklogs(siteId, document?.linked_worklog_id || null)
  }, [siteId, document?.linked_worklog_id, fetchWorklogs])

  const ensureMarkupDocument = React.useCallback(
    async (nextTitle: string, nextSiteId: string, nextWorklogId: string) => {
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
        linked_worklog_id: nextWorklogId || document?.linked_worklog_id || null,
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
      const ensuredId = await ensureMarkupDocument(nextTitle, siteId, worklogId)
      const res = await fetch(`/api/markup-documents/${ensuredId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: nextTitle,
          site_id: siteId ? siteId : null,
          linked_worklog_id: worklogId ? worklogId : null,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || '메타데이터 저장 실패')
      }
      applyLocalUpdate(nextTitle, siteId, worklogId)
      setMessage({ type: 'success', text: '제목/현장/작업일지를 저장했습니다.' })
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
  const worklogSelectValue = worklogId || 'none'

  const formatWorklogLabel = (worklog: WorklogOption) => {
    const dateLabel = worklog.work_date
      ? new Date(worklog.work_date).toLocaleDateString('ko-KR')
      : '날짜 미상'
    const memberLabel = worklog.member_name || '작성자 미상'
    const statusLabel = formatWorklogStatus(worklog.status)
    return `${dateLabel} · ${memberLabel} · ${statusLabel}`
  }

  const formatWorklogStatus = (status?: string | null) => {
    if (!status) return '상태 미정'
    const normalized = status.toLowerCase()
    const map: Record<string, string> = {
      submitted: '제출 완료',
      draft: '임시 저장',
      saved: '임시 저장',
      pending: '검토 중',
      approved: '승인 완료',
      rejected: '반려',
    }
    return map[normalized] || status
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
                applyLocalUpdate(e.target.value, siteId, worklogId)
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
              const nextWorklog = ''
              setWorklogId(nextWorklog)
              if (!document?.id) {
                applyLocalUpdate(title, nextSite, nextWorklog)
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
          <label className="mb-1 block text-sm font-medium text-foreground">작업일지</label>
          <Select
            value={worklogSelectValue}
            onValueChange={value => {
              const nextValue = value === 'none' ? '' : value
              setWorklogId(nextValue)
              if (!document?.id) {
                applyLocalUpdate(title, siteId, nextValue)
              }
            }}
            disabled={!siteId || worklogsLoading}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={siteId ? '작업일지를 선택하세요' : '현장을 먼저 선택하세요'}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">미연결</SelectItem>
              {worklogs.map(option => (
                <SelectItem key={option.id} value={option.id}>
                  {formatWorklogLabel(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-1 text-xs text-muted-foreground">
            {siteId
              ? worklogsLoading
                ? '작업일지를 불러오는 중입니다...'
                : worklogsError || '최근 100건의 작업일지를 표시합니다.'
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
