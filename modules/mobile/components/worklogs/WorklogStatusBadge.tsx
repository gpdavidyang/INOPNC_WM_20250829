'use client'

import React from 'react'
import clsx from 'clsx'
import '@/modules/mobile/styles/worklogs.css'
import { WorklogStatus } from '@/types/worklog'

const STATUS_LABELS: Record<WorklogStatus, string> = {
  draft: '임시 저장',
  submitted: '제출 완료',
  approved: '승인 완료',
  rejected: '반려',
}

export interface WorklogStatusBadgeProps {
  status: WorklogStatus
  className?: string
}

export const WorklogStatusBadge: React.FC<WorklogStatusBadgeProps> = ({ status, className }) => {
  return (
    <span
      className={clsx('status-badge', status, className)}
      aria-label={`상태: ${STATUS_LABELS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}

export default WorklogStatusBadge
