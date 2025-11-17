'use client'

import React from 'react'
import clsx from 'clsx'
import { CalendarDays, Users, Layers, MapPin } from 'lucide-react'
import '@/modules/mobile/styles/worklogs.css'
import { WorklogSummary } from '@/types/worklog'
import { WorklogStatusBadge } from './WorklogStatusBadge'

export interface TaskDiaryListItemProps {
  worklog: WorklogSummary
  onSelect?: (id: string) => void
  isActive?: boolean
}

export const TaskDiaryListItem: React.FC<TaskDiaryListItemProps> = ({
  worklog,
  onSelect,
  isActive,
}) => {
  const handleClick = () => {
    onSelect?.(worklog.id)
  }

  const formattedDate = new Date(worklog.workDate)
  const displayDate = isNaN(formattedDate.getTime())
    ? worklog.workDate
    : formattedDate.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
        weekday: 'short',
      })

  const hasMarkup = (worklog.attachmentCounts?.drawings || 0) > 0

  return (
    <article
      className={clsx('worklog-card', isActive && 'active')}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          handleClick()
        }
      }}
    >
      <header className="worklog-card-header">
        <h3 className="worklog-site">{worklog.siteName}</h3>
        <div className="worklog-card-actions">
          {hasMarkup && <span className="markup-badge">도면 연결</span>}
          <WorklogStatusBadge status={worklog.status} />
        </div>
      </header>

      <div className="worklog-meta">
        <span>
          <CalendarDays size={14} aria-hidden="true" />
          <strong style={{ marginLeft: 4 }}>{displayDate}</strong>
        </span>
        <span>
          <Layers size={14} aria-hidden="true" />
          <strong style={{ marginLeft: 4 }}>
            {worklog.processes.join(', ') || '공정 정보 없음'}
          </strong>
        </span>
        <span>
          <Users size={14} aria-hidden="true" />
          <strong style={{ marginLeft: 4 }}>{worklog.manpower.toFixed(1)}</strong> 공수
        </span>
        <span>
          <MapPin size={14} aria-hidden="true" />
          {worklog.workTypes.join(', ') || '작업 유형 미지정'}
        </span>
      </div>

      <div className="worklog-attachments" aria-label="첨부 요약">
        <span className="attachment-pill">사진 {worklog.attachmentCounts.photos}</span>
        <span className="attachment-pill">도면 {worklog.attachmentCounts.drawings}</span>
        <span className="attachment-pill">완료 {worklog.attachmentCounts.completionDocs}</span>
        <span className="attachment-pill">기타 {worklog.attachmentCounts.others}</span>
      </div>
    </article>
  )
}

export default TaskDiaryListItem
