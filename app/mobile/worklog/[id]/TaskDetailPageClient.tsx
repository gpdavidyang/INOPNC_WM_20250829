'use client'

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

  return (
    <MobileLayoutShell>
      <div className="main-content" style={{ paddingTop: 20 }}>
        {/* Header */}
        <div className="fullscreen-header" style={{ position: 'sticky', top: 0, zIndex: 5 }}>
          <h3>작업일지 상세</h3>
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
                <img
                  key={a.id}
                  src={a.previewUrl || a.fileUrl}
                  alt={a.name}
                  className="photo-item"
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
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={first.previewUrl || first.fileUrl}
                      alt={first.name}
                      className="document-image"
                      style={{ transform: `scale(${zoom / 100})` }}
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
      </div>
    </MobileLayoutShell>
  )
}
