'use client'

import React from 'react'
import { WorkLog } from '../../types/work-log.types'
import {
  formatDate,
  formatFileSize,
  getStatusColor,
  getStatusText,
} from '../../utils/work-log-utils'

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
    const handlePrint = React.useCallback(() => {
      if (onPrint) {
        onPrint()
      } else {
        window.print()
      }
    }, [onPrint])

    const handleShare = React.useCallback(async () => {
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

    // 첨부파일 존재 여부 메모이제이션
    const hasAttachments = React.useMemo(() => {
      if (!workLog) return false
      return (
        workLog.attachments.photos.length > 0 ||
        workLog.attachments.drawings.length > 0 ||
        workLog.attachments.confirmations.length > 0
      )
    }, [workLog])

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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden transform transition-all duration-300 animate-slideUp">
            {/* 헤더 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-[#1A254F]">작업일지 상세</h2>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(workLog.status)}`}
                >
                  {getStatusText(workLog.status)}
                </span>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
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
              <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-3">기본 정보</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">작업일자</p>
                    <p className="font-medium">{formatDate(workLog.date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">현장</p>
                    <p className="font-medium">{workLog.siteName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">위치</p>
                    <p className="font-medium">
                      {workLog.location.block}블럭 {workLog.location.dong}동 {workLog.location.unit}
                      호
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">진행률</p>
                    <p className="font-medium">{workLog.progress}%</p>
                  </div>
                </div>
              </div>

              {/* 작업 정보 */}
              <div className="mb-6 p-4 bg-blue-50 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-3">작업 정보</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">부재명</p>
                    <div className="flex flex-wrap gap-2">
                      {workLog.memberTypes.map((type, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">작업공정</p>
                    <div className="flex flex-wrap gap-2">
                      {workLog.workProcesses.map((process, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm"
                        >
                          {process}
                        </span>
                      ))}
                    </div>
                  </div>
                  {workLog.workTypes.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">작업유형</p>
                      <div className="flex flex-wrap gap-2">
                        {workLog.workTypes.map((type, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm"
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
              <div className="mb-6 p-4 bg-green-50 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-3">작업자 정보</h3>
                <div className="space-y-2">
                  {workLog.workers.map(worker => (
                    <div
                      key={worker.id}
                      className="flex items-center justify-between py-2 border-b border-green-100 last:border-0"
                    >
                      <span className="text-sm font-medium">{worker.name}</span>
                      <span className="text-sm text-gray-600">{worker.hours}시간</span>
                    </div>
                  ))}
                  <div className="pt-2 flex items-center justify-between">
                    <span className="font-semibold">총 작업시간</span>
                    <span className="font-semibold text-green-700">{workLog.totalHours}시간</span>
                  </div>
                </div>
              </div>

              {/* NPC-1000 사용량 */}
              {workLog.npcUsage && (
                <div className="mb-6 p-4 bg-yellow-50 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-3">NPC-1000 사용량</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">사용량</span>
                    <span className="text-lg font-bold text-yellow-700">
                      {workLog.npcUsage.amount} {workLog.npcUsage.unit}
                    </span>
                  </div>
                </div>
              )}

              {/* 첨부파일 */}
              {hasAttachments && (
                <div className="mb-6 p-4 bg-indigo-50 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-3">첨부파일</h3>

                  {/* 사진 */}
                  {workLog.attachments.photos.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">
                        사진 ({workLog.attachments.photos.length})
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {workLog.attachments.photos.map(photo => (
                          <div
                            key={photo.id}
                            className="relative aspect-square bg-gray-200 rounded-lg overflow-hidden"
                          >
                            <img
                              src={photo.url}
                              alt={photo.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 도면 */}
                  {workLog.attachments.drawings.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">
                        도면 ({workLog.attachments.drawings.length})
                      </p>
                      <div className="space-y-2">
                        {workLog.attachments.drawings.map(drawing => (
                          <div
                            key={drawing.id}
                            className="flex items-center justify-between p-2 bg-white rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="text-green-500"
                              >
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                              </svg>
                              <span className="text-sm">{drawing.name}</span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {formatFileSize(drawing.size)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 확인서 */}
                  {workLog.attachments.confirmations.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">
                        확인서 ({workLog.attachments.confirmations.length})
                      </p>
                      <div className="space-y-2">
                        {workLog.attachments.confirmations.map(confirmation => (
                          <div
                            key={confirmation.id}
                            className="flex items-center justify-between p-2 bg-white rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <svg
                                width="20"
                                height="20"
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
                              <span className="text-sm">{confirmation.name}</span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {formatFileSize(confirmation.size)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 메모 */}
              {workLog.notes && (
                <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-2">메모</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{workLog.notes}</p>
                </div>
              )}

              {/* 작성 정보 */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-3">작성 정보</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">작성일시</p>
                    <p className="font-medium">
                      {new Date(workLog.createdAt).toLocaleString('ko-KR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">수정일시</p>
                    <p className="font-medium">
                      {new Date(workLog.updatedAt).toLocaleString('ko-KR')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 푸터 */}
            <div className="flex gap-3 p-6 border-t border-gray-200">
              {workLog.status === 'draft' && (
                <>
                  <button
                    onClick={onEdit}
                    className="flex-1 h-12 bg-gray-100 text-gray-600 rounded-lg font-medium hover:bg-gray-200"
                  >
                    수정
                  </button>
                  <button
                    onClick={onApprove}
                    className="flex-1 h-12 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600"
                  >
                    승인
                  </button>
                </>
              )}
              <button
                onClick={handleShare}
                className="flex-1 h-12 bg-blue-100 text-blue-600 rounded-lg font-medium hover:bg-blue-200"
              >
                공유
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 h-12 bg-[#0068FE] text-white rounded-lg font-medium hover:bg-blue-600"
              >
                인쇄
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }
)
