'use client'

import React, { useEffect, useState } from 'react'
import clsx from 'clsx'
import { X, DownloadCloud, ExternalLink, Minus, Plus } from 'lucide-react'
import '@/modules/mobile/styles/worklogs.css'
import { WorklogDetail, WorklogAttachment } from '@/types/worklog'
import { AttachmentTabs, TabKey } from './AttachmentTabs'
import AttachmentGallery from './AttachmentGallery'

export interface DiaryDetailViewerProps {
  open: boolean
  worklog?: WorklogDetail | null
  onClose?: () => void
  onDownload?: (worklogId: string) => void
  onOpenDocument?: (attachment: WorklogAttachment) => void
  onOpenMarkup?: (worklog: WorklogDetail) => void
  onOpenMarkupDoc?: (docId: string, worklog: WorklogDetail) => void
  className?: string
}

const ATTACHMENT_LABELS: Record<keyof WorklogDetail['attachments'], string> = {
  photos: '사진대지',
  drawings: '진행도면',
  completionDocs: '완료확인서',
  others: '기타 서류',
}

export const DiaryDetailViewer: React.FC<DiaryDetailViewerProps> = ({
  open,
  worklog,
  onClose,
  onDownload,
  onOpenDocument,
  onOpenMarkup,
  onOpenMarkupDoc,
  className = '',
}) => {
  if (!open || !worklog) return null

  const [linkedMarkups, setLinkedMarkups] = useState<
    Array<{
      id: string
      title: string
      updatedAt?: string
      previewUrl?: string
      blueprintUrl?: string
    }>
  >([])
  const [loadingMarkups, setLoadingMarkups] = useState(false)
  const [activeTab, setActiveTab] = useState<TabKey>('photos')
  const [zoom, setZoom] = useState<number>(100)

  useEffect(() => {
    const load = async () => {
      if (!worklog?.id) return
      setLoadingMarkups(true)
      try {
        const res = await fetch(`/api/markup-documents?worklogId=${encodeURIComponent(worklog.id)}`)
        const json = await res.json()
        const arr = Array.isArray(json?.data)
          ? json.data
          : Array.isArray(json?.documents)
            ? json.documents
            : []
        const items = arr.map((doc: any) => ({
          id: doc.id,
          title: doc.title || '마킹 문서',
          updatedAt: doc.updated_at,
          previewUrl: doc.preview_image_url || doc.previewUrl || undefined,
          blueprintUrl: doc.original_blueprint_url || doc.blueprintUrl || undefined,
        }))
        setLinkedMarkups(items)
      } catch {
        setLinkedMarkups([])
      } finally {
        setLoadingMarkups(false)
      }
    }
    if (open) load()
  }, [open, worklog?.id])

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose?.()
    }
  }

  const renderAttachmentGroup = (
    items: WorklogAttachment[],
    emptyMessage = '첨부된 파일이 없습니다.'
  ) => {
    if (items.length === 0) {
      return <p style={{ color: '#94a3b8', fontSize: 13 }}>{emptyMessage}</p>
    }

    return (
      <div className="attachment-gallery">
        {items.map(item => (
          <div key={item.id} className="attachment-card">
            <div className="attachment-card-title">{item.name}</div>
            {item.previewUrl ? (
              <img className="attachment-preview" src={item.previewUrl} alt={item.name} />
            ) : (
              <div className="attachment-preview" aria-hidden="true" />
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                type="button"
                className="viewer-action-btn secondary"
                onClick={() => onOpenDocument?.(item)}
              >
                <ExternalLink size={16} aria-hidden="true" />
              </button>
              <a
                className="viewer-action-btn secondary"
                href={item.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <DownloadCloud size={16} aria-hidden="true" />
              </a>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const infoRows: Array<{ label: string; value: string }> = [
    { label: '현장명', value: worklog.siteName },
    { label: '주소', value: worklog.siteAddress || '미등록' },
    { label: '부재명', value: worklog.memberTypes.join(', ') || '미지정' },
    { label: '작업공정', value: worklog.processes.join(', ') || '미지정' },
    { label: '작업유형', value: worklog.workTypes.join(', ') || '미지정' },
    {
      label: '블럭/동/층',
      value:
        worklog.location.block || worklog.location.dong || worklog.location.unit
          ? `${worklog.location.block} ${worklog.location.dong} ${worklog.location.unit}`.trim()
          : '미입력',
    },
  ]

  const counts = worklog.attachmentCounts

  const drawingsWithMarkups: WorklogAttachment[] = (() => {
    const base = worklog.attachments.drawings
    if (!linkedMarkups.length) return base
    const mapped = linkedMarkups.map(doc => ({
      id: `markup-${doc.id}`,
      name: doc.title,
      type: 'document' as const,
      category: 'markup' as const,
      previewUrl: doc.previewUrl || doc.blueprintUrl,
      fileUrl: doc.blueprintUrl || '#',
    }))
    return [...mapped, ...base]
  })()

  const currentItems: WorklogAttachment[] =
    activeTab === 'photos'
      ? worklog.attachments.photos
      : activeTab === 'drawings'
        ? drawingsWithMarkups
        : activeTab === 'completionDocs'
          ? worklog.attachments.completionDocs
          : worklog.attachments.others

  const decZoom = () => setZoom(z => Math.max(75, z - 25))
  const incZoom = () => setZoom(z => Math.min(150, z + 25))

  return (
    <div
      className={clsx('diary-viewer-overlay', className)}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
    >
      <div className="diary-viewer-panel">
        <header className="detail-header">
          <h2 className="detail-title">작업일지 상세</h2>
          <button type="button" className="close-pill" onClick={onClose}>
            닫기
          </button>
        </header>

        <div className="diary-viewer-body">
          {/* 정보 테이블 */}
          <section className="info-table" aria-label="기본 정보">
            {infoRows.map(row => (
              <div key={row.label} className="info-row">
                <div className="info-label">{row.label}</div>
                <div className="info-value">{row.value}</div>
              </div>
            ))}
          </section>

          {/* 첨부 탭 + 줌 컨트롤 */}
          <section aria-label="첨부">
            <AttachmentTabs active={activeTab} counts={counts} onChange={setActiveTab} />
            <div className="zoom-toolbar">
              <button type="button" className="zoom-btn" onClick={decZoom} aria-label="작게">
                <Minus size={14} />
              </button>
              <span className="zoom-level">{zoom}%</span>
              <button type="button" className="zoom-btn" onClick={incZoom} aria-label="크게">
                <Plus size={14} />
              </button>
            </div>
            {/* 갤러리 */}
            {activeTab === 'drawings' && loadingMarkups ? (
              <div className="list-footer" aria-live="polite">
                불러오는 중...
              </div>
            ) : (
              <AttachmentGallery
                items={currentItems}
                zoom={zoom}
                onOpen={item => {
                  if (activeTab === 'drawings' && item.id.startsWith('markup-')) {
                    const realId = item.id.replace('markup-', '')
                    onOpenMarkupDoc?.(realId, worklog)
                    return
                  }
                  onOpenDocument?.(item)
                }}
              />
            )}
          </section>
        </div>

        <footer className="diary-viewer-footer">
          {/* 상단에 닫기 존재: 푸터는 다운로드 정도만 유지 */}
          <button
            type="button"
            className="viewer-action-btn secondary"
            onClick={() => onDownload?.(worklog.id)}
          >
            전체 다운로드
          </button>
        </footer>
      </div>
    </div>
  )
}

export default DiaryDetailViewer
