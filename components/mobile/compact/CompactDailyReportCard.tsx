'use client'

import { type MouseEvent } from 'react'
import { cn } from '@/lib/utils'
import type { DailyReport } from '@/types/daily-reports'
import { Button } from '@/components/ui/button'
import { Edit3, CheckCircle, ChevronRight } from 'lucide-react'

interface CompactDailyReportCardProps {
  report: DailyReport
  onClick?: () => void
  onEdit?: () => void
  className?: string
}

/**
 * 컴팩트 일일보고서 카드 - 모바일 고밀도 레이아웃
 * 기존 대비 50% 공간 절약
 */
export function CompactDailyReportCard({
  report,
  onClick,
  onEdit,
  className
}: CompactDailyReportCardProps) {
  const statusColors = {
    draft: 'bg-gray-100 text-gray-600',
    submitted: 'bg-blue-100 text-blue-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700'
  }

  const handleEdit = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    onEdit?.()
  }

  return (
    <div
      className={cn(
        // 컴팩트 레이아웃 - 패딩 감소 (16px → 12px)
        "bg-white rounded-md shadow-sm p-3 mb-2",
        "border border-gray-100 hover:border-gray-300",
        "transition-all duration-200 cursor-pointer",
        "active:scale-[0.98] active:shadow-none",
        className
      )}
      onClick={onClick}
    >
      {/* 상단 정보 라인 - 한 줄로 압축 */}
      <div className="flex items-start justify-between mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold text-gray-900">
            {new Date(report.work_date).toLocaleDateString('ko-KR', {
              month: 'numeric',
              day: 'numeric'
            })}
          </span>
          <span className={cn(
            "px-1.5 py-0.5 rounded text-xs font-medium",
            statusColors[report.status || 'draft']
          )}>
            {report.status === 'draft' && '임시저장'}
            {report.status === 'submitted' && '제출됨'}
            {report.status === 'approved' && '승인됨'}
            {report.status === 'rejected' && '반려됨'}
          </span>
        </div>
        
        {/* 액션 버튼 - 아이콘만 사용 */}
        <Button
          type="button"
          onClick={handleEdit}
          variant="ghost"
          size="compact"
          className="h-7 w-7 p-1 -m-1 text-gray-400 hover:text-gray-600"
        >
          <Edit3 className="w-4 h-4" />
        </Button>
      </div>

      {/* 중간 정보 - 2줄로 압축 */}
      <div className="space-y-0.5 mb-1.5">
        <p className="text-sm text-gray-700 truncate">
          {report.member_name} · {report.process_type}
        </p>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>작업자 {report.total_workers || 0}명</span>
          {report.npc1000_used && (
            <span>NPC {report.npc1000_used}포</span>
          )}
        </div>
      </div>

      {/* 하단 인디케이터 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {report.status === 'approved' && (
            <CheckCircle className="w-3.5 h-3.5 text-green-600" />
          )}
          {report.issues && (
            <span className="text-xs text-orange-600 font-medium">
              특이사항
            </span>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </div>
    </div>
  )
}
