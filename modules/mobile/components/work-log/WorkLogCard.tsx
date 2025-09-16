'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { WorkLog } from '../../types/work-log.types'
import {
  formatDate,
  getStatusColor,
  getStatusText,
  getProgressColor,
} from '../../utils/work-log-utils'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface WorkLogCardProps {
  workLog: WorkLog
  onEdit?: () => void
  onSubmit?: () => void
  onView?: () => void
  onPrint?: () => void
}

export const WorkLogCard: React.FC<WorkLogCardProps> = React.memo(
  ({ workLog, onEdit, onSubmit, onView, onPrint }) => {
    // 확장/축소 상태 관리
    const [isExpanded, setIsExpanded] = useState(false)

    // 첨부파일 존재 여부 메모이제이션
    const hasAttachments = useMemo(
      () =>
        workLog.attachments.photos.length > 0 ||
        workLog.attachments.drawings.length > 0 ||
        workLog.attachments.confirmations.length > 0,
      [workLog.attachments]
    )

    // 이벤트 핸들러 메모이제이션
    const handleEdit = useCallback(() => {
      onEdit?.()
    }, [onEdit])

    const handleSubmit = useCallback(() => {
      onSubmit?.()
    }, [onSubmit])

    const handleView = useCallback(() => {
      onView?.()
    }, [onView])

    const handlePrint = useCallback(() => {
      onPrint?.()
    }, [onPrint])

    const handleCardClick = useCallback((e: React.MouseEvent) => {
      // 버튼 클릭이 아닌 경우에만 확장/축소
      if (!(e.target as HTMLElement).closest('button')) {
        setIsExpanded(prev => !prev)
      }
    }, [])

    const toggleExpanded = useCallback((e: React.MouseEvent) => {
      e.stopPropagation()
      setIsExpanded(prev => !prev)
    }, [])

    return (
      <div
        className="bg-[var(--card)] rounded-2xl shadow-sm border border-[var(--line)] p-4 transition-all duration-300 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        onClick={handleCardClick}
      >
        {/* 헤더 */}
        <div className="worklog-header flex justify-between items-start mb-2">
          <span className="worklog-site text-sm font-semibold text-[var(--text)]">
            [{workLog.partnerName || 'INOPNC'}] {workLog.siteName}
          </span>
          <div className="worklog-header-left flex items-center gap-2">
            <span
              className={`status-tag px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(workLog.status)}`}
            >
              {getStatusText(workLog.status)}
            </span>
            <button
              onClick={toggleExpanded}
              className="worklog-detail-btn px-3 py-1 text-xs bg-[var(--line)] hover:bg-[var(--muted)] rounded-md transition-colors"
            >
              상세
            </button>
          </div>
        </div>

        {/* 작성자 정보 */}
        <div className="worklog-info-row flex justify-between items-center mb-3 text-xs text-[var(--muted)]">
          <span className="worklog-author">작성자: {workLog.author || '미지정'}</span>
          <span className="worklog-date">{formatDate(workLog.date)}</span>
        </div>

        {/* 위치 정보 */}
        <div className="worklog-location mb-2">
          <p className="text-xs text-[var(--muted)]">
            {workLog.location.block}블럭 {workLog.location.dong}동 {workLog.location.unit}호
          </p>
        </div>

        {/* 작업 상세 정보 - 항상 표시 */}
        <div className="worklog-details mb-3">
          <div className="worklog-detail-line flex gap-2 mb-1">
            <span className="worklog-detail-label text-xs text-[var(--muted)]">부재명:</span>
            <span className="worklog-detail-value text-xs text-[var(--text)]">
              {workLog.memberTypes.join(' / ')}
            </span>
          </div>
          <div className="worklog-detail-line flex gap-2 mb-1">
            <span className="worklog-detail-label text-xs text-[var(--muted)]">작업공정:</span>
            <span className="worklog-detail-value text-xs text-[var(--text)]">
              {workLog.workProcesses.join(' / ')}
            </span>
          </div>
          <div className="worklog-detail-line flex gap-2 mb-1">
            <span className="worklog-detail-label text-xs text-[var(--muted)]">작업유형:</span>
            <span className="worklog-detail-value text-xs text-[var(--text)]">
              {workLog.workTypes.join(' / ')}
            </span>
          </div>
          <div className="worklog-detail-line flex gap-2">
            <span className="worklog-detail-label text-xs text-[var(--muted)]">공수:</span>
            <span className="worklog-detail-value text-xs text-[var(--text)]">
              {workLog.totalHours}일
            </span>
          </div>
        </div>

        {/* 확장 가능한 상세 정보 */}
        <div
          className={`transition-all duration-300 ease-in-out ${isExpanded ? 'opacity-100 max-h-screen' : 'opacity-0 max-h-0 overflow-hidden'}`}
        >
          {/* 작업자 정보 */}
          <div className="mb-3">
            <p className="text-xs text-[var(--muted)] mb-1">작업자</p>
            <div className="flex flex-wrap gap-2">
              {workLog.workers.map(worker => (
                <span key={worker.id} className="text-xs text-[var(--text)]">
                  {worker.name} ({worker.hours}h)
                </span>
              ))}
            </div>
          </div>

          {/* NPC-1000 사용량 */}
          {workLog.npcUsage && (
            <div className="mb-3 p-2 bg-yellow-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-xs text-yellow-700">NPC-1000</span>
                <span className="text-xs font-semibold text-yellow-900">
                  {workLog.npcUsage.amount}
                  {workLog.npcUsage.unit}
                </span>
              </div>
            </div>
          )}

          {/* 첨부파일 정보 */}
          {hasAttachments && (
            <div className="mb-3">
              <p className="text-xs text-[var(--muted)] mb-2">첨부파일</p>
              <div className="flex gap-3">
                {workLog.attachments.photos.length > 0 && (
                  <div className="flex items-center gap-1">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-blue-500"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span className="text-xs text-[var(--muted)]">
                      사진 {workLog.attachments.photos.length}개
                    </span>
                  </div>
                )}
                {workLog.attachments.drawings.length > 0 && (
                  <div className="flex items-center gap-1">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-green-500"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                    <span className="text-xs text-[var(--muted)]">
                      도면 {workLog.attachments.drawings.length}개
                    </span>
                  </div>
                )}
                {workLog.attachments.confirmations.length > 0 && (
                  <div className="flex items-center gap-1">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-red-500"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <polyline points="16 11 12 15 10 13" />
                    </svg>
                    <span className="text-xs text-[var(--muted)]">
                      확인서 {workLog.attachments.confirmations.length}개
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 비고 */}
          {workLog.notes && (
            <div className="mb-3">
              <p className="text-xs text-[var(--muted)] mb-1">비고</p>
              <p className="text-xs text-[var(--text)] bg-[var(--bg)] p-2 rounded-lg">
                {workLog.notes}
              </p>
            </div>
          )}
        </div>

        {/* 액션 버튼 - 확장 시에만 표시 */}
        {isExpanded && (
          <div className="flex gap-2 mt-3">
            {workLog.status === 'temporary' ? (
              <>
                <button
                  onClick={handleEdit}
                  className="flex-1 h-10 bg-[var(--bg)] text-[var(--muted)] rounded-lg text-sm font-medium hover:bg-[var(--line)] active:scale-95 transition-all duration-200"
                >
                  수정하기
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 h-10 bg-[var(--accent)] text-white rounded-lg text-sm font-medium hover:bg-[var(--accent)] hover:opacity-90 active:scale-95 transition-all duration-200"
                >
                  제출하기
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleView}
                  className="flex-1 h-10 bg-[var(--bg)] text-[var(--muted)] rounded-lg text-sm font-medium hover:bg-[var(--line)] active:scale-95 transition-all duration-200"
                >
                  상세보기
                </button>
                <button
                  onClick={handlePrint}
                  className="flex-1 h-10 bg-[var(--num)] text-white rounded-lg text-sm font-medium hover:bg-[var(--num)] hover:opacity-90 active:scale-95 transition-all duration-200"
                >
                  인쇄하기
                </button>
              </>
            )}
          </div>
        )}
      </div>
    )
  }
)
