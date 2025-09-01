'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { approveDailyReport } from '@/app/actions/daily-reports'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
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
  UserCheck,
  AlertTriangle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  MapPin,
  ImageIcon,
  Receipt,
  ClipboardList,
  MessageSquare,
  PlusCircle,
  Wrench,
  User,
  Camera,
  Cloud,
  Eye
} from 'lucide-react'
import { DailyReport, Profile } from '@/types'
import type { DailyReportFormData, WorkerData, PhotoData, ReceiptData } from '@/types/daily-reports'
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
  }
  currentUser: Profile
}

export default function DailyReportDetailMobile({ report, currentUser }: DailyReportDetailMobileProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [approvalComments, setApprovalComments] = useState('')
  const [showDetailedWorkLogs, setShowDetailedWorkLogs] = useState(false)
  const [showAttendanceDetails, setShowAttendanceDetails] = useState(false)

  const canApprove = 
    ['site_manager', 'admin', 'system_admin'].includes(currentUser.role) &&
    report.status === 'submitted'

  const canEdit = 
    report.created_by === currentUser.id &&
    report.status === 'draft'

  const handleApproval = async (approve: boolean) => {
    setLoading(true)
    try {
      const result = await approveDailyReport(report.id, approve, approvalComments)
      if (result.success) {
        toast.success(approve ? '보고서가 승인되었습니다.' : '보고서가 반려되었습니다.')
        router.refresh()
        setShowRejectDialog(false)
      } else {
        showErrorNotification(result.error || '처리 중 오류가 발생했습니다', 'handleApproval')
      }
    } catch (error) {
      showErrorNotification(error, 'handleApproval')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: '임시저장', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
      submitted: { label: '제출됨', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
      approved: { label: '승인됨', className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
      rejected: { label: '반려됨', className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    return (
      <span className={cn('text-xs px-2 py-0.5 rounded-full inline-flex items-center', config.className)}>
        {config.label}
      </span>
    )
  }

  // 날짜 포맷
  const workDate = new Date((report as any).report_date || report.work_date)
  const formattedDate = format(workDate, 'yyyy년 MM월 dd일 (EEEE)', { locale: ko })

  // Form data 추출
  const formData = (report as any).formData || {} as DailyReportFormData

  // Calculate totals for mobile display
  const totalWorkerCount = report.work_logs?.reduce((sum: any, log: any) => sum + (log.worker_count || 0), 0) || 0

  return (
    <div className="max-w-2xl mx-auto pb-20">
      {/* Header - 컴팩트 스타일 모바일 최적화 */}
      <div className="mb-3 px-3 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.back()}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors touch-manipulation"
            >
              <ArrowLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                작업일지 상세
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {new Date((report as any).report_date || report.work_date).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
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
            {canApprove && (
              <div className="flex gap-1">
                <Button
                  variant="danger"
                  size="compact"
                  onClick={() => setShowRejectDialog(true)}
                  className="touch-manipulation text-xs p-1.5"
                >
                  <XCircle className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="primary"
                  size="compact"
                  onClick={() => handleApproval(true)}
                  className="touch-manipulation text-xs p-1.5"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content - 컴팩트 카드 스타일 */}
      <div className="px-3 space-y-2.5">

        {/* Basic Information - 컴팩트 카드 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-500 dark:text-blue-400" />
            기본 정보
          </h2>
          <div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">
                  작업일자
                </label>
                <div className="flex items-center gap-1 text-sm text-gray-900 dark:text-gray-100">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{new Date((report as any).report_date || report.work_date).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</span>
                </div>
              </div>
              
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">
                  현장명
                </label>
                <div className="text-sm text-gray-900 dark:text-gray-100">
                  {report.site?.name || '-'}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">
                  작성자
                </label>
                <div className="text-sm text-gray-900 dark:text-gray-100">
                  {report.created_by_profile?.full_name || '-'}
                </div>
              </div>


              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">
                  총 투입 인원
                </label>
                <div className="flex items-center gap-1 text-sm text-gray-900 dark:text-gray-100">
                  <Users className="h-3.5 w-3.5" />
                  <span>{totalWorkerCount}명</span>
                </div>
              </div>

              <div className="col-span-2">
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">
                  작성일시
                </label>
                <div className="flex items-center gap-1 text-sm text-gray-900 dark:text-gray-100">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{new Date(report.created_at).toLocaleString('ko-KR')}</span>
                </div>
              </div>
            </div>

            {report.approved_by && (
              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">
                      승인자
                    </label>
                    <div className="flex items-center gap-1 text-sm text-gray-900 dark:text-gray-100">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                      <span>{report.approved_by_profile?.full_name || '-'}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">
                      승인일시
                    </label>
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {report.approved_at ? new Date(report.approved_at).toLocaleString('ko-KR') : '-'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Work Content Summary - 컴팩트 카드 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-500 dark:text-blue-400" />
            작업 내용
          </h2>
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <p className="whitespace-pre-wrap">
              {report.main_work || formData.main_work || '작업 내용이 입력되지 않았습니다.'}
            </p>
          </div>
        </div>

        {/* Detailed Work Logs - 컴팩트 접기/펼치기 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowDetailedWorkLogs(!showDetailedWorkLogs)}
            className="w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Wrench className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                상세 작업 내역
              </h2>
              {showDetailedWorkLogs ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </button>
          {showDetailedWorkLogs && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">
                    공정
                  </label>
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    {report.process_type || '-'}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">
                    작업구간
                  </label>
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    {formData.work_section || '-'}
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">
                    부재명
                  </label>
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    {report.member_name || '-'}
                  </div>
                </div>
                {report.issues && (
                  <div className="col-span-2">
                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">
                      특이사항
                    </label>
                    <div className="flex items-start gap-1.5 text-sm text-gray-900 dark:text-gray-100">
                      <AlertTriangle className="h-3.5 w-3.5 mt-0.5 text-yellow-500" />
                      <p className="whitespace-pre-wrap">{report.issues}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Attendance Details - 컴팩트 접기/펼치기 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowAttendanceDetails(!showAttendanceDetails)}
            className="w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                출근 현황
              </h2>
              {showAttendanceDetails ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </button>
          {showAttendanceDetails && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              {formData.workers && formData.workers.length > 0 ? (
                <div className="space-y-2">
                  {formData.workers.map((worker: WorkerData, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{worker.name}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{worker.position || '작업자'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{worker.hours || 8}h</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{(worker.hours || 8) / 8} 공수</p>
                      </div>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
                    <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                      <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                        총 작업인원: {formData.workers.length}명
                      </span>
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                        총 {formData.workers.reduce((sum, worker) => sum + (worker.hours || 8), 0)}h
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                      총 작업인원
                    </label>
                    <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <Users className="h-4 w-4" />
                      <span>{report.total_workers || 0}명</span>
                    </div>
                  </div>
                  {report.member_name && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                        대표 작업자
                      </label>
                      <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                        <User className="h-4 w-4" />
                        <span>{report.member_name}</span>
                      </div>
                    </div>
                  )}
                  {!report.total_workers && !report.member_name && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">출근 정보가 없습니다.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Work Photos - 컴팩트 카드 */}
        {((formData.before_photos && formData.before_photos.length > 0) || 
          (formData.after_photos && formData.after_photos.length > 0)) && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Camera className="h-4 w-4 text-blue-500 dark:text-blue-400" />
              작업 사진
            </h2>
            <div className="space-y-3">
              {/* 작업전 사진 */}
              {formData.before_photos && formData.before_photos.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1.5">
                    작업전 사진
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {formData.before_photos.map((photo: PhotoData, index: number) => (
                      <div key={index} className="relative group cursor-pointer">
                        <img
                          src={photo.url || photo.path}
                          alt={`작업전 사진 ${index + 1}`}
                          className="w-full h-20 object-cover rounded border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 rounded-lg flex items-center justify-center">
                          <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white dark:bg-gray-800 p-2 rounded-full shadow-md">
                            <ImageIcon className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 작업후 사진 */}
              {formData.after_photos && formData.after_photos.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-2">
                    작업후 사진
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {formData.after_photos.map((photo: PhotoData, index: number) => (
                      <div key={index} className="relative group cursor-pointer">
                        <img
                          src={photo.url || photo.path}
                          alt={`작업후 사진 ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 rounded-lg flex items-center justify-center">
                          <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white dark:bg-gray-800 p-2 rounded-full shadow-md">
                            <ImageIcon className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Receipts - 파트너사 스타일 (있는 경우에만 표시) */}
        {formData.receipts && formData.receipts.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                영수증 첨부
              </h2>
            </div>
            <div className="px-4 py-3">
              <div className="space-y-3">
                {formData.receipts.map((receipt: ReceiptData, index: number) => (
                  <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">
                          구분
                        </label>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {receipt.description || '영수증'}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">
                          금액
                        </label>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {receipt.amount ? `₩${receipt.amount.toLocaleString()}` : '-'}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 dark:text-gray-400">
                        {receipt.date ? format(new Date(receipt.date), 'yyyy.MM.dd', { locale: ko }) : '-'}
                      </span>
                      <button className="text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        다운로드
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Progress Drawings - 파트너사 스타일 (있는 경우에만 표시) */}
        {(report as any).drawing_urls && Array.isArray((report as any).drawing_urls) && (report as any).drawing_urls.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                진행 도면
              </h2>
            </div>
            <div className="px-4 py-3">
              <div className="space-y-2">
                {(report as any).drawing_urls.map((drawingUrl: string, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        진행 도면 {index + 1}
                      </span>
                    </div>
                    <button className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded transition-colors">
                      보기
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* HQ Request - 파트너사 스타일 (있는 경우에만 표시) */}
        {(report as any).hq_request && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                본사 요청사항
              </h2>
            </div>
            <div className="px-4 py-3">
              <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300">
                <p className="whitespace-pre-wrap leading-relaxed text-sm">
                  {(report as any).hq_request}
                </p>
              </div>
            </div>
          </div>
        )}


        {/* Issues - 파트너사 스타일 (있는 경우에만 표시) */}
        {report.issues && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                특이사항 및 문제점
              </h2>
            </div>
            <div className="px-4 py-3">
              <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300">
                <p className="whitespace-pre-wrap leading-relaxed text-sm">
                  {report.issues}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 승인 정보 - 파트너사 스타일 */}
        {report.approved_by && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700 p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="text-base font-semibold text-green-900 dark:text-green-100">승인 완료</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">승인자</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {report.approved_by_profile?.full_name || '-'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">승인일시</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {report.approved_at ? format(new Date(report.approved_at), 'yyyy.MM.dd HH:mm', { locale: ko }) : '-'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 반려 정보 - 파트너사 스타일 */}
        {report.status === 'rejected' && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700 p-4">
            <div className="flex items-center gap-2 mb-3">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <span className="text-base font-semibold text-red-900 dark:text-red-100">반려됨</span>
            </div>
            {(report as any).notes && (
              <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300">
                <p className="text-sm leading-relaxed">
                  {(report as any).notes}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 하단 액션 버튼 - 터치 친화적 크기 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 pb-safe">
        <div className="flex gap-3">
          {canEdit && (
            <button
              onClick={() => router.push(`/dashboard/daily-reports/${report.id}/edit`)}
              className="flex-1 h-12 px-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <Edit className="h-5 w-5" />
              수정
            </button>
          )}
          {canApprove && (
            <>
              <button
                onClick={() => setShowRejectDialog(true)}
                className="flex-1 h-12 px-4 border border-red-300 dark:border-red-700 bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <XCircle className="h-5 w-5" />
                반려
              </button>
              <button
                onClick={() => handleApproval(true)}
                disabled={loading}
                className="flex-1 h-12 px-4 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium disabled:cursor-not-allowed"
              >
                <CheckCircle className="h-5 w-5" />
                승인
              </button>
            </>
          )}
          {!canEdit && !canApprove && (
            <button
              className="flex-1 h-12 px-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <Download className="h-5 w-5" />
              다운로드
            </button>
          )}
        </div>
      </div>

      {/* 반려 다이얼로그 - 모바일 최적화 */}
      {showRejectDialog && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowRejectDialog(false)}
          />
          <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-t-2xl animate-slide-up safe-area-inset-bottom">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">작업일지 반려</h3>
                <button
                  onClick={() => setShowRejectDialog(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XCircle className="h-6 w-6 text-gray-500" />
                </button>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  반려 사유
                </label>
                <textarea
                  value={approvalComments}
                  onChange={(e) => setApprovalComments(e.target.value)}
                  placeholder="반려 사유를 입력하세요"
                  rows={4}
                  className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRejectDialog(false)}
                  disabled={loading}
                  className="flex-1 h-12 px-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center font-medium disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  onClick={() => handleApproval(false)}
                  disabled={loading || !approvalComments}
                  className="flex-1 h-12 px-4 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors flex items-center justify-center font-medium disabled:cursor-not-allowed"
                >
                  반려하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}