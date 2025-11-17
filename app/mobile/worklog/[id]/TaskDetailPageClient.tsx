'use client'

import Image from 'next/image'
import React from 'react'
import type { WorklogAttachment, WorklogDetail } from '@/types/worklog'
import { MobileLayout as MobileLayoutShell } from '@/modules/mobile/components/layout/MobileLayout'
import { useToast } from '@/components/ui/use-toast'
import { DrawingBrowser } from '@/modules/mobile/components/markup/DrawingBrowser'
import '@/modules/mobile/styles/worklogs.css'

type TabKey = 'photos' | 'drawings' | 'completion' | 'others'

function isImg(a: WorklogAttachment) {
  const u = (a.previewUrl || a.fileUrl || '').toLowerCase()
  return (
    u.endsWith('.jpg') ||
    u.endsWith('.jpeg') ||
    u.endsWith('.png') ||
    u.endsWith('.webp') ||
    u.endsWith('.gif')
  )
}

export default function TaskDetailPageClient({ detail }: { detail: WorklogDetail }) {
  const [active, setActive] = React.useState<TabKey>('photos')
  const [zoom, setZoom] = React.useState(100)

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'photos', label: '사진대지' },
    { key: 'drawings', label: '진행도면' },
    { key: 'completion', label: '완료확인서' },
    { key: 'others', label: '기타서류' },
  ]

  const attachmentsByTab: Record<TabKey, WorklogAttachment[]> = {
    photos: detail.attachments.photos || [],
    drawings: detail.attachments.drawings || [],
    completion: detail.attachments.completionDocs || [],
    others: detail.attachments.others || [],
  }

  const items = attachmentsByTab[active]
  const resolveMetadata = (attachment: WorklogAttachment) =>
    attachment?.metadata && typeof attachment.metadata === 'object'
      ? (attachment.metadata as Record<string, any>)
      : null

  const extractSnapshotPdfUrl = (attachment: WorklogAttachment) => {
    const meta = resolveMetadata(attachment)
    if (
      meta &&
      typeof meta.snapshot_pdf_url === 'string' &&
      meta.snapshot_pdf_url.trim().length > 0
    ) {
      return meta.snapshot_pdf_url
    }
    return undefined
  }

  const extractLinkedWorklogIds = (attachment: WorklogAttachment) => {
    const meta = resolveMetadata(attachment)
    const ids = new Set<string>()
    if (Array.isArray(meta?.linked_worklog_ids)) {
      meta.linked_worklog_ids.forEach(value => {
        if (typeof value === 'string' && value.trim().length > 0) ids.add(value.trim())
      })
    }
    if (typeof meta?.linked_worklog_id === 'string' && meta.linked_worklog_id.trim().length > 0) {
      ids.add(meta.linked_worklog_id.trim())
    }
    if (typeof meta?.daily_report_id === 'string' && meta.daily_report_id.trim().length > 0) {
      ids.add(meta.daily_report_id.trim())
    }
    if (ids.size === 0) ids.add(detail.id)
    return Array.from(ids)
  }

  const getMarkupDocumentId = (attachment: WorklogAttachment): string | undefined => {
    const meta = resolveMetadata(attachment)
    if (typeof meta?.markup_document_id === 'string' && meta.markup_document_id.length > 0) {
      return meta.markup_document_id
    }
    const rawId = attachment?.id || ''
    if (rawId.startsWith('markup-') || rawId.startsWith('linked-')) {
      return rawId.replace(/^[a-zA-Z]+-/, '')
    }
    return undefined
  }

  const markupDrawings = (detail.attachments.drawings || []).filter(attachment => {
    const meta = resolveMetadata(attachment)
    return Boolean(
      meta?.markup_document_id ||
        (attachment.id &&
          (attachment.id.startsWith('markup-') || attachment.id.startsWith('linked-')))
    )
  })

  const { toast } = useToast()
  const initialLinkedDocs = React.useMemo(
    () =>
      markupDrawings.map(item => ({
        id: getMarkupDocumentId(item) || item.id,
        title: item.name || '도면',
        linkedWorklogIds: extractLinkedWorklogIds(item),
      })),
    [markupDrawings]
  )
  const [linkedDocs, setLinkedDocs] = React.useState(initialLinkedDocs)
  const [loadingLinks, setLoadingLinks] = React.useState(false)
  const [showDrawingPicker, setShowDrawingPicker] = React.useState(false)
  const [linkingDocId, setLinkingDocId] = React.useState<string | null>(null)
  const [detachingDocId, setDetachingDocId] = React.useState<string | null>(null)

  React.useEffect(() => {
    setLinkedDocs(initialLinkedDocs)
  }, [initialLinkedDocs])

  const refreshMarkupLinks = React.useCallback(async () => {
    setLoadingLinks(true)
    try {
      const res = await fetch(`/api/markup-documents?worklogId=${detail.id}`)
      const json = await res.json().catch(() => ({}))
      const arr = Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json?.documents)
          ? json.documents
          : []
      const mapped = arr.map((doc: any) => ({
        id: doc.id,
        title: doc.title || '도면',
        linkedWorklogIds:
          Array.isArray(doc.linked_worklog_ids) && doc.linked_worklog_ids.length > 0
            ? doc.linked_worklog_ids.filter(
                (value: unknown): value is string => typeof value === 'string' && value.length > 0
              )
            : doc.linked_worklog_id
              ? [doc.linked_worklog_id]
              : [detail.id],
      }))
      setLinkedDocs(mapped)
    } catch {
      setLinkedDocs([])
    } finally {
      setLoadingLinks(false)
    }
  }, [detail.id])

  React.useEffect(() => {
    void refreshMarkupLinks()
  }, [refreshMarkupLinks])

  const handleOpenMarkupTool = React.useCallback(
    (docId?: string) => {
      if (!detail.siteId) {
        toast({
          title: '현장 정보가 필요합니다.',
          description: '현장에 연결된 도면만 마킹할 수 있습니다.',
          variant: 'destructive',
        })
        return
      }
      const params = new URLSearchParams()
      params.set('siteId', detail.siteId)
      params.set('worklogId', detail.id)
      params.set('mode', docId ? 'start' : 'browse')
      if (docId) params.set('docId', docId)
      const url = `/mobile/markup-tool?${params.toString()}`
      window.location.href = url
    },
    [detail.id, detail.siteId, toast]
  )

  const handleAttachMarkup = React.useCallback(
    async (docId: string) => {
      setLinkingDocId(docId)
      try {
        const detailRes = await fetch(`/api/markup-documents/${docId}`, { cache: 'no-store' })
        const detailJson = await detailRes.json().catch(() => ({}))
        if (!detailRes.ok || !detailJson?.data) {
          throw new Error(detailJson?.error || '도면 정보를 불러올 수 없습니다.')
        }
        const existing: string[] = Array.isArray(detailJson.data.linked_worklog_ids)
          ? detailJson.data.linked_worklog_ids
          : detailJson.data.linked_worklog_id
            ? [detailJson.data.linked_worklog_id]
            : []
        const next = Array.from(new Set([...existing, detail.id]))
        const patchRes = await fetch(`/api/markup-documents/${docId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ linked_worklog_ids: next }),
        })
        const patchJson = await patchRes.json().catch(() => ({}))
        if (!patchRes.ok || patchJson?.error) {
          throw new Error(patchJson?.error || '작업일지와 연결하지 못했습니다.')
        }
        toast({
          title: '도면이 연결되었습니다.',
          description: '작업일지에서 바로 확인할 수 있습니다.',
        })
        setShowDrawingPicker(false)
        await refreshMarkupLinks()
      } catch (error) {
        toast({
          title: '연결 실패',
          description: error instanceof Error ? error.message : '도면 연결에 실패했습니다.',
          variant: 'destructive',
        })
      } finally {
        setLinkingDocId(null)
      }
    },
    [detail.id, refreshMarkupLinks, toast]
  )

  const handleDetachMarkup = React.useCallback(
    async (docId: string) => {
      const target = linkedDocs.find(doc => doc.id === docId)
      if (!target) return
      setDetachingDocId(docId)
      try {
        const remaining = target.linkedWorklogIds.filter(id => id !== detail.id)
        const patchRes = await fetch(`/api/markup-documents/${docId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ linked_worklog_ids: remaining }),
        })
        const patchJson = await patchRes.json().catch(() => ({}))
        if (!patchRes.ok || patchJson?.error) {
          throw new Error(patchJson?.error || '연결을 해제할 수 없습니다.')
        }
        toast({
          title: '연결 해제 완료',
          description: '도면 마킹 연결이 해제되었습니다.',
        })
        await refreshMarkupLinks()
      } catch (error) {
        toast({
          title: '해제 실패',
          description: error instanceof Error ? error.message : '연결 해제에 실패했습니다.',
          variant: 'destructive',
        })
      } finally {
        setDetachingDocId(null)
      }
    },
    [detail.id, linkedDocs, refreshMarkupLinks, toast]
  )

  const handleDrawingSelection = React.useCallback(
    (drawing: any) => {
      if (!drawing) return
      if (drawing.source === 'markup' && drawing.id) {
        void handleAttachMarkup(drawing.id)
      } else if (drawing.id) {
        handleOpenMarkupTool(drawing.id)
      }
    },
    [handleAttachMarkup, handleOpenMarkupTool]
  )

  return (
    <MobileLayoutShell>
      <div className="main-content" style={{ paddingTop: 20 }}>
        {/* Header */}
        <div className="fullscreen-header" style={{ position: 'sticky', top: 0, zIndex: 5 }}>
          <h3>작업일지 상세</h3>
          <a
            className="viewer-action-btn secondary"
            href={`/documents/hub?siteId=${detail.siteId || ''}&worklogId=${detail.id}`}
            target="_blank"
            rel="noreferrer"
          >
            현장공유함
          </a>
          <button
            className="close-btn"
            onClick={() => {
              if (window.history.length > 1) window.history.back()
              else window.location.href = '/mobile/worklog'
            }}
          >
            닫기
          </button>
        </div>

        {/* Info card */}
        <section className="diary-detail-section">
          {[
            { label: '현장명', value: detail.siteName || '미등록' },
            { label: '주소', value: detail.siteAddress || detail.siteName || '미등록' },
            { label: '부재명', value: (detail.memberTypes && detail.memberTypes[0]) || '미지정' },
            { label: '작업공정', value: (detail.processes && detail.processes[0]) || '미지정' },
            { label: '작업유형', value: (detail.workTypes && detail.workTypes[0]) || '미지정' },
            {
              label: '블럭/동/층',
              value:
                [detail.location?.block, detail.location?.dong, detail.location?.unit]
                  .filter(Boolean)
                  .join(' ') || '미입력',
            },
          ].map(row => (
            <div className="detail-item" key={row.label}>
              <span className="detail-label">{row.label}</span>
              <span className="detail-value">{row.value}</span>
            </div>
          ))}
        </section>

        {/* 2x2 tab grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 12 }}>
          {tabs.map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActive(t.key)}
              className="document-tab"
              style={{
                height: 64,
                ...(active === t.key
                  ? {
                      background: 'var(--tag-blue-20, rgba(49,163,250,0.2))',
                      borderColor: 'var(--tag-blue, #31a3fa)',
                      color: 'var(--tag-blue, #31a3fa)',
                    }
                  : {}),
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* tab controls */}
        <div className="tab-controls" style={{ justifyContent: 'flex-start' }}>
          <div className="zoom-controls">
            <button className="zoom-btn" onClick={() => setZoom(z => Math.max(50, z - 25))}>
              −
            </button>
            <span className="zoom-level">{zoom}%</span>
            <button className="zoom-btn" onClick={() => setZoom(z => Math.min(200, z + 25))}>
              +
            </button>
          </div>
          <button
            className="tab-close-btn"
            onClick={() => {
              if (window.history.length > 1) window.history.back()
              else window.location.href = '/mobile/worklog'
            }}
          >
            닫기
          </button>
        </div>

        {/* Content */}
        <div className="tab-content-wrapper" style={{ height: 'auto', minHeight: 400 }}>
          {items.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: 13 }}>첨부된 파일이 없습니다.</p>
          ) : active === 'photos' ? (
            <div
              className="photo-gallery-grid"
              style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}
            >
              {items.map(a => (
                <Image
                  key={a.id}
                  src={a.previewUrl || a.fileUrl}
                  alt={a.name}
                  width={480}
                  height={360}
                  className="photo-item"
                  sizes="(max-width: 768px) 100vw, 480px"
                />
              ))}
            </div>
          ) : (
            <div className="document-preview" style={{ minHeight: 420 }}>
              {(() => {
                const first = items[0]
                if (!first) return null
                if (isImg(first)) {
                  return (
                    <Image
                      src={first.previewUrl || first.fileUrl}
                      alt={first.name}
                      width={900}
                      height={1200}
                      className="document-image"
                      style={{ transform: `scale(${zoom / 100})` }}
                      sizes="(max-width: 768px) 100vw, 900px"
                    />
                  )
                }
                return (
                  <a
                    href={first.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="viewer-action-btn secondary"
                  >
                    문서 열기
                  </a>
                )
              })()}
            </div>
          )}
        </div>

        <section
          style={{
            marginTop: 16,
            border: '1px dashed rgba(148,163,184,0.6)',
            borderRadius: 16,
            padding: 16,
            background: '#fff',
          }}
        >
          <div className="flex flex-col gap-2">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <h4 style={{ fontWeight: 700, fontSize: 15 }}>도면 마킹 연결</h4>
                <p style={{ fontSize: 12, color: '#475467' }}>
                  작업일지와 연결된 도면 마킹을 관리하세요.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="viewer-action-btn secondary"
                  onClick={() => handleOpenMarkupTool()}
                  disabled={!detail.siteId}
                >
                  새 마킹
                </button>
                <button
                  type="button"
                  className="viewer-action-btn secondary"
                  onClick={() => setShowDrawingPicker(prev => !prev)}
                  disabled={!detail.siteId}
                >
                  {showDrawingPicker ? '선택 닫기' : '기존 연결'}
                </button>
              </div>
            </div>
            <a
              className="viewer-action-btn secondary"
              style={{ width: 'fit-content' }}
              href={`/documents/hub?siteId=${detail.siteId || ''}&worklogId=${detail.id}`}
            >
              현장공유함 이동
            </a>
          </div>

          {showDrawingPicker && (
            <div
              style={{
                marginTop: 12,
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                maxHeight: 420,
                overflow: 'hidden',
              }}
            >
              <DrawingBrowser
                selectedSite={detail.siteId || ''}
                siteName={detail.siteName}
                onDrawingSelect={handleDrawingSelection}
              />
            </div>
          )}

          <div style={{ marginTop: 12 }}>
            {loadingLinks ? (
              <p style={{ fontSize: 12, color: '#94a3b8' }}>연결 정보를 불러오는 중...</p>
            ) : linkedDocs.length === 0 ? (
              <p style={{ fontSize: 12, color: '#94a3b8' }}>
                연결된 도면이 없습니다. 새 도면을 마킹하거나 기존 도면을 연결해 주세요.
              </p>
            ) : (
              linkedDocs.map(doc => (
                <div key={doc.id} className="linked-markup-card">
                  <div className="linked-markup-title">{doc.title}</div>
                  <div className="linked-markup-badges">
                    {doc.linkedWorklogIds.map(id => (
                      <span key={id} className="linked-chip">
                        #{id}
                      </span>
                    ))}
                  </div>
                  <div className="linked-markup-actions">
                    <button
                      type="button"
                      className="viewer-action-btn secondary"
                      onClick={() => handleOpenMarkupTool(doc.id)}
                    >
                      열기
                    </button>
                    <button
                      type="button"
                      className="viewer-action-btn secondary"
                      style={{ borderColor: '#fecdd3', color: '#b91c1c', background: '#ffe4e6' }}
                      onClick={() => handleDetachMarkup(doc.id)}
                      disabled={detachingDocId === doc.id}
                    >
                      {detachingDocId === doc.id ? '해제 중...' : '연결 해제'}
                    </button>
                  </div>
                </div>
              ))
            )}
            {linkingDocId && (
              <p style={{ marginTop: 8, fontSize: 12, color: '#475467' }}>
                도면을 작업일지에 연결하는 중입니다. 잠시만 기다려 주세요.
              </p>
            )}
          </div>
        </section>
      </div>
    </MobileLayoutShell>
  )
}
