'use client'

import React from 'react'
import clsx from 'clsx'

export type TabKey = 'photos' | 'drawings' | 'completionDocs' | 'others'

export interface AttachmentTabsProps {
  active: TabKey
  counts: { photos: number; drawings: number; completionDocs: number; others: number }
  onChange: (key: TabKey) => void
  className?: string
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
}) => {
  const order: TabKey[] = ['photos', 'drawings', 'completionDocs', 'others']
  return (
    <div className={clsx('detail-tabs', className)} role="tablist" aria-label="첨부 구분">
      {order.map(key => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={active === key}
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
