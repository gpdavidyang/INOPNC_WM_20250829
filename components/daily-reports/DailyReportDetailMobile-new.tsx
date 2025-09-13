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
  X,
  Share
} from 'lucide-react'
import { DailyReport, Profile } from '@/types'
import { showErrorNotification } from '@/lib/error-handling'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import PhotoViewerModal from './PhotoViewerModal'

interface DailyReportDetailMobileProps {
  report: DailyReport & {
    site?: any
    partner_company?: any
    created_by_profile?: any
    approved_by_profile?: any
    workers?: unknown[]
    workerAssignments?: unknown[]
    photoGroups?: unknown[]
    beforePhotos?: unknown[]
    afterPhotos?: unknown[]
    receipts?: unknown[]
    documents?: unknown[]
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
    partnerCompany: false,
    workers: false,
    beforePhotos: false,
    afterPhotos: false,
    receipts: false,
    requests: false,
    npc1000: false,
    issues: false
  })

  // Photo modal state
  const [photoModal, setPhotoModal] = useState<{
    isOpen: boolean
    photos: unknown[]
    initialIndex: number
    title: string
  }>({
    isOpen: false,
    photos: [],
    initialIndex: 0,
    title: ''
  })

  // Helper function to check if section has data
  const getSectionCompletionStatus = (sectionKey: string) => {
    switch (sectionKey) {
      case 'workContent':
        return report.member_name || report.component_name || report.process_type || report.work_process || report.work_section
      case 'partnerCompany':
        return !!report.partner_company
      case 'npc1000':
        return report.npc1000_incoming || report.npc1000_used || report.npc1000_remaining
      case 'workers':
        return (report.workers && report.workers.length > 0) || (report.workerAssignments && report.workerAssignments.length > 0)
      case 'beforePhotos':
        return report.beforePhotos && report.beforePhotos.length > 0
      case 'afterPhotos':
        return report.afterPhotos && report.afterPhotos.length > 0
      case 'receipts':
        return report.receipts && report.receipts.length > 0
      case 'requests':
        return !!report.hq_request
      case 'issues':
        return !!report.issues
      default:
        return false
    }
  }

  // Calculate completion percentage
  const totalSections = 9
  const completedSections = ['workContent', 'partnerCompany', 'npc1000', 'workers', 'beforePhotos', 'afterPhotos', 'receipts', 'requests', 'issues']
    .filter(key => getSectionCompletionStatus(key)).length
  const completionPercentage = Math.round((completedSections / totalSections) * 100)

  // Helper function to render section header with completion indicator
  const renderSectionHeader = (sectionKey: string, title: string, icon: any, isExpanded: boolean, badge?: string) => {
    const hasData = getSectionCompletionStatus(sectionKey)
    return (
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          {icon}
          {title}
          {badge && (
            <Badge variant="secondary" className="text-xs">
              {badge}
            </Badge>
          )}
          {hasData && (
            <div className="w-2 h-2 bg-green-500 rounded-full ml-1" title="완료됨" />
          )}
        </h2>
        <div className="flex items-center gap-2">
          {!hasData && (
            <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full" title="미완료" />
          )}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>
    )
  }

  const toggleSection = (section: string) => {
    // Add haptic feedback on mobile devices
    if ('vibrate' in navigator) {
      navigator.vibrate(50)
    }
    
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev]
    }))
  }

  // Add expand/collapse all functionality
  const expandAllSections = () => {
    setExpandedSections(prev => Object.keys(prev).reduce((acc, key) => ({
      ...acc,
      [key]: true
    }), {} as typeof prev))
  }

  const collapseAllSections = () => {
    setExpandedSections(prev => Object.keys(prev).reduce((acc, key) => ({
      ...acc,
      [key]: false
    }), {} as typeof prev))
  }

  // Photo modal handlers
  const openPhotoModal = (photos: unknown[], initialIndex: number, title: string) => {
    setPhotoModal({
      isOpen: true,
      photos,
      initialIndex,
      title
    })
  }

  const closePhotoModal = () => {
    setPhotoModal({
      isOpen: false,
      photos: [],
      initialIndex: 0,
      title: ''
    })
  }

  // Data export functionality
  const exportToJSON = () => {
    const exportData = {
      작업일지: {
        작업일자: report.work_date,
        현장명: report.site?.name,
        상태: report.status
      },
      작업내용: {
        부재명: report.member_name || report.component_name,
        작업공정: report.process_type || report.work_process,
        작업구간: report.work_section
      },
      파트너사정보: report.partner_company ? {
        업체명: report.partner_company.company_name,
        업체유형: report.partner_company.company_type,
        상태: report.partner_company.status
      } : null,
      NPC1000자재현황: {
        입고량: report.npc1000_incoming || 0,
        사용량: report.npc1000_used || 0,
        잔량: report.npc1000_remaining || 0
      },
      작업자정보: {
        기본작업자: report.workers || [],
        상세배정: report.workerAssignments || []
      },
      사진정보: {
        작업전사진: report.beforePhotos || [],
        작업후사진: report.afterPhotos || []
      },
      영수증정보: report.receipts || [],
      본사요청사항: report.hq_request,
      특이사항: report.issues,
      내보내기시간: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `작업일지_${report.work_date}_${report.site?.name || 'unknown'}.json`
    document.body.appendChild(a)
    a.click()
    URL.revokeObjectURL(url)
    document.body.removeChild(a)
    
    toast.success('작업일지 데이터가 JSON 파일로 내보내기 되었습니다')
  }

  const shareReport = async () => {
    const shareData = {
      title: `작업일지 - ${report.site?.name || '현장'} (${report.work_date})`,
      text: `작업일지 상세 정보\n현장: ${report.site?.name}\n작업일: ${report.work_date}\n완성도: ${completionPercentage}%`,
      url: window.location.href
    }

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData)
        toast.success('작업일지가 공유되었습니다')
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Share failed:', error)
          fallbackCopyToClipboard(shareData.url)
        }
      }
    } else {
      fallbackCopyToClipboard(shareData.url)
    }
  }

  const fallbackCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('링크가 클립보드에 복사되었습니다')
    }).catch(() => {
      toast.error('링크 복사에 실패했습니다')
    })
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
            <Button
              variant="outline"
              size="compact"
              onClick={shareReport}
              className="touch-manipulation text-xs p-1.5"
              title="공유하기"
            >
              <Share className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="compact"
              onClick={exportToJSON}
              className="touch-manipulation text-xs p-1.5"
              title="JSON으로 내보내기"
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
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

        {/* Progress Completion Indicator */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              작업일지 완성도
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {completionPercentage}%
              </span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm" 
                  onClick={expandAllSections}
                  className="h-6 px-2 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                >
                  모두 열기
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={collapseAllSections}
                  className="h-6 px-2 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                >
                  모두 접기
                </Button>
              </div>
            </div>
          </div>
          <div className="w-full bg-blue-200 dark:bg-blue-900/50 rounded-full h-2 mb-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <div className="flex justify-between items-center">
            <div className="text-xs text-blue-700 dark:text-blue-300">
              {completedSections}/{totalSections} 섹션 완료
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400">
              {completionPercentage >= 100 ? '✅ 완료' : completionPercentage >= 80 ? '🔥 거의완료' : completionPercentage >= 50 ? '⚡ 진행중' : '📝 시작'}
            </div>
          </div>
        </div>

        {/* 1. 작업 내용 - 부재명, 작업공정, 작업구간 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-md">
          <button
            onClick={() => toggleSection('workContent')}
            className="w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 rounded-lg active:scale-[0.98]"
          >
            {renderSectionHeader('workContent', '작업 내용', <FileText className="h-4 w-4 text-blue-500 dark:text-blue-400" />, expandedSections.workContent)}
          </button>
          {expandedSections.workContent && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 animate-in slide-in-from-top-2 duration-300">
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

        {/* 2. 파트너사 정보 */}
        {report.partner_company && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => toggleSection('partnerCompany')}
              className="w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {renderSectionHeader('partnerCompany', '파트너사 정보', <Building2 className="h-4 w-4 text-green-500 dark:text-green-400" />, expandedSections.partnerCompany)}
            </button>
            {expandedSections.partnerCompany && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">
                      업체명
                    </label>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {report.partner_company.company_name || '-'}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">
                      업체 유형
                    </label>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      <Badge variant={report.partner_company.company_type === 'main_contractor' ? 'default' : 'secondary'} className="text-xs">
                        {report.partner_company.company_type === 'main_contractor' ? '원청업체' : 
                         report.partner_company.company_type === 'subcontractor' ? '하청업체' : '기타업체'}
                      </Badge>
                    </div>
                  </div>
                  {report.partner_company.status && (
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">
                        상태
                      </label>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        <Badge variant={report.partner_company.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                          {report.partner_company.status === 'active' ? '활성' : '비활성'}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. NPC-1000 자재 현황 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => toggleSection('npc1000')}
            className="w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {renderSectionHeader('npc1000', 'NPC-1000 자재 현황', <Package className="h-4 w-4 text-orange-500 dark:text-orange-400" />, expandedSections.npc1000)}
          </button>
          {expandedSections.npc1000 && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">
                    입고량
                  </label>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {report.npc1000_incoming || 0} EA
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">
                    사용량
                  </label>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {report.npc1000_used || 0} EA
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">
                    잔량
                  </label>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {report.npc1000_remaining || 0} EA
                  </div>
                </div>
              </div>
              {(report.npc1000_incoming || report.npc1000_used || report.npc1000_remaining) ? (
                <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">총 계산:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      입고 {report.npc1000_incoming || 0} - 사용 {report.npc1000_used || 0} = 잔량 {(report.npc1000_incoming || 0) - (report.npc1000_used || 0)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center">
                  NPC-1000 자재 정보가 없습니다
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4. 작업자 정보 */}
        {((report.workers && report.workers.length > 0) || (report.workerAssignments && report.workerAssignments.length > 0)) && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => toggleSection('workers')}
              className="w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {renderSectionHeader('workers', '작업자 정보', <Users className="h-4 w-4 text-blue-500 dark:text-blue-400" />, expandedSections.workers, `${(report.workers?.length || 0) + (report.workerAssignments?.length || 0)}명`)}
            </button>
            {expandedSections.workers && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                <div className="space-y-3">
                  {/* Worker Assignments with Profile Details */}
                  {report.workerAssignments && report.workerAssignments.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wider">
                        상세 작업자 배정
                      </h3>
                      <div className="space-y-2">
                        {report.workerAssignments.map((assignment: any, index: number) => (
                          <div key={assignment.id || index} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    {assignment.profile?.full_name || '이름 없음'}
                                  </span>
                                  {assignment.profile?.role && (
                                    <Badge variant="outline" className="text-xs">
                                      {assignment.profile.role === 'worker' ? '작업자' : 
                                       assignment.profile.role === 'site_manager' ? '현장관리자' : assignment.profile.role}
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                  {assignment.profile?.email && (
                                    <div>이메일: {assignment.profile.email}</div>
                                  )}
                                  {assignment.profile?.phone && (
                                    <div>연락처: {assignment.profile.phone}</div>
                                  )}
                                  {assignment.assigned_at && (
                                    <div>배정일시: {format(new Date(assignment.assigned_at), 'MM/dd HH:mm', { locale: ko })}</div>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                  {assignment.labor_hours || 0} 공수
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {(assignment.labor_hours || 0) * 8}시간
                                </div>
                              </div>
                            </div>
                            {assignment.notes && (
                              <div className="mt-2 p-2 bg-white dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-400">
                                <strong>참고사항:</strong> {assignment.notes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Basic Worker Information */}
                  {report.workers && report.workers.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wider">
                        기본 작업자 정보
                      </h3>
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
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">총 작업시간:</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {((report.workers?.reduce((sum: number, w: any) => sum + (w.work_hours || 0), 0) || 0) + 
                           (report.workerAssignments?.reduce((sum: number, a: any) => sum + ((a.labor_hours || 0) * 8), 0) || 0))}시간
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">총 공수:</span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {((report.workers?.reduce((sum: number, w: any) => sum + (w.work_hours || 0), 0) || 0) / 8 + 
                           (report.workerAssignments?.reduce((sum: number, a: any) => sum + (a.labor_hours || 0), 0) || 0)).toFixed(2)} 공수
                        </span>
                      </div>
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
              {renderSectionHeader('beforePhotos', '작업 전 사진', <Camera className="h-4 w-4 text-blue-500 dark:text-blue-400" />, expandedSections.beforePhotos, `${report.beforePhotos.length}장`)}
            </button>
            {expandedSections.beforePhotos && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-3 gap-2">
                  {report.beforePhotos.map((photo: any, index: number) => (
                    <button
                      key={photo.id || index}
                      onClick={() => openPhotoModal(report.beforePhotos, index, '작업 전 사진')}
                      className="relative group cursor-pointer hover:scale-105 transition-transform duration-200 active:scale-95"
                    >
                      <img
                        src={photo.file_url || photo.file_path}
                        alt={`작업 전 사진 ${index + 1}`}
                        className="w-full h-24 object-cover rounded border border-gray-200 dark:border-gray-600 group-hover:border-blue-400"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 rounded" />
                      <div className="absolute top-1 right-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {index + 1}/{report.beforePhotos.length}
                      </div>
                      {photo.description && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-1 rounded-b">
                          <p className="text-xs text-white truncate">{photo.description}</p>
                        </div>
                      )}
                    </button>
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
              {renderSectionHeader('afterPhotos', '작업 후 사진', <Camera className="h-4 w-4 text-blue-500 dark:text-blue-400" />, expandedSections.afterPhotos, `${report.afterPhotos.length}장`)}
            </button>
            {expandedSections.afterPhotos && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-3 gap-2">
                  {report.afterPhotos.map((photo: any, index: number) => (
                    <button
                      key={photo.id || index}
                      onClick={() => openPhotoModal(report.afterPhotos, index, '작업 후 사진')}
                      className="relative group cursor-pointer hover:scale-105 transition-transform duration-200 active:scale-95"
                    >
                      <img
                        src={photo.file_url || photo.file_path}
                        alt={`작업 후 사진 ${index + 1}`}
                        className="w-full h-24 object-cover rounded border border-gray-200 dark:border-gray-600 group-hover:border-blue-400"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 rounded" />
                      <div className="absolute top-1 right-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {index + 1}/{report.afterPhotos.length}
                      </div>
                      {photo.description && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-1 rounded-b">
                          <p className="text-xs text-white truncate">{photo.description}</p>
                        </div>
                      )}
                    </button>
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
              {renderSectionHeader('receipts', '영수증 정보', <Receipt className="h-4 w-4 text-blue-500 dark:text-blue-400" />, expandedSections.receipts, `${report.receipts.length}건`)}
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

        {/* 8. 본사 요청사항 */}
        {report.hq_request && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => toggleSection('requests')}
              className="w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {renderSectionHeader('requests', '본사 요청사항', <MessageSquare className="h-4 w-4 text-blue-500 dark:text-blue-400" />, expandedSections.requests)}
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

        {/* 9. 특이 사항 */}
        {report.issues && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => toggleSection('issues')}
              className="w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {renderSectionHeader('issues', '특이 사항', <AlertTriangle className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />, expandedSections.issues)}
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

      {/* Photo Viewer Modal */}
      <PhotoViewerModal
        photos={photoModal.photos}
        initialIndex={photoModal.initialIndex}
        isOpen={photoModal.isOpen}
        onClose={closePhotoModal}
        title={photoModal.title}
      />
    </div>
  )
}