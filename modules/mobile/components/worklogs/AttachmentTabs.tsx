'use client'

import React from 'react'
import clsx from 'clsx'

export type TabKey = 'photos' | 'drawings' | 'completionDocs' | 'others'

export interface AttachmentTabsProps {
  active: TabKey
  counts: { photos: number; drawings: number; completionDocs: number; others: number }
  onChange: (key: TabKey) => void
  className?: string
  idBase?: string
}

const labels: Record<TabKey, string> = {
  photos: '사진대지',
  drawings: '진행도면',
  completionDocs: '완료확인서',
  others: '기타서류',
}

export const AttachmentTabs: React.FC<AttachmentTabsProps> = ({
  active,
  counts,
  onChange,
  className,
  idBase = 'attachments',
}) => {
  const order: TabKey[] = ['photos', 'drawings', 'completionDocs', 'others']

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const idx = order.indexOf(active)
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      onChange(order[(idx + 1) % order.length])
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      onChange(order[(idx - 1 + order.length) % order.length])
    }
  }

  return (
    <div
      className={clsx('detail-tabs', className)}
      role="tablist"
      aria-label="첨부 구분"
      onKeyDown={handleKeyDown}
    >
      {order.map(key => (
        <button
          key={key}
          id={`${idBase}-tab-${key}`}
          type="button"
          role="tab"
          aria-selected={active === key}
          aria-controls={`${idBase}-panel-${key}`}
          tabIndex={active === key ? 0 : -1}
          className={clsx('detail-tab', active === key && 'active')}
          onClick={() => onChange(key)}
        >
          <span>{labels[key]}</span>
          <span className="tab-count">{counts[key]}</span>
        </button>
      ))}
    </div>
  )
}

export default AttachmentTabs
