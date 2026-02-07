'use client'

import { cn } from '@/lib/utils'
import { Check, FileText } from 'lucide-react'
import React from 'react'
import { formatDateShort } from '../doc-hub-data'

interface DocCardProps {
  id: string
  title: string
  desc?: string
  author?: string
  date?: string
  fileName?: string
  thumbUrl?: string
  hasFile: boolean
  isSelected: boolean
  statusLabel?: string
  statusClass?: string
  onToggleSelection: (id: string) => void
  children?: React.ReactNode // For action buttons or extra info
}

export const DocCard: React.FC<DocCardProps> = ({
  id,
  title,
  desc,
  author,
  date,
  fileName,
  thumbUrl,
  hasFile,
  isSelected,
  statusLabel,
  statusClass,
  onToggleSelection,
  children,
}) => {
  return (
    <div
      className={cn('doc-card', isSelected && 'selected', !hasFile && 'no-file')}
      onClick={() => {
        if (hasFile) onToggleSelection(id)
      }}
    >
      <div className="card-content">
        <div
          className="checkbox-wrapper"
          onClick={e => {
            e.stopPropagation()
            if (hasFile) onToggleSelection(id)
          }}
        >
          <div className={cn('checkbox', isSelected && 'checked', !hasFile && 'disabled')}>
            <Check size={18} strokeWidth={4} />
          </div>
        </div>

        <div className="card-thumbnail">
          <div className="flex w-full h-full items-center justify-center text-slate-400 bg-slate-50 rounded-lg">
            <FileText size={32} color="#94a3b8" strokeWidth={1.5} />
          </div>
        </div>

        <div className="card-info">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <div className="flex-1 min-w-0">
              <div className="card-title line-clamp-1">{title}</div>
            </div>
            {statusLabel && (
              <span className={cn('status-badge shrink-0', statusClass || 'status-none')}>
                {statusLabel}
              </span>
            )}
            {!hasFile && !statusLabel && <span className="doc-status-badge">미등록</span>}
          </div>

          <div className="card-meta">
            <span className="meta-item author">
              {author && author !== '-' ? author : hasFile ? '작성자 미상' : '-'}
            </span>
            <span className="text-separator">|</span>
            <span className="meta-item date">
              {date && date !== '-' ? formatDateShort(date) : '-'}
            </span>
            {hasFile && fileName && fileName !== '-' && (
              <>
                <span className="text-separator">|</span>
                <span className="meta-item filename truncate">{fileName}</span>
              </>
            )}
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
