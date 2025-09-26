'use client'

import React from 'react'
import clsx from 'clsx'
import '@/modules/mobile/styles/worklogs.css'
import { Loader2 } from 'lucide-react'
import { WorklogSummary } from '@/types/worklog'
import { TaskDiaryListItem } from './TaskDiaryListItem'

export interface TaskDiaryListProps {
  items: WorklogSummary[]
  onSelect?: (id: string) => void
  activeId?: string | null
  isLoading?: boolean
  emptyMessage?: string
  hasMore?: boolean
  onLoadMore?: () => void
  className?: string
}

export const TaskDiaryList: React.FC<TaskDiaryListProps> = ({
  items,
  onSelect,
  activeId = null,
  isLoading = false,
  emptyMessage = '표시할 작업일지가 없습니다.',
  hasMore = false,
  onLoadMore,
  className = '',
}) => {
  return (
    <section className={clsx('worklogs-section-card', className)}>
      {isLoading && items.length === 0 ? (
        <div className="list-footer" aria-live="polite">
          <Loader2 className="animate-spin" size={20} />
          <span style={{ marginLeft: 8 }}>작업일지를 불러오는 중...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="list-footer" aria-live="polite">
          <span>{emptyMessage}</span>
        </div>
      ) : (
        <>
          <div className="worklog-list">
            {items.map(item => (
              <TaskDiaryListItem
                key={item.id}
                worklog={item}
                onSelect={onSelect}
                isActive={activeId === item.id}
              />
            ))}
          </div>

          <div className="list-footer">
            {isLoading && items.length > 0 ? (
              <Loader2 className="animate-spin" size={20} aria-hidden="true" />
            ) : hasMore ? (
              <button type="button" className="load-more-btn" onClick={onLoadMore}>
                더 보기
              </button>
            ) : null}
          </div>
        </>
      )}
    </section>
  )
}

export default TaskDiaryList
