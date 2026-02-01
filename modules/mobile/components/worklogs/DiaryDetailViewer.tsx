'use client'

import '@/modules/mobile/styles/worklogs.css'
import { WorklogAttachment, WorklogDetail } from '@/types/worklog'
import clsx from 'clsx'
import { useRouter } from 'next/navigation'
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
  onEdit?: (worklog: WorklogDetail) => void
  className?: string
}

export const DiaryDetailViewer: React.FC<DiaryDetailViewerProps> = ({
  open,
  worklog,
  onClose,
  onDownload,
  onOpenDocument,
  onEdit,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('photos')
  const [uploadedPhotoTotal, setUploadedPhotoTotal] = useState(0)
  const [uploadedDrawingTotal, setUploadedDrawingTotal] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      if (!open || !worklog?.id) return
      try {
        const params = new URLSearchParams()
        params.set('worklog_id', worklog.id)
        params.set('limit', '1')
        const res = await fetch(`/api/mobile/media/photos?${params.toString()}`, {
          cache: 'no-store',
        })
        const json = await res.json().catch(() => ({}))
        const total =
          typeof json?.data?.total === 'number'
            ? json.data.total
            : Array.isArray(json?.data?.photos)
              ? json.data.photos.length
              : 0
        setUploadedPhotoTotal(Number.isFinite(total) ? total : 0)
      } catch {
        setUploadedPhotoTotal(0)
      }
    }
    void load()
  }, [open, worklog?.id])

  useEffect(() => {
    const load = async () => {
      if (!open || !worklog?.id) return
      try {
        const params = new URLSearchParams()
        params.set('worklog_id', worklog.id)
        if (worklog.siteId) params.set('site_id', worklog.siteId)
        const res = await fetch(`/api/mobile/media/drawings?${params.toString()}`, {
          cache: 'no-store',
        })
        const json = await res.json().catch(() => ({}))
        const total = Array.isArray(json?.data?.drawings) ? json.data.drawings.length : 0
        setUploadedDrawingTotal(Number.isFinite(total) ? total : 0)
      } catch {
        setUploadedDrawingTotal(0)
      }
    }
    void load()
  }, [open, worklog?.id, worklog?.siteId])

  if (!open || !worklog) return null

  const normalizedStatus = (worklog.status || '').toLowerCase()
  const editableStatuses: Array<string> = ['draft', 'submitted', 'rejected']
  const canEditReport = editableStatuses.includes(normalizedStatus)

  const handleEditClick = () => {
    if (!worklog?.id) return
    if (onEdit) {
      onEdit(worklog)
      onClose?.()
      return
    }
    router.push(`/mobile/worklog?edit=${worklog.id}`)
  }

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose?.()
    }
  }

  const handleTabChange = (key: TabKey) => {
    if (key === 'drawings') {
      const params = new URLSearchParams()
      params.set('tab', 'drawing')
      if (worklog.siteId) params.set('siteId', worklog.siteId)
      params.set('worklogId', worklog.id)
      router.push(`/mobile/media?${params.toString()}`)
      onClose?.()
      return
    }
    if (key === 'photos') {
      const params = new URLSearchParams()
      params.set('tab', 'photo')
      if (worklog.siteId) params.set('siteId', worklog.siteId)
      params.set('worklogId', worklog.id)
      router.push(`/mobile/media?${params.toString()}`)
      return
    }
    setActiveTab(key)
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
    { label: '인원', value: `${worklog.workers || Math.ceil(worklog.manpower)} 명` },
    { label: '공수', value: `${worklog.manpower.toFixed(1)} 공수` },
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

  if (normalizedStatus === 'rejected' && (worklog as any).rejectionReason) {
    infoRows.splice(0, 0, {
      label: '반려 사유',
      value: (worklog as any).rejectionReason,
    })
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
          <div className="detail-header-actions">
            {canEditReport && (
              <button type="button" className="close-pill edit-pill" onClick={handleEditClick}>
                수정
              </button>
            )}
            <button type="button" className="close-pill" onClick={onClose}>
              닫기
            </button>
          </div>
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
              worklog.materials.map((m, i) => {
                const qty = (m as any).quantity_val || (m as any).amount || m.quantity || 0
                return (
                  <div key={`material-${i}`} className="info-row">
                    <div className="info-label">{i === 0 ? '자재 사용 내역' : ''}</div>
                    <div className="info-value">
                      {m.material_name}
                      {qty ? ` ${qty}` : ''}
                      {m.unit ? `${m.unit}` : ''}
                      {m.notes ? ` / ${m.notes}` : ''}
                    </div>
                  </div>
                )
              })
            )}
          </section>

          {/* 첨부 탭 + 줌 컨트롤 */}
          {(() => {
            const counts = {
              photos: uploadedPhotoTotal,
              drawings: uploadedDrawingTotal,
              completionDocs: worklog.attachments.completionDocs.length,
              others: worklog.attachments.others.length,
            }

            const galleryItems = worklog.attachments[activeTab] || []
            return (
              <section aria-label="첨부">
                <AttachmentTabs
                  active={activeTab}
                  counts={counts}
                  onChange={handleTabChange}
                  idBase="attachments"
                />
                {/* 갤러리 */}
                <div
                  role="tabpanel"
                  id={`attachments-panel-${activeTab}`}
                  aria-labelledby={`attachments-tab-${activeTab}`}
                >
                  <AttachmentGallery
                    items={galleryItems}
                    zoom={100}
                    onOpen={item => onOpenDocument?.(item)}
                  />
                </div>
              </section>
            )
          })()}
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
