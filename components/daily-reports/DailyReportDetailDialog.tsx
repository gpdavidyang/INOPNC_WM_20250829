'use client'

import { useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Calendar,
  Cloud,
  Thermometer,
  FileText,
  Users,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  Edit,
  Building2,
  AlertTriangle,
  Eye
} from 'lucide-react'
import { DailyReport, Profile, Site } from '@/types'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'

interface DailyReportDetailDialogProps {
  report: DailyReport | null
  site?: Site
  currentUser: Profile
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DailyReportDetailDialog({
  report,
  site,
  currentUser,
  open,
  onOpenChange
}: DailyReportDetailDialogProps) {
  if (!report) return null

  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      draft: { label: '임시저장', variant: 'secondary', icon: Clock, className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
      submitted: { label: '제출됨', variant: 'primary', icon: FileText, className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
      approved: { label: '승인됨', variant: 'success', icon: CheckCircle, className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
      rejected: { label: '반려됨', variant: 'danger', icon: XCircle, className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' }
    }

    const config = statusConfig[status] || statusConfig.draft
    const Icon = config.icon

    return (
      <Badge className={`flex items-center gap-1 text-xs px-2 py-1 ${config.className}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const canEdit = currentUser.id === report.created_by && report.status === 'draft'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <span className="text-lg font-semibold">작업일지 상세</span>
              {getStatusBadge(report.status || 'draft')}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {canEdit && (
                <Link href={`/dashboard/daily-reports/${report.id}/edit`}>
                  <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                    <Edit className="h-4 w-4 mr-1" />
                    수정
                  </Button>
                </Link>
              )}
              <Link href={`/dashboard/daily-reports/${report.id}`}>
                <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                  <Eye className="h-4 w-4 mr-1" />
                  전체보기
                </Button>
              </Link>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4 space-y-4">
          {/* Basic Information */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">기본 정보</h3>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                  <Building2 className="h-4 w-4" />
                  <span>현장</span>
                </div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {site?.name || '미지정'}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                  <Calendar className="h-4 w-4" />
                  <span>작업일자</span>
                </div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {format(new Date(report.work_date), 'yyyy년 M월 d일 (EEE)', { locale: ko })}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                  <Cloud className="h-4 w-4" />
                  <span>날씨</span>
                </div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {(report as any).weather || '맑음'}
                </p>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">작업인원</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {report.total_workers || 0}명
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <Package className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">자재사용</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {report.npc1000_used ? `${Math.round(report.npc1000_used)}kg` : '0kg'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">공정</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {report.process_type || '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Work Details */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">작업 내용</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">담당자</p>
                <p className="text-gray-900 dark:text-gray-100">{report.member_name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">공정명</p>
                <p className="text-gray-900 dark:text-gray-100">{report.process_type || '-'}</p>
              </div>
              {report.issues && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">특이사항</p>
                  <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">{report.issues}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timestamps */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">이력 정보</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">작성일시</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {format(new Date(report.created_at), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
                </p>
              </div>
              {report.updated_at && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400">수정일시</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {format(new Date(report.updated_at), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}