'use client'

import React from 'react'
import { WorkLog } from '../../types/work-log.types'
import { cn } from '@/lib/utils'
import {
  formatDate,
  getStatusColor,
  getStatusText,
  getProgressColor,
} from '../../utils/work-log-utils'
import { FileText, Image, FileCheck2, Edit3, Send, Trash2, Printer } from 'lucide-react'

interface WorkLogCardProps {
  workLog: WorkLog
  onEdit?: () => void
  onSubmit?: () => void
  onView?: () => void
  onPrint?: () => void
  onDelete?: () => void
}

export const WorkLogCard: React.FC<WorkLogCardProps> = React.memo(
  ({ workLog, onEdit, onSubmit, onView, onPrint, onDelete }) => {
    const isDraft = workLog.status === 'draft'
    const statusClasses = getStatusColor(workLog.status)

    const photoCount = workLog.attachments.photos.length
    const drawingCount = workLog.attachments.drawings.length
    const confirmationCount = workLog.attachments.confirmations.length
    const renderMaterialSummary = () => {
      const list = Array.isArray(workLog.materials) ? workLog.materials : []
      if (list.length === 0) {
        return '미입력'
      }

      const [first, ...rest] = list
      const quantity = Number(first.quantity ?? 0)
      const quantityText = Number.isFinite(quantity)
        ? quantity.toLocaleString('ko-KR')
        : String(first.quantity || '')
      const unitText = first.unit ? ` ${first.unit}` : ''
      const label = first.material_name || first.material_code || '자재'

      if (rest.length > 0) {
        return `${label} ${quantityText}${unitText} 외 ${rest.length}건`
      }

      return `${label} ${quantityText}${unitText}`
    }

    return (
      <article className="rounded-2xl border border-[#e6eaf2] bg-white p-5 shadow-[0_6px_20px_rgba(16,24,40,0.06)]">
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <p className="truncate text-sm font-semibold text-[#1A254F]">{workLog.siteName}</p>
            {(workLog.title || workLog.notes) && (
              <p className="truncate text-xs text-[#475467]">{workLog.title || workLog.notes}</p>
            )}
            <div className="flex flex-wrap gap-3 text-xs text-[#667085]">
              <span>작성자: {workLog.author || workLog.createdBy || '미지정'}</span>
              <span>작성일: {formatDate(workLog.date)}</span>
              <span>
                위치: {workLog.location.block}블럭 {workLog.location.dong}동 {workLog.location.unit}
                호
              </span>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <span
              className={cn(
                'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
                statusClasses
              )}
            >
              {getStatusText(workLog.status)}
            </span>
            <button
              type="button"
              onClick={onView}
              className="rounded-full border border-[#d0d5dd] px-3 py-1 text-xs font-semibold text-[#1A254F] transition-colors hover:bg-[#f4f6fb]"
            >
              상세보기
            </button>
          </div>
        </header>

        <dl className="mt-4 grid gap-3 text-xs text-[#475467] md:grid-cols-2">
          {workLog.memberTypes.length > 0 && (
            <div>
              <dt className="text-[#667085]">부재명</dt>
              <dd className="mt-1 font-semibold text-[#1A254F]">
                {workLog.memberTypes.join(', ')}
              </dd>
            </div>
          )}
          {workLog.workProcesses.length > 0 && (
            <div>
              <dt className="text-[#667085]">작업공정</dt>
              <dd className="mt-1 font-semibold text-[#1A254F]">
                {workLog.workProcesses.join(', ')}
              </dd>
            </div>
          )}
          {workLog.workTypes.length > 0 && (
            <div>
              <dt className="text-[#667085]">작업공간</dt>
              <dd className="mt-1 font-semibold text-[#1A254F]">{workLog.workTypes.join(', ')}</dd>
            </div>
          )}
          <div>
            <dt className="text-[#667085]">총 공수</dt>
            <dd className="mt-1 font-semibold text-[#1A254F]">{workLog.totalHours}시간</dd>
          </div>
        </dl>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-[#667085]">
            <span>진행률</span>
            <span className="font-semibold text-[#1A254F]">{workLog.progress}%</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-[#f2f4f7]">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300 ease-out',
                getProgressColor(workLog.progress)
              )}
              style={{ width: `${workLog.progress}%` }}
            />
          </div>
        </div>

        <div className="mt-4 grid gap-2 text-xs text-[#475467] md:grid-cols-2">
          <div className="flex items-center gap-2">
            <Image className="h-4 w-4 text-[#1A254F]" />
            <span>사진대지</span>
            <span className="ml-auto font-semibold text-[#1A254F]">{photoCount}개</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#1A254F]" />
            <span>진행도면</span>
            <span className="ml-auto font-semibold text-[#1A254F]">{drawingCount}개</span>
          </div>
          <div className="flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-[#1A254F]" />
            <span>확인서</span>
            <span className="ml-auto font-semibold text-[#1A254F]">{confirmationCount}개</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#667085]">자재 사용</span>
            <span className="ml-auto font-semibold text-[#1A254F]">{renderMaterialSummary()}</span>
          </div>
        </div>

        {isDraft && (onEdit || onSubmit || onDelete) && (
          <div className="mt-5 flex flex-wrap gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center gap-1 rounded-full border border-[#d0d5dd] px-3 py-1.5 text-xs font-semibold text-[#1A254F] transition-colors hover:bg-[#f4f6fb]"
              >
                <Edit3 className="h-3.5 w-3.5" />
                수정
              </button>
            )}
            {onSubmit && (
              <button
                type="button"
                onClick={onSubmit}
                className="inline-flex items-center gap-1 rounded-full bg-[#0068FE] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-transform hover:bg-blue-600 active:scale-95"
              >
                <Send className="h-3.5 w-3.5" />
                제출
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex items-center gap-1 rounded-full border border-transparent px-3 py-1.5 text-xs font-semibold text-[#dc2626] transition-colors hover:bg-[#fee2e2]"
              >
                <Trash2 className="h-3.5 w-3.5" />
                삭제
              </button>
            )}
          </div>
        )}

        {!isDraft && onPrint && (
          <div className="mt-5">
            <button
              type="button"
              onClick={onPrint}
              className="inline-flex items-center gap-2 rounded-full border border-[#d0d5dd] px-3 py-1.5 text-xs font-semibold text-[#1A254F] transition-colors hover:bg-[#f4f6fb]"
            >
              <Printer className="h-3.5 w-3.5" />
              출력하기
            </button>
          </div>
        )}
      </article>
    )
  }
)

WorkLogCard.displayName = 'WorkLogCard'
