'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { approveDailyReport } from '@/app/actions/daily-reports'
// import { getFileAttachments } from '@/app/actions/documents' // TODO: Implement when table exists
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
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
  ArrowLeft,
  Paperclip,
  ChevronDown,
  ChevronUp,
  Eye,
  AlertTriangle
} from 'lucide-react'
import { DailyReport, Profile } from '@/types'
import { showErrorNotification } from '@/lib/error-handling'
import { toast } from 'sonner'

interface DailyReportDetailProps {
  report: DailyReport & {
    site?: any
    work_logs?: any[]
    attendance_records?: any[]
    created_by_profile?: any
    approved_by_profile?: any
  }
  currentUser: Profile
}

export default function DailyReportDetail({ report, currentUser }: DailyReportDetailProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [approvalComments, setApprovalComments] = useState('')
  const [attachments, setAttachments] = useState<any[]>([])
  const [showDetailedWorkLogs, setShowDetailedWorkLogs] = useState(false)
  const [showAttendanceDetails, setShowAttendanceDetails] = useState(false)

  // Load attachments
  // TODO: Implement when file attachments are available
  // useState(() => {
  //   getFileAttachments('daily_report', report.id).then(result => {
  //     if (result.success && result.data) {
  //       setAttachments(result.data)
  //     }
  //   })
  // })

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
        setShowApprovalDialog(false)
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
    const statusConfig: any = {
      draft: { label: '작성중', variant: 'secondary', icon: Clock },
      submitted: { label: '제출됨', variant: 'default', icon: FileText },
      approved: { label: '승인됨', variant: 'success', icon: CheckCircle },
      rejected: { label: '반려됨', variant: 'error', icon: XCircle }
    }

    const config = statusConfig[status] || statusConfig.draft
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
        status === 'approved' ? 'bg-green-100 text-green-800' :
        status === 'rejected' ? 'bg-red-100 text-red-800' :
        status === 'submitted' ? 'bg-blue-100 text-blue-800' :
        'bg-gray-100 text-gray-800'
      }`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    )
  }

  const totalWorkerCount = 0 // report.work_logs?.reduce((sum: any, log: any) => sum + (log.worker_count || 0), 0) || 0
  const totalMaterialUsage = 0 // report.work_logs?.reduce((sum: any, log: any) => sum + (log.work_log_materials?.length || 0), 0) || 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header - 파트너사 스타일과 동일한 구조 */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
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
                  {new Date((report as any).report_date || report.work_date).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long', 
                    day: 'numeric',
                    weekday: 'short'
                  })}
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
                >
                  <Edit className="h-4 w-4 mr-1" />
                  수정
                </Button>
              )}
              {canApprove && (
                <>
                  <Button
                    variant="danger"
                    size="compact"
                    onClick={() => {
                      setShowApprovalDialog(true)
                      setApprovalComments('')
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    반려
                  </Button>
                  <Button
                    variant="primary"
                    size="compact"
                    onClick={() => handleApproval(true)}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    승인
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-3">

          {/* Basic Information - 파트너사 스타일과 동일한 카드 기반 레이아웃 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-3 py-3 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                기본 정보
              </h2>
            </div>
            <div className="px-3 py-3">
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                      작업일자
                    </label>
                    <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date((report as any).report_date || report.work_date).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        weekday: 'short'
                      })}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                      현장명
                    </label>
                    <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <Users className="h-4 w-4" />
                      <span>{report.site?.name || '-'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                      작성자
                    </label>
                    <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <Users className="h-4 w-4" />
                      <span>{report.created_by_profile?.full_name || '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                      날씨
                    </label>
                    <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <Cloud className="h-4 w-4" />
                      <span>{(report as any).weather || (report as any).weather_morning || '맑음'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                      총 투입 인원
                    </label>
                    <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <Users className="h-4 w-4" />
                      <span>{totalWorkerCount}명</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                      작성일시
                    </label>
                    <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <Clock className="h-4 w-4" />
                      <span>{new Date(report.created_at).toLocaleString('ko-KR')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {report.approved_by && (
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                        승인자
                      </label>
                      <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                        <CheckCircle className="h-4 w-4" />
                        <span>{report.approved_by_profile?.full_name || '-'}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                        승인일시
                      </label>
                      <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                        <Clock className="h-4 w-4" />
                        <span>{report.approved_at ? new Date(report.approved_at).toLocaleString('ko-KR') : '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Work Summary - 작업 내용 요약 (파트너사 스타일) */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-3 py-3 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                작업 내용 요약
              </h2>
            </div>
            <div className="px-3 py-3">
              {report.work_logs && report.work_logs.length > 0 ? (
                <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300">
                  <div className="space-y-3">
                    {report.work_logs.slice(0, 3).map((workLog, index) => (
                      <div key={workLog.id} className="border-l-4 border-blue-500 pl-4">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {workLog.work_type} - {workLog.location}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                          {workLog.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">투입 인원: {workLog.worker_count}명</p>
                      </div>
                    ))}
                    {report.work_logs.length > 3 && (
                      <p className="text-sm text-gray-500 italic">
                        외 {report.work_logs.length - 3}개 작업 항목...
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">작업 내용이 없습니다.</p>
              )}
            </div>
          </div>

        {/* Detailed Work Logs - 컴팩트 접기/펼치기 */}
        {report.work_logs && report.work_logs.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowDetailedWorkLogs(!showDetailedWorkLogs)}
              className="w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                  상세 작업 내역 ({report.work_logs.length}건)
                </h2>
                {showDetailedWorkLogs ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </div>
            </button>
            
            {showDetailedWorkLogs && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                <div className="space-y-2">
                  {report.work_logs.map((workLog, index) => (
                    <div key={workLog.id} className="border dark:border-gray-600 rounded-lg p-2.5 bg-gray-50 dark:bg-gray-700/50">
                      <div className="mb-1.5">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">작업 {index + 1}</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">작업 종류</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{workLog.work_type}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">작업 위치</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{workLog.location}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-gray-500 dark:text-gray-400">작업 내용</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{workLog.description}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">투입 인원</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{workLog.worker_count}명</p>
                        </div>
                      </div>

                      {workLog.work_log_materials && workLog.work_log_materials.length > 0 && (
                        <div className="col-span-2 mt-1.5 pt-1.5 border-t border-gray-300 dark:border-gray-600">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">사용 자재</p>
                          <div className="space-y-0.5">
                            {workLog.work_log_materials.map((material: any) => (
                              <div key={material.id} className="flex items-center justify-between text-xs">
                                <span className="text-gray-900 dark:text-gray-100">{material.material?.name}</span>
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  {material.quantity} {material.material?.unit}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Attendance Records - 컴팩트 접기/펼치기 */}
        {report.attendance_records && report.attendance_records.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowAttendanceDetails(!showAttendanceDetails)}
              className="w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                  출근 현황 ({report.attendance_records.length}명)
                </h2>
                {showAttendanceDetails ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </div>
            </button>
            
            {showAttendanceDetails && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-600">
                        <th className="text-left py-1.5 font-medium text-gray-500 dark:text-gray-400">작업자</th>
                        <th className="text-left py-1.5 font-medium text-gray-500 dark:text-gray-400">출근</th>
                        <th className="text-left py-1.5 font-medium text-gray-500 dark:text-gray-400">퇴근</th>
                        <th className="text-left py-1.5 font-medium text-gray-500 dark:text-gray-400">시간</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.attendance_records.map((record: any) => (
                        <tr key={record.id} className="border-b border-gray-100 dark:border-gray-600">
                          <td className="py-1.5 text-gray-900 dark:text-gray-100">{record.worker?.full_name}</td>
                          <td className="py-1.5 text-gray-900 dark:text-gray-100">{record.check_in_time || '-'}</td>
                          <td className="py-1.5 text-gray-900 dark:text-gray-100">{record.check_out_time || '-'}</td>
                          <td className="py-1.5 text-gray-900 dark:text-gray-100">
                            {record.work_hours ? `${record.work_hours.toFixed(1)}h` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notes & Issues - 컴팩트 카드 스타일 */}
        {((report as any).notes || attachments.length > 0) && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500 dark:text-orange-400" />
              특이사항 및 첨부파일
            </h2>
            <div>
              {(report as any).notes && (
                <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  <p className="whitespace-pre-wrap">
                    {(report as any).notes}
                  </p>
                </div>
              )}
              
              {attachments.length > 0 && (
                <div className={`${(report as any).notes ? 'mt-2 pt-2 border-t border-gray-200 dark:border-gray-700' : ''}`}>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">첨부파일</p>
                  <div className="space-y-1">
                    {attachments.map((attachment: any) => (
                      <div 
                        key={attachment.id} 
                        className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded"
                      >
                        <div className="flex items-center gap-2">
                          <Paperclip className="h-3.5 w-3.5 text-gray-500" />
                          <span className="text-xs text-gray-900 dark:text-gray-100">{attachment.file_name}</span>
                          <span className="text-xs text-gray-500">
                            ({Math.round(attachment.file_size / 1024)}KB)
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="compact"
                          onClick={() => window.open(attachment.file_path, '_blank')}
                          className="p-1"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {!(report as any).notes && attachments.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">특별한 사항이나 첨부파일이 없습니다.</p>
              )}
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Approval Dialog */}
      {showApprovalDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">작업일지 반려</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">반려 사유</label>
              <Textarea
                value={approvalComments}
                onChange={(e) => setApprovalComments(e.target.value)}
                placeholder="반려 사유를 입력하세요"
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowApprovalDialog(false)}
                disabled={loading}
              >
                취소
              </Button>
              <Button
                variant="danger"
                onClick={() => handleApproval(false)}
                disabled={loading || !approvalComments}
              >
                반려하기
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}