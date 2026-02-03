'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  Calendar,
  Clock,
  Download,
  Edit,
  MapPin,
  Printer,
  Share2,
  Trash2,
  User,
} from 'lucide-react'
import React from 'react'

interface DetailHeaderProps {
  report: any
  onEdit?: () => void
  onDelete?: () => void
  canEdit?: boolean
  canDelete?: boolean
}

export const DetailHeader = ({
  report,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: DetailHeaderProps) => {
  const [showActions, setShowActions] = React.useState(false)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">임시</Badge>
      case 'submitted':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">제출됨</Badge>
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-200">승인됨</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200">반려됨</Badge>
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">작업일지 상세</h1>
          {getStatusBadge(report.status || 'draft')}
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>
              {report.work_date
                ? format(new Date(report.work_date), 'yyyy년 MM월 dd일 (EEEE)', { locale: ko })
                : '-'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span>{report.site?.name || '현장 미지정'}</span>
          </div>
          <div className="flex items-center gap-1">
            <User className="w-4 h-4 text-gray-400" />
            <span>
              {report.created_by_profile?.full_name || report.created_by || '작성자 미상'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>
              {report.created_at ? format(new Date(report.created_at), 'yyyy.MM.dd HH:mm') : '-'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" className="h-9">
          <Download className="w-4 h-4 mr-1.5" />
          다운로드
        </Button>
        <Button variant="outline" size="sm" className="h-9">
          <Printer className="w-4 h-4 mr-1.5" />
          인쇄
        </Button>
        <Button variant="outline" size="sm" className="h-9">
          <Share2 className="w-4 h-4 mr-1.5" />
          공유
        </Button>

        {(canEdit || canDelete) && (
          <div className="relative">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => setShowActions(!showActions)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            {showActions && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                {canEdit && (
                  <button
                    onClick={() => {
                      onEdit?.()
                      setShowActions(false)
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    수정하기
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => {
                      onDelete?.()
                      setShowActions(false)
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 border-t border-gray-100 dark:border-gray-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    삭제하기
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
