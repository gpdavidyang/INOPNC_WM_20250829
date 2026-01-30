'use client'

import { openFileRecordInNewTab } from '@/lib/files/preview'
import React, { useCallback, useMemo } from 'react'
import { WorkLog } from '../../types/work-log.types'
import {
  formatDate,
  formatFileSize,
  getStatusColor,
  getStatusText,
} from '../../utils/work-log-utils'
import { ReportSelectionData, ReportSelectionModal } from './ReportSelectionModal'

interface WorkLogDetailModalProps {
  isOpen: boolean
  onClose: () => void
  workLog: WorkLog | null
  onEdit?: () => void
  onPrint?: () => void
  onApprove?: () => void
}

export const WorkLogDetailModal: React.FC<WorkLogDetailModalProps> = React.memo(
  ({ isOpen, onClose, workLog, onEdit, onPrint, onApprove }) => {
    // React hooks must be called before any early returns
    const handlePrint = useCallback(() => {
      if (onPrint) {
        onPrint()
      } else {
        window.print()
      }
    }, [onPrint])

    const handleShare = useCallback(async () => {
      if (navigator.share && workLog) {
        try {
          await navigator.share({
            title: `작업일지 - ${workLog.siteName}`,
            text: `${formatDate(workLog.date)} 작업일지`,
            url: window.location.href,
          })
        } catch (error) {
          console.error('Share failed:', error)
        }
      }
    }, [workLog])

    const openAttachment = useCallback(async (file?: { url?: string; name?: string }) => {
      if (!file?.url) return
      try {
        await openFileRecordInNewTab({
          file_url: file.url,
          file_name: file.name,
          title: file.name || '첨부파일',
        })
      } catch (error) {
        console.error('Failed to open attachment', error)
        const isStandalone =
          typeof window !== 'undefined' &&
          (window.matchMedia?.('(display-mode: standalone)').matches ||
            (navigator as any)?.standalone === true)
        if (isStandalone) window.location.assign(file.url)
        else window.open(file.url, '_blank', 'noopener,noreferrer')
      }
    }, [])

    // 첨부파일 존재 여부 메모이제이션
    const hasAttachments = useMemo(() => {
      if (!workLog) return false
      return (
        workLog.attachments.photos.length > 0 ||
        workLog.attachments.drawings.length > 0 ||
        workLog.attachments.confirmations.length > 0
      )
    }, [workLog])

    // 보고서 생성 모달 상태
    const [isReportModalOpen, setIsReportModalOpen] = React.useState(false)
    const [isGeneratingReport, setIsGeneratingReport] = React.useState(false)

    const handleReportGenerate = async (data: ReportSelectionData) => {
      try {
        setIsGeneratingReport(true)
        console.log('Generating report with:', data)
        toast.info('보고서 생성 중...')

        // 1. Fetch Selected Photos
        // TODO: Need an API or helper to fetch full photo objects by photo_grid_report ID or similar logic
        // For now, we will simulate fetching or pass dummy data if not available
        const photos = await fetchSelectedPhotos(data.selectedPhotoSheets)

        // 2. Fetch Selected Drawings
        const drawings = await fetchSelectedDrawings(data.selectedDrawings)

        // 3. Generate PDF
        const { generateIntegratedReport } = await import('@/lib/report/integrated-pdf-generator')
        const pdfDoc = await generateIntegratedReport({
          workLog,
          selection: data,
          photos,
          drawings,
        })

        // 4. Download
        pdfDoc.save(`작업보고서_${workLog.siteName}_${workLog.date}.pdf`)
        toast.success('보고서가 생성되었습니다.')
      } catch (error) {
        console.error('Report generation failed:', error)
        toast.error('보고서 생성에 실패했습니다.')
      } finally {
        setIsGeneratingReport(false)
        setIsReportModalOpen(false)
      }
    }

    // Mock fetchers (Implementation needed in separate service)
    const fetchSelectedPhotos = async (ids: string[]) => {
      // In real app: supabase.from('photo_grid_reports').select('...').in('id', ids)
      return []
    }

    const fetchSelectedDrawings = async (ids: string[]) => {
      // In real app: supabase.from('markup_documents').select('...').in('id', ids)
      return []
    }

    if (!isOpen || !workLog) return null

    return (
      <>
        {/* 오버레이 */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 animate-fadeIn"
          onClick={onClose}
        />

        {/* 모달 */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[var(--card)] rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden transform transition-all duration-300 animate-slideUp">
            {/* 헤더 */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--line)]">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-[var(--text)]">작업일지 상세</h2>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(workLog.status)}`}
                >
                  {getStatusText(workLog.status)}
                </span>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-[var(--bg)] rounded-lg">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* 내용 */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {/* 기본 정보 */}
              <div className="mb-6 p-4 bg-[var(--bg)] rounded-xl">
                <h3 className="font-semibold text-[var(--text)] mb-3">기본 정보</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-[var(--muted)]">작업일자</p>
                    <p className="font-medium text-[var(--text)]">{formatDate(workLog.date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--muted)]">현장</p>
                    <p className="font-medium text-[var(--text)]">{workLog.siteName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--muted)]">위치</p>
                    <p className="font-medium text-[var(--text)]">
                      {workLog.location.block}블럭 {workLog.location.dong}동 {workLog.location.unit}
                      호
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--muted)]">진행률</p>
                    <p className="font-medium text-[var(--text)]">{workLog.progress}%</p>
                  </div>
                </div>
              </div>

              {/* 작업 정보 */}
              <div className="mb-6 p-4 bg-[var(--accent)] bg-opacity-10 rounded-xl">
                <h3 className="font-semibold text-[var(--text)] mb-3">작업 정보</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-[var(--muted)] mb-1">부재명</p>
                    <div className="flex flex-wrap gap-2">
                      {workLog.memberTypes.map((type, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-[var(--accent)] bg-opacity-20 text-[var(--accent)] rounded-lg text-sm"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--muted)] mb-1">작업공정</p>
                    <div className="flex flex-wrap gap-2">
                      {workLog.workProcesses.map((process, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-[var(--num)] bg-opacity-20 text-[var(--num)] rounded-lg text-sm"
                        >
                          {process}
                        </span>
                      ))}
                    </div>
                  </div>
                  {workLog.workTypes.length > 0 && (
                    <div>
                      <p className="text-sm text-[var(--muted)] mb-1">작업유형</p>
                      <div className="flex flex-wrap gap-2">
                        {workLog.workTypes.map((type, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-[var(--accent)] bg-opacity-30 text-[var(--accent)] rounded-lg text-sm"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 작업자 정보 */}
              <div className="mb-6 p-4 bg-[var(--num)] bg-opacity-10 rounded-xl">
                <h3 className="font-semibold text-[var(--text)] mb-3">작업자 정보</h3>
                <div className="space-y-2">
                  {workLog.workers.map(worker => (
                    <div
                      key={worker.id}
                      className="flex items-center justify-between py-2 border-b border-[var(--line)] last:border-0"
                    >
                      <span className="text-sm font-medium">{worker.name}</span>
                      <span className="text-sm text-[var(--muted)]">{worker.hours}시간</span>
                    </div>
                  ))}
                  <div className="pt-2 flex items-center justify-between">
                    <span className="font-semibold">총 작업시간</span>
                    <span className="font-semibold text-[var(--num)]">
                      {workLog.totalHours}시간
                    </span>
                  </div>
                </div>
              </div>

              {Array.isArray(workLog.materials) && workLog.materials.length > 0 && (
                <div className="mb-6 p-4 bg-[var(--accent)] bg-opacity-15 rounded-xl">
                  <h3 className="font-semibold text-[var(--text)] mb-3">자재 사용량</h3>
                  <div className="space-y-2">
                    {workLog.materials.map((material, index) => {
                      const quantity = Number(material.quantity ?? 0)
                      const quantityText = Number.isFinite(quantity)
                        ? quantity.toLocaleString('ko-KR')
                        : String(material.quantity || '')
                      const unitText = material.unit ? ` ${material.unit}` : ''
                      return (
                        <div
                          key={`${material.material_name}-${index}`}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm text-[var(--muted)]">
                            {material.material_name || material.material_code || '자재'}
                          </span>
                          <span className="text-lg font-bold text-[var(--accent)]">
                            {quantityText}
                            {unitText}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* 첨부파일 */}
              {hasAttachments && (
                <div className="mb-6 p-4 bg-[var(--num)] bg-opacity-10 rounded-xl">
                  <h3 className="font-semibold text-[var(--text)] mb-3">첨부파일</h3>

                  {/* 사진 */}
                  {workLog.attachments.photos.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-[var(--muted)] mb-2">
                        사진 ({workLog.attachments.photos.length})
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {workLog.attachments.photos.map(photo => (
                          <button
                            key={photo.id}
                            type="button"
                            onClick={() => openAttachment(photo)}
                            className="relative aspect-square bg-[var(--line)] rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent)]"
                          >
                            <img
                              src={photo.url}
                              alt={photo.name}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 도면 */}
                  {workLog.attachments.drawings.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-[var(--muted)] mb-2">
                        도면 ({workLog.attachments.drawings.length})
                      </p>
                      <div className="space-y-2">
                        {workLog.attachments.drawings.map(drawing => (
                          <button
                            key={drawing.id}
                            type="button"
                            onClick={() => openAttachment(drawing)}
                            className="flex w-full items-center justify-between p-2 bg-[var(--card)] rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent)]"
                          >
                            <div className="flex items-center gap-2">
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="text-[var(--accent)]"
                              >
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                              </svg>
                              <span className="text-sm">{drawing.name}</span>
                            </div>
                            <span className="text-xs text-[var(--muted)]">
                              {formatFileSize(drawing.size)}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 확인서 */}
                  {workLog.attachments.confirmations.length > 0 && (
                    <div>
                      <p className="text-sm text-[var(--muted)] mb-2">
                        확인서 ({workLog.attachments.confirmations.length})
                      </p>
                      <div className="space-y-2">
                        {workLog.attachments.confirmations.map(confirmation => (
                          <button
                            key={confirmation.id}
                            type="button"
                            onClick={() => openAttachment(confirmation)}
                            className="flex w-full items-center justify-between p-2 bg-[var(--card)] rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent)]"
                          >
                            <div className="flex items-center gap-2">
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="text-[var(--accent)]"
                              >
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <polyline points="16 11 12 15 10 13" />
                              </svg>
                              <span className="text-sm">{confirmation.name}</span>
                            </div>
                            <span className="text-xs text-[var(--muted)]">
                              {formatFileSize(confirmation.size)}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 메모 */}
              {workLog.notes && (
                <div className="mb-6 p-4 bg-[var(--bg)] rounded-xl">
                  <h3 className="font-semibold text-[var(--text)] mb-2">메모</h3>
                  <p className="text-sm text-[var(--muted)] whitespace-pre-wrap">{workLog.notes}</p>
                </div>
              )}

              {/* 작성 정보 */}
              <div className="p-4 bg-[var(--bg)] rounded-xl">
                <h3 className="font-semibold text-[var(--text)] mb-3">작성 정보</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-[var(--muted)]">작성일시</p>
                    <p className="font-medium text-[var(--text)]">
                      {new Date(workLog.createdAt).toLocaleString('ko-KR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-[var(--muted)]">수정일시</p>
                    <p className="font-medium text-[var(--text)]">
                      {new Date(workLog.updatedAt).toLocaleString('ko-KR')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 푸터 */}
            <div className="flex gap-3 p-6 border-t border-[var(--line)]">
              {workLog.status === 'draft' && (
                <>
                  <button
                    onClick={onEdit}
                    className="flex-1 h-12 bg-[var(--bg)] text-[var(--muted)] rounded-lg font-medium hover:bg-[var(--line)]"
                  >
                    수정
                  </button>
                  <button
                    onClick={onApprove}
                    className="flex-1 h-12 bg-[var(--accent)] text-white rounded-lg font-medium hover:opacity-90"
                  >
                    승인
                  </button>
                </>
              )}
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="flex-1 h-12 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                보고서
              </button>
              <button
                onClick={handleShare}
                className="flex-1 h-12 bg-[var(--num)] bg-opacity-20 text-[var(--num)] rounded-lg font-medium hover:bg-opacity-30"
              >
                공유
              </button>
            </div>
          </div>
        </div>

        {/* 보고서 생성 모달 */}
        <ReportSelectionModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          workLog={workLog}
          onGenerate={handleReportGenerate}
        />
      </>
    )
  }
)
