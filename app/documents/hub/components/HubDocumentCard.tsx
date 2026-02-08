import { cn } from '@/lib/utils'
import React from 'react'
import { formatDateShort } from '../utils/hub-utils'

interface HubDocumentCardProps {
  id: string
  title: string
  date: string
  author: string
  status: string
  desc?: string // Additional description (e.g. Component | Process | Location)
  countLabel: string // e.g. "도면 3건" or "사진 5장"
  count: number
  isExpanded: boolean
  isSelected?: boolean // For PhotosTab selection state
  onToggleExpand: (id: string) => void
  children?: React.ReactNode // Expanded content body
  collapsedContent?: React.ReactNode // Content to show when collapsed (e.g. photo preview)
  // Optional style overrides
  className?: string
}

export function HubDocumentCard({
  id,
  title,
  date,
  author,
  status,
  desc,
  countLabel,
  count,
  isExpanded,
  isSelected,
  onToggleExpand,
  children,
  collapsedContent,
  className,
}: HubDocumentCardProps) {
  // Status Logic
  const isApproved = status === 'approved' || status === 'done'
  const isRejected = status === 'rejected' || status === 'returned'
  const statusText = isApproved ? '승인' : isRejected ? '반려' : '제출'
  const statusClass = isApproved
    ? 'bg-slate-100 text-slate-500 border-slate-200'
    : isRejected
      ? 'bg-red-50 text-red-500 border-red-100'
      : 'bg-blue-50 text-blue-500 border-blue-100'

  return (
    <div
      key={id}
      className={cn(
        'bg-white rounded-2xl p-4 border shadow-sm overflow-hidden relative transition-all',
        isSelected ? 'border-sky-500 bg-sky-50/50' : 'border-slate-100',
        isExpanded ? 'border-blue-200 ring-1 ring-blue-100' : '',
        className
      )}
    >
      {/* --- Card Header Content (Clickable) --- */}
      <div
        className="flex flex-col gap-0 cursor-pointer hover:bg-slate-50/50 transition-colors select-none -m-4 p-4"
        onClick={() => onToggleExpand(id)}
      >
        {/* Header Top Row (Line 1): Title & Date & Status Badge */}
        <div className="flex items-center justify-between w-full mb-0">
          <div className="flex items-center flex-1 min-w-0 pr-3 gap-2">
            {/* Title (Site Name) */}
            <h3 className="text-[20px] font-extrabold text-slate-900 leading-none truncate">
              {title || '현장'}
            </h3>
            {/* Date */}
            <span className="text-[15px] font-normal text-slate-600 shrink-0">
              {formatDateShort(date)}
            </span>
          </div>

          {/* Status Badge: Right */}
          <span
            className={cn(
              'text-[11px] font-bold px-1.5 py-0.5 rounded w-[40px] flex justify-center items-center shrink-0 border',
              statusClass
            )}
          >
            {statusText}
          </span>
        </div>

        {/* Meta Row (Line 2): Author | Desc | Count Badge (Right) */}
        <div className="flex items-center justify-between w-full mt-1.5">
          <div className="flex-1 min-w-0 text-[15px] font-normal text-slate-600 flex items-center gap-2 overflow-hidden leading-none">
            <span className="shrink-0 font-medium">{author}</span>
            <span className="text-slate-300 text-[10px]">|</span>
            <span className="truncate">{desc || '작업내용 없음'}</span>
          </div>

          {/* Count Badge: Right, 2nd line */}
          <span
            className={cn(
              'text-[12px] font-bold px-1.5 py-0.5 rounded ml-2 shrink-0 border',
              count > 0
                ? 'text-green-600 bg-green-50 border-green-200' // Green for positive count (default for drawings?)
                : 'text-slate-400 bg-slate-50 border-slate-200',
              // Override for Photos: Blue style usually?
              // Let's make it generic or passable.
              // PhotosTab used blue. DrawingsTab used green.
              // I will use Blue as default for generic 'count'.
              // Wait, previous code: Drawings=Green, Photos=Blue.
              // I can pass class override or just stick to one color?
              // Let's use Blue as safe default, or better, accept color prop?
              // For now, let's keep it simple. Green is fine for "Items".
              // Or I can use a generic style.
              'text-blue-600 bg-blue-50 border-blue-100'
            )}
          >
            {countLabel}
          </span>
        </div>
      </div>

      {/* --- Card Body (Line 3 & 4 & Content) --- */}
      {isExpanded ? (
        <div className="doc-body flex flex-col animate-in slide-in-from-top-2 duration-200 fade-in-50 mt-4 border-t border-slate-200 pt-4">
          {children}
        </div>
      ) : (
        collapsedContent && <div className="mt-4">{collapsedContent}</div>
      )}
    </div>
  )
}
