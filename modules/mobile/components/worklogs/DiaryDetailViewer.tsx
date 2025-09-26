'use client'

import React from 'react'
import clsx from 'clsx'
import { X, DownloadCloud, ExternalLink } from 'lucide-react'
import '@/modules/mobile/styles/worklogs.css'
import { WorklogDetail, WorklogAttachment } from '@/types/worklog'

export interface DiaryDetailViewerProps {
  open: boolean
  worklog?: WorklogDetail | null
  onClose?: () => void
  onDownload?: (worklogId: string) => void
  onOpenDocument?: (attachment: WorklogAttachment) => void
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
  className = '',
}) => {
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

  return (
    <div
      className={clsx('diary-viewer-overlay', className)}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
    >
      <div className="diary-viewer-panel">
        <header className="diary-viewer-header">
          <div>
            <h2 className="diary-viewer-title">{worklog.siteName}</h2>
            <p style={{ marginTop: 4, color: '#64748b', fontSize: 13 }}>
              {worklog.workDate} · {worklog.processes.join(', ') || '공정 정보 없음'}
            </p>
          </div>

          <button className="diary-viewer-close" onClick={onClose} aria-label="상세 보기 닫기">
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="diary-viewer-body">
          <section className="diary-info-list" aria-label="기본 정보">
            <div className="diary-info-item">
              <span>현장</span>
              <strong>{worklog.siteName}</strong>
            </div>
            <div className="diary-info-item">
              <span>작업공정</span>
              <strong>{worklog.processes.join(', ') || '미지정'}</strong>
            </div>
            <div className="diary-info-item">
              <span>작업유형</span>
              <strong>{worklog.workTypes.join(', ') || '미지정'}</strong>
            </div>
            <div className="diary-info-item">
              <span>공수</span>
              <strong>{worklog.manpower.toFixed(1)} 인/일</strong>
            </div>
            <div className="diary-info-item">
              <span>작성자</span>
              <strong>{worklog.createdBy.name}</strong>
            </div>
            <div className="diary-info-item">
              <span>위치</span>
              <strong>
                {worklog.location.block || worklog.location.dong || worklog.location.unit
                  ? `${worklog.location.block} ${worklog.location.dong} ${worklog.location.unit}`.trim()
                  : '미입력'}
              </strong>
            </div>
            {worklog.notes ? (
              <div
                className="diary-info-item"
                style={{ alignItems: 'flex-start', flexDirection: 'column' }}
              >
                <span style={{ color: '#64748b' }}>특이사항</span>
                <strong style={{ marginTop: 6, fontWeight: 500 }}>{worklog.notes}</strong>
              </div>
            ) : null}
          </section>

          <section
            aria-label="첨부 문서 목록"
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            {(Object.keys(worklog.attachments) as Array<keyof WorklogDetail['attachments']>).map(
              groupKey => (
                <article key={groupKey}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>
                    {ATTACHMENT_LABELS[groupKey]}
                  </h3>
                  {renderAttachmentGroup(worklog.attachments[groupKey])}
                </article>
              )
            )}
          </section>
        </div>

        <footer className="diary-viewer-footer">
          <button type="button" className="viewer-action-btn secondary" onClick={onClose}>
            닫기
          </button>
          <button
            type="button"
            className="viewer-action-btn primary"
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
