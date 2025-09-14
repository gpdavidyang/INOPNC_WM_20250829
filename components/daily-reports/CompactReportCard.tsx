'use client'

import type { DailyReport, Site } from '@/types'

interface CompactReportCardProps {
  report: DailyReport
  site?: Site
  canEdit: boolean
  onViewDetail?: () => void
}

export function CompactReportCard({ report, site, canEdit, onViewDetail }: CompactReportCardProps) {
  const getStatusBadge = (status?: string) => {
    const statusMap = {
      draft: { label: '임시', className: 'bg-gray-100 text-gray-700' },
      submitted: { label: '제출', className: 'bg-blue-100 text-blue-700' },
      approved: { label: '승인', className: 'bg-green-100 text-green-700' },
      rejected: { label: '반려', className: 'bg-red-100 text-red-700' },
    }
    
    const statusConfig = status ? statusMap[status as keyof typeof statusMap] : null
    if (!statusConfig) return null
    
    return (
      <Badge className={cn('text-xs px-1.5 py-0.5', statusConfig.className)}>
        {statusConfig.label}
      </Badge>
    )
  }

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-3 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onViewDetail}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-sm font-medium text-gray-900">
            {format(new Date(report.work_date), 'M.d')}
            <span className="text-xs text-gray-500 ml-0.5">
              ({format(new Date(report.work_date), 'EEE', { locale: ko })})
            </span>
          </span>
        </div>
        {getStatusBadge(report.status || 'draft')}
      </div>

      {/* 작업내용 정보 */}
      <div className="mb-3">
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
          <Building2 className="w-3 h-3" />
          <span>작업내용 정보</span>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 space-y-1">
          <div className="text-xs">
            <span className="text-gray-600 dark:text-gray-400">작업내용:</span>
            <span className="ml-1 font-medium text-gray-900 dark:text-gray-100">{report.process_type || '-'}</span>
          </div>
          <div className="text-xs">
            <span className="text-gray-600 dark:text-gray-400">부재명:</span>
            <span className="ml-1 font-medium text-gray-900 dark:text-gray-100">{report.member_name || '-'}</span>
          </div>
          <div className="text-xs">
            <span className="text-gray-600 dark:text-gray-400">작업공간:</span>
            <span className="ml-1 font-medium text-gray-900 dark:text-gray-100">{site?.name || '-'}</span>
          </div>
        </div>
      </div>

      {/* 작업자 정보 */}
      <div className="mb-3">
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
          <Users className="w-3 h-3" />
          <span>작업자 정보</span>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 space-y-1">
          <div className="text-xs">
            <span className="text-gray-600 dark:text-gray-400">작업자:</span>
            <span className="ml-1 font-medium text-gray-900 dark:text-gray-100">{report.total_workers || 0}명</span>
          </div>
          <div className="text-xs">
            <span className="text-gray-600 dark:text-gray-400">공수:</span>
            <span className="ml-1 font-medium text-blue-600 dark:text-blue-400">{report.npc1000_used || 0}공수</span>
          </div>
        </div>
      </div>

      {/* Issues */}
      {report.issues && (
        <div className="flex items-start gap-1 mb-2">
          <AlertTriangle className="w-3 h-3 text-orange-500 flex-shrink-0 mt-0.5" />
          <span className="text-xs text-gray-700 line-clamp-1">{report.issues}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-1.5">
        <Button 
          variant="outline" 
          size="compact" 
          className="flex-1 h-7 text-xs"
          onClick={(e) => {
            e.stopPropagation()
            onViewDetail?.()
          }}
        >
          상세보기
        </Button>
        {canEdit && (
          <Link href={`/dashboard/daily-reports/${report.id}/edit`} className="flex-1">
            <Button 
              variant="outline" 
              size="compact" 
              className="w-full h-7 text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              수정
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}