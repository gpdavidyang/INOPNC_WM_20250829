'use client'

import React, { useState, useEffect } from 'react'
import { UncompletedAlert } from '../../types/work-log.types'
import { formatMonth, dismissAlert } from '../../utils/work-log-utils'

interface UncompletedBottomSheetProps {
  alerts: UncompletedAlert[]
  onClose: () => void
  onViewDetails: (alert: UncompletedAlert) => void
}

export const UncompletedBottomSheet: React.FC<UncompletedBottomSheetProps> = ({
  alerts,
  onClose,
  onViewDetails,
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [dontShowToday, setDontShowToday] = useState(false)

  useEffect(() => {
    if (alerts.length > 0) {
      setIsVisible(true)
    }
  }, [alerts])

  const handleClose = () => {
    if (dontShowToday) {
      alerts.forEach(alert => {
        dismissAlert(alert.month)
      })
    }
    setIsVisible(false)
    onClose()
  }

  const handleDragDown = (e: React.TouchEvent) => {
    const startY = e.touches[0].clientY

    const handleMove = (e: TouchEvent) => {
      const currentY = e.touches[0].clientY
      const diff = currentY - startY

      if (diff > 100) {
        handleClose()
        document.removeEventListener('touchmove', handleMove)
        document.removeEventListener('touchend', handleEnd)
      }
    }

    const handleEnd = () => {
      document.removeEventListener('touchmove', handleMove)
      document.removeEventListener('touchend', handleEnd)
    }

    document.addEventListener('touchmove', handleMove)
    document.addEventListener('touchend', handleEnd)
  }

  if (!isVisible || alerts.length === 0) return null

  const totalCount = alerts.reduce((sum, alert) => sum + alert.count, 0)

  return (
    <>
      {/* 오버레이 */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={handleClose} />

      {/* 바텀시트 */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-xl z-50 transform transition-transform duration-300 ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* 드래그 핸들 */}
        <div className="flex justify-center py-3 cursor-grab" onTouchStart={handleDragDown}>
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* 헤더 */}
        <div className="px-4 pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-[#1A254F] mb-1">미작성 작업일지 알림</h3>
              <p className="text-sm text-gray-600">
                총 {totalCount}개의 작업일지가 미완성 상태입니다.
              </p>
            </div>
            <button onClick={handleClose} className="p-1">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-gray-400"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* 월별 목록 */}
        <div className="px-4 pb-4 max-h-60 overflow-y-auto">
          {alerts.map(alert => (
            <div
              key={alert.month}
              className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-3"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{alert.count}</span>
                  </div>
                  <span className="text-sm font-semibold text-orange-800">
                    {formatMonth(alert.month + '-01')}
                  </span>
                </div>
                <button
                  onClick={() => onViewDetails(alert)}
                  className="text-xs text-orange-600 underline"
                >
                  상세보기
                </button>
              </div>
              <div className="space-y-1">
                {alert.workLogs.slice(0, 2).map(log => (
                  <p key={log.id} className="text-xs text-orange-700">
                    • {log.date} - {log.siteName}
                  </p>
                ))}
                {alert.workLogs.length > 2 && (
                  <p className="text-xs text-orange-600">... 외 {alert.workLogs.length - 2}건</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 하단 체크박스 */}
        <div className="px-4 py-3 border-t border-gray-200">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={dontShowToday}
              onChange={e => setDontShowToday(e.target.checked)}
              className="w-4 h-4 text-[#0068FE] border-gray-300 rounded focus:ring-[#0068FE]"
            />
            <span className="text-sm text-gray-600">오늘은 그만 보기</span>
          </label>
        </div>

        {/* 작성하기 버튼 */}
        <div className="px-4 pb-4">
          <button
            onClick={handleClose}
            className="w-full h-12 bg-[#1A254F] text-white rounded-xl font-medium hover:bg-[#152041] active:scale-95 transition-all duration-200"
          >
            작업일지 작성하기
          </button>
        </div>
      </div>
    </>
  )
}
