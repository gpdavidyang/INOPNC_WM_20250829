'use client'

import React from 'react'
import { BottomSheet } from '../ui/BottomSheet'

interface UncompletedAlertProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
  onSaveIncomplete: () => void
  title?: string
  message?: string
  completeLabel?: string
  saveIncompleteLabel?: string
}

export const UncompletedAlert: React.FC<UncompletedAlertProps> = ({
  isOpen,
  onClose,
  onComplete,
  onSaveIncomplete,
  title = '작업일지 작성이 완료되지 않았습니다',
  message = '아직 작성되지 않은 항목이 있습니다. 계속 작성하시겠습니까?',
  completeLabel = '계속 작성',
  saveIncompleteLabel = '미완성으로 저장',
}) => {
  const handleComplete = () => {
    onComplete()
    onClose()
  }

  const handleSaveIncomplete = () => {
    onSaveIncomplete()
    onClose()
  }

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      className="uncompleted-alert"
      swipeable={false}
      backdropClosable={false}
    >
      <div className="alert-content" id="bottom-sheet-title">
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-[var(--warn)] bg-opacity-10 rounded-full">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-[var(--warn)]"
          >
            <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        
        <h3>{title}</h3>
        <p>{message}</p>
        
        <div className="alert-actions">
          <button
            type="button"
            onClick={handleSaveIncomplete}
            className="save-incomplete-btn"
          >
            {saveIncompleteLabel}
          </button>
          <button
            type="button"
            onClick={handleComplete}
            className="complete-btn"
          >
            {completeLabel}
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}

// Specialized alert for missing required fields
interface MissingFieldsAlertProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
  missingFields: string[]
}

export const MissingFieldsAlert: React.FC<MissingFieldsAlertProps> = ({
  isOpen,
  onClose,
  onComplete,
  missingFields,
}) => {
  const fieldLabels: { [key: string]: string } = {
    site: '현장 선택',
    workDate: '작업일자',
    workContent: '작업 내용',
    memberType: '부재명',
    workType: '작업 구간',
    laborHours: '공수',
    materials: 'NPC-1000 자재',
  }

  const missingLabels = missingFields.map(field => fieldLabels[field] || field)

  return (
    <UncompletedAlert
      isOpen={isOpen}
      onClose={onClose}
      onComplete={onComplete}
      onSaveIncomplete={() => {}} // Disabled for missing fields
      title="필수 항목이 누락되었습니다"
      message={`다음 항목을 입력해주세요:\n• ${missingLabels.join('\n• ')}`}
      completeLabel="계속 작성"
      saveIncompleteLabel=""
    />
  )
}

// Specialized alert for work completion confirmation
interface WorkCompleteAlertProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  workSummary: {
    site: string
    date: string
    totalHours: number
    tasksCount: number
  }
}

export const WorkCompleteAlert: React.FC<WorkCompleteAlertProps> = ({
  isOpen,
  onClose,
  onConfirm,
  workSummary,
}) => {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      className="work-complete-alert"
    >
      <div className="alert-content">
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-[var(--ok-bg)] rounded-full">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-[var(--ok)]"
          >
            <polyline points="20,6 9,17 4,12" />
          </svg>
        </div>
        
        <h3>작업일지 제출 확인</h3>
        
        <div className="bg-[var(--bg)] rounded-[var(--radius)] p-4 mb-6 text-left">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">현장:</span>
              <span className="font-medium">{workSummary.site}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">작업일자:</span>
              <span className="font-medium">{workSummary.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">총 공수:</span>
              <span className="font-medium">{workSummary.totalHours}시간</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">작업 항목:</span>
              <span className="font-medium">{workSummary.tasksCount}개</span>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-[var(--muted)] mb-6">
          작성된 내용을 최종 제출하시겠습니까?
        </p>
        
        <div className="alert-actions">
          <button
            type="button"
            onClick={onClose}
            className="cancel-btn"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="confirm-btn"
          >
            제출하기
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}