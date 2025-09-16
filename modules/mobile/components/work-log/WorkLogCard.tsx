'use client'

import React from 'react'
import { WorkLog } from '../../types/work-log.types'
import {
  formatDate,
  getStatusColor,
  getStatusText,
  getProgressColor,
} from '../../utils/work-log-utils'

interface WorkLogCardProps {
  workLog: WorkLog
  onEdit?: () => void
  onSubmit?: () => void
  onView?: () => void
  onPrint?: () => void
}

export const WorkLogCard: React.FC<WorkLogCardProps> = React.memo(
  ({ workLog, onEdit, onSubmit, onView, onPrint }) => {
    // 첨부파일 존재 여부 메모이제이션
    const hasAttachments = React.useMemo(
      () =>
        workLog.attachments.photos.length > 0 ||
        workLog.attachments.drawings.length > 0 ||
        workLog.attachments.confirmations.length > 0,
      [workLog.attachments]
    )

    // 이벤트 핸들러 메모이제이션
    const handleEdit = React.useCallback(() => {
      onEdit?.()
    }, [onEdit])

    const handleSubmit = React.useCallback(() => {
      onSubmit?.()
    }, [onSubmit])

    const handleView = React.useCallback(() => {
      onView?.()
    }, [onView])

    const handlePrint = React.useCallback(() => {
      onPrint?.()
    }, [onPrint])

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-[#e6eaf2] p-4 transition-all duration-300 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]">
        {/* 헤더 */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-[#1A254F]">
                {formatDate(workLog.date)}
              </span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(workLog.status)}`}
              >
                {getStatusText(workLog.status)}
              </span>
            </div>
            <h3 className="text-sm font-medium text-[#101828] mb-1">{workLog.siteName}</h3>
            <p className="text-xs text-gray-600">
              {workLog.location.block}블럭 {workLog.location.dong}동 {workLog.location.unit}호
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-600 mb-1">전체 공수</p>
            <p className="text-sm font-semibold text-[#1A254F]">{workLog.totalHours}h</p>
          </div>
        </div>

        {/* 작업 정보 태그 */}
        <div className="flex flex-wrap gap-1 mb-3">
          {workLog.memberTypes.map((type, index) => (
            <span
              key={`member-${index}`}
              className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs animate-fadeIn"
            >
              {type}
            </span>
          ))}
          {workLog.workProcesses.map((process, index) => (
            <span
              key={`process-${index}`}
              className="px-2 py-1 bg-green-50 text-green-700 rounded-md text-xs animate-fadeIn"
            >
              {process}
            </span>
          ))}
          {workLog.workTypes.map((type, index) => (
            <span
              key={`type-${index}`}
              className="px-2 py-1 bg-purple-50 text-purple-700 rounded-md text-xs animate-fadeIn"
            >
              {type}
            </span>
          ))}
        </div>

        {/* 작업자 정보 */}
        <div className="mb-3">
          <p className="text-xs text-gray-600 mb-1">작업자</p>
          <div className="flex flex-wrap gap-2">
            {workLog.workers.map(worker => (
              <span key={worker.id} className="text-xs">
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
          <div className="mb-3 flex gap-3">
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
                <span className="text-xs text-gray-600">{workLog.attachments.photos.length}</span>
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
                <span className="text-xs text-gray-600">{workLog.attachments.drawings.length}</span>
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
                <span className="text-xs text-gray-600">
                  {workLog.attachments.confirmations.length}
                </span>
              </div>
            )}
          </div>
        )}

        {/* 진행률 */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-600">진행률</span>
            <span className="text-xs font-medium text-[#0068FE]">{workLog.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(workLog.progress)}`}
              style={{ width: `${workLog.progress}%` }}
            />
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-2">
          {workLog.status === 'draft' ? (
            <>
              <button
                onClick={handleEdit}
                className="flex-1 h-10 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 active:scale-95 transition-all duration-200"
              >
                수정하기
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 h-10 bg-[#1A254F] text-white rounded-lg text-sm font-medium hover:bg-[#152041] active:scale-95 transition-all duration-200"
              >
                제출하기
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleView}
                className="flex-1 h-10 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 active:scale-95 transition-all duration-200"
              >
                상세보기
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 h-10 bg-[#0068FE] text-white rounded-lg text-sm font-medium hover:bg-blue-600 active:scale-95 transition-all duration-200"
              >
                인쇄하기
              </button>
            </>
          )}
        </div>
      </div>
    )
  }
)
