'use client'

import React, { useState, useEffect } from 'react'

interface TemporarySavedWorkLog {
  id: string
  siteName: string
  date: string
  createdAt: string
}

interface SimplifiedBottomSheetProps {
  temporaryWorkLogs: TemporarySavedWorkLog[]
  isVisible: boolean
  onClose: () => void
  onCreateWorkLog: () => void
}

export const SimplifiedBottomSheet: React.FC<SimplifiedBottomSheetProps> = ({
  temporaryWorkLogs,
  isVisible,
  onClose,
  onCreateWorkLog,
}) => {
  const handleClose = () => {
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

  if (!isVisible || temporaryWorkLogs.length === 0) return null

  const totalCount = temporaryWorkLogs.length

  return (
    <>
      {/* 오버레이 */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={handleClose} />

      {/* 바텀시트 */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-3xl shadow-xl z-50 transform transition-transform duration-300 ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* 드래그 핸들 */}
        <div className="flex justify-center py-3 cursor-grab" onTouchStart={handleDragDown}>
          <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* 헤더 */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                  <span className="text-amber-600 dark:text-amber-400 text-lg">💾</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">임시저장 알림</h3>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 pl-13">
                임시저장 중인 작업일지가{' '}
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  {totalCount}개
                </span>{' '}
                남아 있습니다.
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-gray-400 dark:text-gray-500"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* 작성하기 버튼 */}
        <div className="px-6 pb-6">
          <button
            onClick={() => {
              onCreateWorkLog()
              handleClose()
            }}
            className="w-full h-12 bg-[#0068FE] hover:bg-blue-600 text-white rounded-xl font-medium active:scale-95 transition-all duration-200 shadow-lg"
          >
            작업일지 작성하러 가기
          </button>
        </div>
      </div>
    </>
  )
}
