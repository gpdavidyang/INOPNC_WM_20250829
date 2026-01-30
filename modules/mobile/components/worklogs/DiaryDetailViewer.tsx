'use client'

import '@/modules/mobile/styles/worklogs.css'
import { WorklogAttachment, WorklogDetail } from '@/types/worklog'
import clsx from 'clsx'
import { DownloadCloud, ExternalLink } from 'lucide-react'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import AttachmentGallery from './AttachmentGallery'
import { AttachmentTabs, TabKey } from './AttachmentTabs'

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
  const [linkedMarkups, setLinkedMarkups] = useState<
    Array<{
      id: string
      title: string
      updatedAt?: string
      previewUrl?: string
      blueprintUrl?: string
      pdfUrl?: string
      linkedWorklogIds: string[]
    }>
  >([])
  const [loadingMarkups, setLoadingMarkups] = useState(false)
  const [activeTab, setActiveTab] = useState<TabKey>('photos')
  const [zoom, setZoom] = useState<number>(100)

  useEffect(() => {
    const load = async () => {
      if (!open || !worklog?.id) return
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
          pdfUrl:
            typeof doc?.metadata?.snapshot_pdf_url === 'string'
              ? doc.metadata.snapshot_pdf_url
              : doc.snapshot_pdf_url || undefined,
          linkedWorklogIds: Array.isArray(doc.linked_worklog_ids)
            ? doc.linked_worklog_ids.filter(
                (value: unknown): value is string => typeof value === 'string' && value.length > 0
              )
            : doc.linked_worklog_id
              ? [doc.linked_worklog_id]
              : [],
        }))
        setLinkedMarkups(items)
      } catch {
        setLinkedMarkups([])
      } finally {
        setLoadingMarkups(false)
      }
    }
    load()
  }, [open, worklog?.id])

  if (!open || !worklog) return null

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
              <Image
                className="attachment-preview"
                src={item.previewUrl}
                alt={item.name}
                width={400}
                height={300}
                unoptimized
              />
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

  const normalizedWorkerNames =
    Array.isArray(worklog.workerNames) && worklog.workerNames.length > 0
      ? worklog.workerNames
          .map(name => (typeof name === 'string' ? name.trim() : ''))
          .filter(name => name.length > 0)
      : worklog.createdBy?.name && worklog.createdBy.name !== '작성자'
        ? [worklog.createdBy.name.trim()]
        : []

  const workerKeySet = new Set(
    normalizedWorkerNames.map(name => name.replace(/\s+/g, '').toLowerCase())
  )

  const memberTypeDisplayList = Array.isArray(worklog.memberTypes)
    ? worklog.memberTypes
        .map(name => (typeof name === 'string' ? name.trim() : ''))
        .filter(
          name => name.length > 0 && !workerKeySet.has(name.replace(/\s+/g, '').toLowerCase())
        )
    : []

  const memberTypeDisplay =
    memberTypeDisplayList.length > 0 ? memberTypeDisplayList.join(', ') : '미지정'
  const workerDisplay =
    normalizedWorkerNames.length > 0 ? normalizedWorkerNames.join(', ') : '미등록'

  const infoRows: Array<{ label: string; value: string }> = [
    { label: '현장명', value: worklog.siteName },
    { label: '주소', value: worklog.siteAddress || '미등록' },
    { label: '작업자명', value: workerDisplay },
    { label: '부재명', value: memberTypeDisplay },
    { label: '작업공정', value: worklog.processes.join(', ') || '미지정' },
    { label: '작업구간:작업유형', value: worklog.workTypes.join(', ') || '미지정' },
    {
      label: '작업구간:블록/동/층',
      value:
        [
          worklog.location.block ? `${worklog.location.block}블록` : '',
          worklog.location.dong ? `${worklog.location.dong}동` : '',
          worklog.location.unit ? `${worklog.location.unit}층` : '',
        ]
          .filter(Boolean)
          .join(' ') || '미입력',
    },
  ]

  const renderLinkedMarkups = () => {
    if (!linkedMarkups.length) return null
    return (
      <section className="info-table" aria-label="연결된 마킹 도면">
        <div className="info-row">
          <div className="info-label">연결된 도면</div>
          <div className="info-value">
            {linkedMarkups.map(doc => (
              <div key={doc.id} className="linked-markup-card">
                <div className="linked-markup-title">{doc.title}</div>
                <div className="linked-markup-badges">
                  {(doc.linkedWorklogIds || [worklog.id]).map(id => (
                    <span key={id} className="linked-chip">
                      #{id}
                    </span>
                  ))}
                </div>
                <div className="linked-markup-actions">
                  {doc.blueprintUrl ? (
                    <a
                      href={doc.blueprintUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="viewer-action-btn secondary"
                    >
                      보기
                    </a>
                  ) : null}
                  {doc.pdfUrl ? (
                    <a
                      href={doc.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="viewer-action-btn secondary"
                    >
                      PDF
                    </a>
                  ) : null}
                  <button
                    type="button"
                    className="viewer-action-btn secondary"
                    onClick={() => onOpenMarkupDoc?.(doc.id, worklog)}
                  >
                    마킹 열기
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  const renderMaterials = () => {
    if (!worklog.materials || worklog.materials.length === 0) return null
    return (
      <section className="info-table" aria-label="자재 사용 내역">
        <div className="info-row">
          <div className="info-label">자재 사용</div>
          <div className="info-value">
            {worklog.materials
              .filter(m => m.material_name)
              .map((m, i) => (
                <div key={i} style={{ marginBottom: i < worklog.materials!.length - 1 ? 4 : 0 }}>
                  {m.material_name} ({m.quantity}
                  {m.unit})
                  {m.notes ? (
                    <div style={{ fontSize: '11px', color: '#667085', marginTop: '1px' }}>
                      {m.notes}
                    </div>
                  ) : null}
                </div>
              ))}
          </div>
        </div>
      </section>
    )
  }

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

            {/* 작업 항목 (Tasks) - 기존 info-table 내부에 통합 */}
            {(worklog as any).tasks?.map((t: any, i: number) => (
              <div key={`task-${i}`} className="info-row">
                <div className="info-label">작업 {i + 1}</div>
                <div className="info-value">
                  부재명: {(t.memberTypes || []).join(', ') || '-'} / 공정:{' '}
                  {(t.processes || []).join(', ') || '-'} / 유형:{' '}
                  {(t.workTypes || []).join(', ') || '-'} / 위치:{' '}
                  {[
                    t.location?.block ? `${t.location.block}블록` : '',
                    t.location?.dong ? `${t.location.dong}동` : '',
                    t.location?.unit ? `${t.location.unit}층` : '',
                  ]
                    .filter(Boolean)
                    .join(' ') || '-'}
                </div>
              </div>
            ))}

            {/* 자재 사용 내역 - info-table 내부에 통합 */}
            {!worklog.materials || worklog.materials.length === 0 ? (
              <div className="info-row">
                <div className="info-label">자재 사용 내역</div>
                <div className="info-value">미입력</div>
              </div>
            ) : (
              worklog.materials.map((m, i) => (
                <div key={`material-${i}`} className="info-row">
                  <div className="info-label">{i === 0 ? '자재 사용 내역' : ''}</div>
                  <div className="info-value">
                    {m.material_name}
                    {typeof m.quantity === 'number' ? ` ${m.quantity}` : ''}
                    {m.unit ? `${m.unit}` : ''}
                    {m.notes ? ` / ${m.notes}` : ''}
                  </div>
                </div>
              ))
            )}
          </section>

          {renderMaterials()}
          {renderLinkedMarkups()}

          {/* 첨부 탭 + 줌 컨트롤 */}
          <section aria-label="첨부">
            <AttachmentTabs
              active={activeTab}
              counts={counts}
              onChange={setActiveTab}
              idBase="attachments"
            />
            <div className="zoom-toolbar">
              <button type="button" className="zoom-btn" onClick={decZoom} aria-label="작게">
                –
              </button>
              <span className="zoom-level">{zoom}%</span>
              <button type="button" className="zoom-btn" onClick={incZoom} aria-label="크게">
                +
              </button>
            </div>
            {/* 갤러리 */}
            <div
              role="tabpanel"
              id={`attachments-panel-${activeTab}`}
              aria-labelledby={`attachments-tab-${activeTab}`}
            >
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
            </div>
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
