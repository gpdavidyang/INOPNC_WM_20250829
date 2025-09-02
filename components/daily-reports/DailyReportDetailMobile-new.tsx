'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar,
  FileText,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  Edit,
  ArrowLeft,
  Paperclip,
  Building2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  MapPin,
  ImageIcon,
  Receipt,
  ClipboardList,
  MessageSquare,
  Camera,
  Package,
  User,
  X
} from 'lucide-react'
import { DailyReport, Profile } from '@/types'
import { showErrorNotification } from '@/lib/error-handling'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface DailyReportDetailMobileProps {
  report: DailyReport & {
    site?: any
    created_by_profile?: any
    approved_by_profile?: any
    workers?: any[]
    beforePhotos?: any[]
    afterPhotos?: any[]
    receipts?: any[]
    documents?: any[]
    component_name?: string
    work_process?: string
    work_section?: string
    hq_request?: string
  }
  currentUser: Profile
}

export default function DailyReportDetailMobile({ report, currentUser }: DailyReportDetailMobileProps) {
  const router = useRouter()
  const [expandedSections, setExpandedSections] = useState({
    workContent: true,
    workers: false,
    beforePhotos: false,
    afterPhotos: false,
    receipts: false,
    requests: false,
    npc1000: false,
    issues: false
  })

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev]
    }))
  }

  const canEdit = 
    report.created_by === currentUser.id &&
    report.status === 'draft'

  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      draft: { label: '임시저장', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
      submitted: { label: '제출됨', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
      approved: { label: '승인됨', className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
      rejected: { label: '반려됨', className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                작업일지 상세
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {report.work_date ? format(new Date(report.work_date), 'yyyy년 MM월 dd일', { locale: ko }) : '-'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(report.status || 'draft')}
            {canEdit && (
              <Button
                variant="outline"
                size="compact"
                onClick={() => router.push(`/dashboard/daily-reports/${report.id}/edit`)}
                className="touch-manipulation text-xs p-1.5"
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3 pb-20">
        {/* Basic Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">
                작업일자
              </label>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {report.work_date ? format(new Date(report.work_date), 'yyyy.MM.dd', { locale: ko }) : '-'}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">
                현장명
              </label>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {report.site?.name || '-'}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">
                작성자
              </label>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {report.created_by_profile?.full_name || '-'}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">
                상태
              </label>
              <div>{getStatusBadge(report.status || 'draft')}</div>
            </div>
          </div>
        </div>

        {/* 1. 작업 내용 - 부재명, 작업공정, 작업구간 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => toggleSection('workContent')}
            className="w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                작업 내용
              </h2>
              {expandedSections.workContent ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </button>
          {expandedSections.workContent && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">
                    부재명
                  </label>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {report.member_name || report.component_name || '-'}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">
                    작업공정
                  </label>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {report.process_type || report.work_process || '-'}
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">
                    작업구간
                  </label>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {report.work_section || '-'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. 작업자 정보 */}
        {report.workers && report.workers.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => toggleSection('workers')}
              className="w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                  작업자 정보
                  <Badge variant="secondary" className="text-xs">
                    {report.workers.length}명
                  </Badge>
                </h2>
                {expandedSections.workers ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </button>
            {expandedSections.workers && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                <div className="space-y-2">
                  {report.workers.map((worker: any, index: number) => (
                    <div key={worker.id || index} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-gray-500" />
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {worker.worker_name}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {worker.work_hours}시간 ({(worker.work_hours / 8).toFixed(1)} 공수)
                      </div>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
                    <div className="flex justify-between items-center text-sm font-semibold">
                      <span className="text-gray-900 dark:text-gray-100">총 작업시간</span>
                      <span className="text-blue-600 dark:text-blue-400">
                        {report.workers.reduce((sum: number, w: any) => sum + (w.work_hours || 0), 0)}시간
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. 작업 전 사진 */}
        {report.beforePhotos && report.beforePhotos.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => toggleSection('beforePhotos')}
              className="w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Camera className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                  작업 전 사진
                  <Badge variant="secondary" className="text-xs">
                    {report.beforePhotos.length}장
                  </Badge>
                </h2>
                {expandedSections.beforePhotos ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </button>
            {expandedSections.beforePhotos && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-3 gap-2">
                  {report.beforePhotos.map((photo: any, index: number) => (
                    <div key={photo.id || index} className="relative group">
                      <img
                        src={photo.file_url || photo.file_path}
                        alt={`작업 전 사진 ${index + 1}`}
                        className="w-full h-24 object-cover rounded border border-gray-200 dark:border-gray-600"
                      />
                      {photo.description && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-1">
                          <p className="text-xs text-white truncate">{photo.description}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 6. 작업 후 사진 */}
        {report.afterPhotos && report.afterPhotos.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => toggleSection('afterPhotos')}
              className="w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Camera className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                  작업 후 사진
                  <Badge variant="secondary" className="text-xs">
                    {report.afterPhotos.length}장
                  </Badge>
                </h2>
                {expandedSections.afterPhotos ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </button>
            {expandedSections.afterPhotos && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-3 gap-2">
                  {report.afterPhotos.map((photo: any, index: number) => (
                    <div key={photo.id || index} className="relative group">
                      <img
                        src={photo.file_url || photo.file_path}
                        alt={`작업 후 사진 ${index + 1}`}
                        className="w-full h-24 object-cover rounded border border-gray-200 dark:border-gray-600"
                      />
                      {photo.description && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-1">
                          <p className="text-xs text-white truncate">{photo.description}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 7. 영수증 정보 */}
        {report.receipts && report.receipts.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => toggleSection('receipts')}
              className="w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                  영수증 정보
                  <Badge variant="secondary" className="text-xs">
                    {report.receipts.length}건
                  </Badge>
                </h2>
                {expandedSections.receipts ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </button>
            {expandedSections.receipts && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                <div className="space-y-2">
                  {report.receipts.map((receipt: any, index: number) => (
                    <div key={receipt.id || index} className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {receipt.description || receipt.file_name || `영수증 ${index + 1}`}
                          </p>
                          {receipt.amount && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              금액: ₩{receipt.amount.toLocaleString()}
                            </p>
                          )}
                          {receipt.receipt_date && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {format(new Date(receipt.receipt_date), 'yyyy.MM.dd', { locale: ko })}
                            </p>
                          )}
                        </div>
                        <button className="text-blue-600 dark:text-blue-400 text-xs hover:underline flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          보기
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 8. 본사에게 요청 */}
        {report.hq_request && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => toggleSection('requests')}
              className="w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                  본사에게 요청
                </h2>
                {expandedSections.requests ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </button>
            {expandedSections.requests && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {report.hq_request}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 9. NPC-1000 자재관리 */}
        {(report.npc1000_incoming || report.npc1000_used || report.npc1000_remaining) && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => toggleSection('npc1000')}
              className="w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                  NPC-1000 자재관리
                </h2>
                {expandedSections.npc1000 ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </button>
            {expandedSections.npc1000 && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">
                      입고량
                    </label>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {report.npc1000_incoming || 0} kg
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">
                      사용량
                    </label>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {report.npc1000_used || 0} kg
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">
                      잔량
                    </label>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {report.npc1000_remaining || 0} kg
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 10. 특이 사항 */}
        {report.issues && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => toggleSection('issues')}
              className="w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />
                  특이 사항
                </h2>
                {expandedSections.issues ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </button>
            {expandedSections.issues && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {report.issues}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}