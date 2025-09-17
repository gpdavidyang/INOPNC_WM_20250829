'use client'

import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface DraftCountBottomSheetProps {
  draftCount: number
  year: number
  month: number
  onDismiss: () => void
}

export default function DraftCountBottomSheet({
  draftCount,
  year,
  month,
  onDismiss,
}: DraftCountBottomSheetProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [dontShowToday, setDontShowToday] = useState(false)

  useEffect(() => {
    // 숨김 설정 확인
    const hideUntil = localStorage.getItem('hideDraftSheet')
    if (hideUntil && new Date(hideUntil) > new Date()) {
      setIsVisible(false)
      onDismiss()
    }
  }, [onDismiss])

  const handleDontShowToday = (checked: boolean) => {
    setDontShowToday(checked)
    if (checked) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
      localStorage.setItem('hideDraftSheet', tomorrow.toISOString())
    } else {
      localStorage.removeItem('hideDraftSheet')
    }
  }

  const handleClose = () => {
    if (dontShowToday) {
      handleDontShowToday(true)
    }
    setIsVisible(false)
    setTimeout(onDismiss, 300) // 애니메이션 후 제거
  }

  if (!isVisible) return null

  return (
    <>
      {/* 백드롭 */}
      <div className="bottom-sheet-backdrop" onClick={handleClose} />

      {/* 바텀시트 */}
      <div className={`draft-count-bottom-sheet ${isVisible ? 'visible' : ''}`}>
        <div className="bottom-sheet-handle" />

        <div className="bottom-sheet-header">
          <h3 className="bottom-sheet-title">임시저장 작업일지</h3>
          <button className="bottom-sheet-close" onClick={handleClose} aria-label="닫기">
            <X size={20} />
          </button>
        </div>

        <div className="bottom-sheet-content">
          <div className="draft-count-display">
            <div className="count-info">
              <span className="count-period">
                {year}년 {month}월
              </span>
              <div className="count-value">
                <span className="count-number">{draftCount}</span>
                <span className="count-unit">건</span>
              </div>
            </div>
            <p className="count-description">
              미완료된 작업일지가 있습니다.
              <br />
              작성을 완료해주세요.
            </p>
          </div>

          <div className="bottom-sheet-footer">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={dontShowToday}
                onChange={e => handleDontShowToday(e.target.checked)}
              />
              <span>오늘은 그만 보기</span>
            </label>
          </div>
        </div>
      </div>
    </>
  )
}
