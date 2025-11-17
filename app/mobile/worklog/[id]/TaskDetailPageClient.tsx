'use client'

import Image from 'next/image'
import React from 'react'
import type { WorklogAttachment, WorklogDetail } from '@/types/worklog'
import { MobileLayout as MobileLayoutShell } from '@/modules/mobile/components/layout/MobileLayout'
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

        {markupDrawings.length > 0 ? (
          <section style={{ marginTop: 16 }}>
            <h4 style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>연결된 진행도면</h4>
            {markupDrawings.map(item => {
              const linkedIds = extractLinkedWorklogIds(item)
              const markupDocId = getMarkupDocumentId(item)
              const fallbackWorklogId = linkedIds[0] || detail.id
              const markupHref = markupDocId
                ? `/mobile/markup-tool?mode=start&docId=${markupDocId}`
                : null
              const documentsHref = `/documents/hub?worklogId=${fallbackWorklogId}${
                detail.siteId ? `&siteId=${detail.siteId}` : ''
              }`
              return (
                <div key={item.id} className="linked-markup-card">
                  <div className="linked-markup-title">{item.name || '도면'}</div>
                  <div className="linked-markup-badges">
                    {linkedIds.map(id => (
                      <span key={id} className="linked-chip">
                        #{id}
                      </span>
                    ))}
                  </div>
                  <div className="linked-markup-actions">
                    {item.fileUrl ? (
                      <a
                        className="viewer-action-btn secondary"
                        href={item.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        열기
                      </a>
                    ) : null}
                    {extractSnapshotPdfUrl(item) ? (
                      <a
                        className="viewer-action-btn secondary"
                        href={extractSnapshotPdfUrl(item)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        PDF
                      </a>
                    ) : null}
                    {markupHref ? (
                      <a className="viewer-action-btn secondary" href={markupHref}>
                        마킹 도구
                      </a>
                    ) : null}
                    <a className="viewer-action-btn secondary" href={documentsHref}>
                      현장공유함
                    </a>
                  </div>
                </div>
              )
            })}
          </section>
        ) : null}
      </div>
    </MobileLayoutShell>
  )
}
