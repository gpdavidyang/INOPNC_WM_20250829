'use client'

import React from 'react'
import { WorkLog } from '@/modules/mobile/types/work-log.types'
import { formatDate } from '@/modules/mobile/utils/work-log-utils'

interface WorkLogListItemProps {
  workLog: WorkLog
  onSelect?: (workLog: WorkLog) => void
}

export const WorkLogListItem: React.FC<WorkLogListItemProps> = ({ workLog, onSelect }) => {
  const handleClick = () => {
    if (onSelect) {
      onSelect(workLog)
    }
  }

  return (
    <article
      onClick={handleClick}
      className="flex cursor-pointer items-center justify-between rounded-xl border border-[#E6ECF4] bg-white px-4 py-4 text-sm text-[#1A254F] shadow-[0_6px_18px_rgba(16,24,40,0.04)] transition-transform hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(16,24,40,0.08)]"
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : -1}
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{workLog.siteName}</p>
        <p className="truncate text-xs text-[#667085]">
          {workLog.workProcesses.length > 0
            ? workLog.workProcesses.join(', ')
            : workLog.notes || '작업 내용 미입력'}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1 text-right">
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
            workLog.status === 'draft'
              ? 'bg-[#F4F8FF] text-[#31A3FA]'
              : 'bg-[#F0FDF4] text-[#16A34A]'
          }`}
        >
          {workLog.status === 'draft' ? '임시저장' : '작성완료'}
        </span>
        <span className="text-xs text-[#667085]">{formatDate(workLog.date)}</span>
      </div>
    </article>
  )
}

export default WorkLogListItem
