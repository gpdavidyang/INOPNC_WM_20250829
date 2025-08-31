'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getDailyReportById } from '@/app/actions/admin/daily-reports'
import DailyReportDetailModal from '@/components/admin/daily-reports/DailyReportDetailModal'
import { ArrowLeft, Calendar, Building2, User, Users, Package, FileText, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

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
  const params = useParams()
  const router = useRouter()
  const reportId = params.id as string
  
  const [report, setReport] = useState<DailyReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchReport()
  }, [reportId])

  const fetchReport = async () => {
    try {
      setLoading(true)
      const result = await getDailyReportById(reportId)
      
      if (result.success && result.data) {
        setReport(result.data)
      } else {
        setError(result.error || '작업일지를 불러올 수 없습니다.')
      }
    } catch (err) {
      console.error('Error fetching report:', err)
      setError('작업일지를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleReportUpdated = () => {
    fetchReport()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">작업일지를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-800 font-medium mb-2">작업일지를 찾을 수 없습니다</p>
          <p className="text-gray-600 text-sm mb-4">{error}</p>
          <button
            onClick={() => router.push('/dashboard/admin/daily-reports')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    submitted: 'bg-blue-100 text-blue-800'
  }

  const statusLabels = {
    draft: '임시저장',
    submitted: '제출됨'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard/admin/daily-reports')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">작업일지 상세</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {format(new Date(report.work_date), 'yyyy년 MM월 dd일 (EEEE)', { locale: ko })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusColors[report.status]}`}>
                {statusLabels[report.status]}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Site Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">현장 정보</h2>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">현장명:</span>
                  <p className="font-medium text-gray-900">{report.sites?.name || '알 수 없는 현장'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">주소:</span>
                  <p className="text-gray-900">{report.sites?.address || '-'}</p>
                </div>
                {(report.sites?.manager_name || report.sites?.safety_manager_name) && (
                  <div>
                    <span className="text-sm text-gray-600">담당자:</span>
                    <p className="text-gray-900">
                      {report.sites?.manager_name && `공사: ${report.sites.manager_name}`}
                      {report.sites?.manager_name && report.sites?.safety_manager_name && ' / '}
                      {report.sites?.safety_manager_name && `안전: ${report.sites.safety_manager_name}`}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Work Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">작업 정보</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">작업책임자:</span>
                  <p className="font-medium text-gray-900">{report.member_name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">공정:</span>
                  <p className="font-medium text-gray-900">{report.process_type}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">부재명:</span>
                  <p className="font-medium text-gray-900">{report.component_name || '-'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">작업공정:</span>
                  <p className="font-medium text-gray-900">{report.work_process || '-'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">작업구간:</span>
                  <p className="font-medium text-gray-900">{report.work_section || '-'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">작업인원:</span>
                  <p className="font-medium text-gray-900">{report.total_workers}명</p>
                </div>
              </div>
            </div>

            {/* Material Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">자재 현황</h2>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">입고</p>
                  <p className="text-2xl font-bold text-blue-600">{report.npc1000_incoming}</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">사용</p>
                  <p className="text-2xl font-bold text-orange-600">{report.npc1000_used}</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">잔여</p>
                  <p className="text-2xl font-bold text-green-600">{report.npc1000_remaining}</p>
                </div>
              </div>
            </div>

            {/* Issues */}
            {report.issues && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="h-5 w-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">특이사항</h2>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{report.issues}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Meta Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">작성 정보</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">작성자:</span>
                  <p className="text-sm font-medium text-gray-900">
                    {report.profiles?.full_name || '알 수 없음'}
                  </p>
                </div>
                {report.profiles?.role && (
                  <div>
                    <span className="text-sm text-gray-600">역할:</span>
                    <p className="text-sm font-medium text-gray-900">
                      {report.profiles.role === 'admin' ? '관리자' : 
                       report.profiles.role === 'site_manager' ? '현장담당' :
                       report.profiles.role === 'worker' ? '작업자' : report.profiles.role}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-sm text-gray-600">작성일시:</span>
                  <p className="text-sm font-medium text-gray-900">
                    {format(new Date(report.created_at), 'yyyy.MM.dd HH:mm', { locale: ko })}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">수정일시:</span>
                  <p className="text-sm font-medium text-gray-900">
                    {format(new Date(report.updated_at), 'yyyy.MM.dd HH:mm', { locale: ko })}
                  </p>
                </div>
              </div>
            </div>

            {/* Related Data */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">관련 데이터</h3>
              <div className="space-y-3">
                {report.daily_documents_count > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">첨부 문서</span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                      {report.daily_documents_count}개
                    </span>
                  </div>
                )}
                {report.worker_details_count > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">작업자 상세</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      {report.worker_details_count}명
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={() => router.push(`/dashboard/admin/daily-reports/${report.id}/edit`)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                수정하기
              </button>
              <button
                onClick={() => router.push('/dashboard/admin/daily-reports')}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                목록으로
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}