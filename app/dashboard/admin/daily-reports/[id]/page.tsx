'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft, Edit, FileText, Users, Calendar, Building2, 
  AlertTriangle, Camera, Paperclip, Receipt, Map, User,
  MapPin, Phone, HardHat, Shield, Clock, Hash, Layers,
  Package, CheckCircle, XCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import PhotosTab from '@/components/admin/daily-reports/PhotosTab'
import AttachmentsTab from '@/components/admin/daily-reports/AttachmentsTab'
import WorkersTab from '@/components/admin/daily-reports/WorkersTab'
import MarkupTab from '@/components/admin/daily-reports/MarkupTab'
import ReceiptsTab from '@/components/admin/daily-reports/ReceiptsTab'
import { getDailyReportById } from '@/app/actions/admin/daily-reports'

interface DailyReport {
  id: string
  work_date: string
  member_name: string
  process_type: string
  component_name?: string
  work_process?: string
  work_section?: string
  total_workers: number
  npc1000_incoming: number
  npc1000_used: number
  npc1000_remaining: number
  issues: string
  status: 'draft' | 'submitted'
  created_at: string
  updated_at: string
  created_by: string
  site_id: string
  sites?: {
    name: string
    address: string
    work_process?: string
    work_section?: string
    component_name?: string
    manager_name?: string
    safety_manager_name?: string
    contact?: string
  }
  profiles?: {
    full_name: string
    email: string
    phone?: string
    role?: string
  }
  worker_details_count?: number
  daily_documents_count?: number
}

export default function DailyReportDetailPage() {
  const router = useRouter()
  const params = useParams()
  const reportId = params?.id as string
  
  const [report, setReport] = useState<DailyReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (reportId) {
      fetchReport()
    }
  }, [reportId])

  const fetchReport = async () => {
    try {
      const result = await getDailyReportById(reportId)
      if (result.success && result.data) {
        setReport(result.data)
      } else {
        console.error('Error fetching report:', result.error)
        alert('작업일지를 불러올 수 없습니다.')
        router.push('/dashboard/admin/daily-reports')
      }
    } catch (error) {
      console.error('Error fetching report:', error)
      alert('작업일지를 불러올 수 없습니다.')
      router.push('/dashboard/admin/daily-reports')
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-gray-600 mb-4">작업일지를 찾을 수 없습니다.</p>
          <button
            onClick={() => router.push('/dashboard/admin/daily-reports')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  const statusLabels = {
    draft: '임시저장',
    submitted: '제출됨'
  }

  const statusColors = {
    draft: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    submitted: 'bg-green-100 text-green-800 border-green-300'
  }

  const tabs = [
    { id: 'overview', label: '작업일지 정보', icon: FileText },
    { id: 'workers', label: '작업자 관리 (5명)', icon: Users, count: report.worker_details_count },
    { id: 'photos', label: '사진 (0)', icon: Camera },
    { id: 'attachments', label: '첨부파일 (0)', icon: Paperclip },
    { id: 'markup', label: '도면마킹 (0)', icon: Map },
    { id: 'receipts', label: '영수증정보 (0)', icon: Receipt }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard/admin/daily-reports')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-gray-900">작업일지 상세보기</h1>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${statusColors[report.status]}`}>
                    {statusLabels[report.status]}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {format(new Date(report.work_date), 'yyyy년 MM월 dd일 (EEEE)', { locale: ko })}
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push(`/dashboard/admin/daily-reports/${reportId}/edit`)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="h-4 w-4" />
              편집
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const label = tab.id === 'workers' && tab.count 
                ? `작업자 관리 (${tab.count}명)`
                : tab.label
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-6 py-6">
        {activeTab === 'overview' && (
          <div className="max-w-6xl mx-auto space-y-6">
            {/* 현장 정보 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                <Building2 className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">현장 정보</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6">
                <div>
                  <label className="text-sm text-gray-600">현장명</label>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {report.sites?.name || '알 수 없는 현장'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">주소</label>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {report.sites?.address || '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">공사담당</label>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {report.sites?.manager_name || '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">안전담당</label>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {report.sites?.safety_manager_name || '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* 작업 정보 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                <Layers className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">작업 정보</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                <div>
                  <label className="text-sm text-gray-600">작업일</label>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {format(new Date(report.work_date), 'yyyy년 MM월 dd일 (EEEE)', { locale: ko })}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">작업책임자</label>
                  <p className="mt-1 text-sm font-medium text-gray-900">{report.member_name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">작업공정</label>
                  <p className="mt-1 text-sm font-medium text-gray-900">{report.process_type}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">부재명</label>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {report.component_name || '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">작업구간</label>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {report.work_section || '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">작업인원</label>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    총 {report.total_workers}명
                    {report.worker_details_count && report.worker_details_count > 0 && (
                      <span className="text-xs text-blue-600 ml-1">
                        (상세: {report.worker_details_count}명)
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* 자재 현황 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                <Package className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">자재 현황 (NPC-1000)</h2>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-blue-600 font-medium mb-2">입고</p>
                  <p className="text-3xl font-bold text-blue-700">{report.npc1000_incoming}</p>
                  <p className="text-xs text-blue-500 mt-1">개</p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-orange-600 font-medium mb-2">사용</p>
                  <p className="text-3xl font-bold text-orange-700">{report.npc1000_used}</p>
                  <p className="text-xs text-orange-500 mt-1">개</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-green-600 font-medium mb-2">잔여</p>
                  <p className="text-3xl font-bold text-green-700">{report.npc1000_remaining}</p>
                  <p className="text-xs text-green-500 mt-1">개</p>
                </div>
              </div>
            </div>

            {/* 특이사항 */}
            {report.issues && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <h2 className="text-lg font-semibold text-gray-900">특이사항</h2>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{report.issues}</p>
                </div>
              </div>
            )}

            {/* 작성 정보 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                <User className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">작성 정보</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                <div>
                  <label className="text-sm text-gray-600">작성자</label>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {report.profiles?.full_name || '알 수 없음'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">이메일</label>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {report.profiles?.email || '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">역할</label>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {report.profiles?.role === 'admin' ? '관리자' : 
                     report.profiles?.role === 'site_manager' ? '현장담당' :
                     report.profiles?.role === 'worker' ? '작업자' : 
                     report.profiles?.role || '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">작성일시</label>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {format(new Date(report.created_at), 'yyyy-MM-dd HH:mm:ss', { locale: ko })}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">최종 수정일시</label>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {format(new Date(report.updated_at), 'yyyy-MM-dd HH:mm:ss', { locale: ko })}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">상태</label>
                  <p className="mt-1">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[report.status]}`}>
                      {statusLabels[report.status]}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => router.push('/dashboard/admin/daily-reports')}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                목록으로
              </button>
              <button
                onClick={() => router.push(`/dashboard/admin/daily-reports/${reportId}/edit`)}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                수정하기
              </button>
            </div>
          </div>
        )}

        {activeTab === 'workers' && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <WorkersTab reportId={reportId} isEditing={false} />
            </div>
          </div>
        )}

        {activeTab === 'photos' && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <PhotosTab reportId={reportId} isEditing={false} />
            </div>
          </div>
        )}

        {activeTab === 'attachments' && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <AttachmentsTab reportId={reportId} isEditing={false} />
            </div>
          </div>
        )}

        {activeTab === 'markup' && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <MarkupTab reportId={reportId} isEditing={false} reportData={report} />
            </div>
          </div>
        )}

        {activeTab === 'receipts' && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <ReceiptsTab reportId={reportId} isEditing={false} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}