'use client'

import { useState } from 'react'
import { ArrowLeft, FileText, Users, Wrench, Package, Clock, CheckCircle } from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/utils'
import Link from 'next/link'
import { submitDailyReport, approveDailyReport } from '@/lib/supabase/daily-reports'
import { useRouter } from 'next/navigation'
import PhotoGridReportSection from './photo-grid-report-section'
import type { PhotoGroup } from '@/types'

interface DailyReportDetailProps {
  report: any
  photoGroups?: PhotoGroup[] // 사진 그룹 데이터 (사진대지 PDF 생성용)
  canManage?: boolean // PDF 편집/삭제 권한
}

export default function DailyReportDetail({ report, photoGroups = [], canManage = false }: DailyReportDetailProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { label: '작성중', className: 'bg-gray-100 text-gray-800' },
      submitted: { label: '제출됨', className: 'bg-blue-100 text-blue-800' },
      approved: { label: '승인됨', className: 'bg-green-100 text-green-800' },
      rejected: { label: '반려됨', className: 'bg-red-100 text-red-800' }
    }
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.draft
    
    return (
      <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    )
  }

  const handleSubmit = async () => {
    if (!confirm('작업일지를 제출하시겠습니까?')) return
    
    try {
      setLoading(true)
      await submitDailyReport(report.id)
      router.refresh()
    } catch (error) {
      console.error('Error submitting report:', error)
      alert('제출에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!confirm('작업일지를 승인하시겠습니까?')) return
    
    try {
      setLoading(true)
      // TODO: Get current user ID
      await approveDailyReport(report.id, 'current-user-id')
      router.refresh()
    } catch (error) {
      console.error('Error approving report:', error)
      alert('승인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          대시보드로 돌아가기
        </Link>
        
        <div className="mt-4 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {formatDate(report.work_date)} 작업일지
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              현장: {report.sites?.name} • 작성자: {report.profiles?.full_name}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {getStatusBadge(report.status)}
            {report.status === 'draft' && (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                제출하기
              </button>
            )}
            {report.status === 'submitted' && (
              <button
                onClick={handleApprove}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                승인하기
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Work content */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                <FileText className="inline-block mr-2 h-5 w-5 text-gray-400" />
                작업 내용
              </h3>
            </div>
            <div className="border-t border-gray-200">
              <div className="px-4 py-5 sm:p-6">
                <div className="whitespace-pre-wrap text-gray-700">
                  {report.work_content || '작업 내용이 없습니다.'}
                </div>
              </div>
            </div>
          </div>

          {/* Workers */}
          {report.daily_report_workers && report.daily_report_workers.length > 0 && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  <Users className="inline-block mr-2 h-5 w-5 text-gray-400" />
                  작업 인원
                </h3>
              </div>
              <div className="border-t border-gray-200">
                <ul className="divide-y divide-gray-200">
                  {report.daily_report_workers.map((worker: any) => (
                    <li key={worker.id} className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {worker.profiles?.full_name}
                          </p>
                          <p className="text-sm text-gray-500">{worker.role}</p>
                        </div>
                        <div className="text-sm text-gray-500">
                          {worker.start_time} - {worker.end_time}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Equipment */}
          {report.daily_report_equipment && report.daily_report_equipment.length > 0 && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  <Wrench className="inline-block mr-2 h-5 w-5 text-gray-400" />
                  장비 사용
                </h3>
              </div>
              <div className="border-t border-gray-200">
                <ul className="divide-y divide-gray-200">
                  {report.daily_report_equipment.map((item: any) => (
                    <li key={item.id} className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {item.equipment?.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {item.equipment?.type} • {item.equipment?.model}
                          </p>
                        </div>
                        <div className="text-sm text-gray-500">
                          수량: {item.quantity}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Materials */}
          {report.daily_report_materials && report.daily_report_materials.length > 0 && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  <Package className="inline-block mr-2 h-5 w-5 text-gray-400" />
                  자재 사용
                </h3>
              </div>
              <div className="border-t border-gray-200">
                <ul className="divide-y divide-gray-200">
                  {report.daily_report_materials.map((item: any) => (
                    <li key={item.id} className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {item.materials?.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {item.materials?.specification}
                          </p>
                        </div>
                        <div className="text-sm text-gray-500">
                          <p>사용: {item.quantity_used} {item.materials?.unit}</p>
                          {item.quantity_delivered > 0 && (
                            <p>입고: {item.quantity_delivered} {item.materials?.unit}</p>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* PDF 보고서 관리 섹션 */}
          <PhotoGridReportSection
            dailyReportId={report.id}
            photoGroups={photoGroups}
            siteName={report.site?.name}
            reportDate={report.work_date}
            reporterName={report.created_by_profile?.full_name}
            canManage={canManage}
          />
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Status timeline */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                <Clock className="inline-block mr-2 h-5 w-5 text-gray-400" />
                상태 이력
              </h3>
            </div>
            <div className="border-t border-gray-200">
              <div className="px-4 py-5 sm:px-6">
                <div className="flow-root">
                  <ul className="-mb-8">
                    <li>
                      <div className="relative pb-8">
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-gray-400 flex items-center justify-center">
                              <FileText className="h-4 w-4 text-white" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-gray-500">
                              작성됨
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatDateTime(report.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </li>
                    {report.submitted_at && (
                      <li>
                        <div className="relative pb-8">
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                                <CheckCircle className="h-4 w-4 text-white" />
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-gray-500">
                                제출됨
                              </p>
                              <p className="text-xs text-gray-400">
                                {formatDateTime(report.submitted_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </li>
                    )}
                    {report.approved_at && (
                      <li>
                        <div className="relative">
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                                <CheckCircle className="h-4 w-4 text-white" />
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-gray-500">
                                승인됨
                              </p>
                              <p className="text-xs text-gray-400">
                                {formatDateTime(report.approved_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Additional info */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                추가 정보
              </h3>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">날씨</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {report.weather || '-'}
                  </dd>
                </div>
                <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">온도</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {report.temperature ? `${report.temperature}°C` : '-'}
                  </dd>
                </div>
                <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">특이사항</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {report.special_notes || '-'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}