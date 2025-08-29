'use client'

import { useState, useEffect } from 'react'
import { Plus, Eye, Edit, Trash2, FileText, Download } from 'lucide-react'
import { getDailyReports } from '@/lib/supabase/daily-reports'
import { getPhotoGridReports, trackPhotoGridReportDownload } from '@/lib/supabase/photo-grid-reports'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import type { PhotoGridReport } from '@/types'

interface DailyReportListProps {
  siteId?: string
  canCreate?: boolean
}

export default function DailyReportList({ siteId, canCreate = false }: DailyReportListProps) {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [photoGridReports, setPhotoGridReports] = useState<Record<string, PhotoGridReport[]>>({})

  useEffect(() => {
    loadReports()
  }, [siteId])

  const loadReports = async () => {
    try {
      setLoading(true)
      const data = await getDailyReports(siteId)
      setReports(data || [])
      
      // 각 작업일지의 PDF 보고서 조회
      if (data && data.length > 0) {
        const pdfReportsMap: Record<string, PhotoGridReport[]> = {}
        
        await Promise.all(
          data.map(async (report: any) => {
            const pdfReports = await getPhotoGridReports({ 
              dailyReportId: report.id,
              status: 'active'
            })
            pdfReportsMap[report.id] = pdfReports
          })
        )
        
        setPhotoGridReports(pdfReportsMap)
      }
    } catch (err) {
      setError('작업일지를 불러오는데 실패했습니다.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { label: '작성중', className: 'bg-gray-100 text-gray-800' },
      submitted: { label: '제출됨', className: 'bg-blue-100 text-blue-800' },
      completed: { label: '완료', className: 'bg-green-100 text-green-800' }
    }
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.draft
    
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    )
  }

  // PDF 다운로드 핸들러
  const handleDownloadPDF = async (report: PhotoGridReport) => {
    try {
      // 다운로드 추적
      await trackPhotoGridReportDownload(report.id)
      
      // 파일 다운로드
      const link = document.createElement('a')
      link.href = report.file_url
      link.download = report.file_name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // 다운로드 카운트 업데이트를 위해 목록 새로고침
      loadReports()
    } catch (error) {
      console.error('PDF 다운로드 오류:', error)
    }
  }

  // PDF 상태 표시 컴포넌트
  const PDFStatus = ({ dailyReportId }: { dailyReportId: string }) => {
    const pdfReports = photoGridReports[dailyReportId] || []
    
    if (pdfReports.length === 0) {
      return (
        <div className="flex items-center text-gray-400" title="PDF 없음">
          <FileText className="h-4 w-4" />
        </div>
      )
    }
    
    return (
      <div className="flex items-center gap-1" title={`PDF ${pdfReports.length}개`}>
        <div className="flex items-center text-blue-600">
          <FileText className="h-4 w-4" />
          <span className="ml-1 text-xs font-medium">{pdfReports.length}</span>
        </div>
        <div className="flex gap-1">
          {pdfReports.slice(0, 2).map((report) => (
            <button
              key={report.id}
              onClick={() => handleDownloadPDF(report)}
              className="text-gray-400 hover:text-blue-600 transition-colors"
              title={`${report.title} 다운로드`}
            >
              <Download className="h-3 w-3" />
            </button>
          ))}
          {pdfReports.length > 2 && (
            <span className="text-xs text-gray-500">+{pdfReports.length - 2}</span>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    )
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          작업일지 목록
        </h3>
        {canCreate && (
          <Link
            href="/dashboard/daily-reports/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="mr-2 h-4 w-4" />
            새 작업일지
          </Link>
        )}
      </div>
      
      {reports.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">작업일지가 없습니다.</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {reports.map((report: any) => (
            <li key={report.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-indigo-600 truncate">
                        {formatDate(report.report_date)}
                      </p>
                      {getStatusBadge(report.status)}
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          현장: {report.site?.name}
                        </p>
                        <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                          작성자: {report.created_by_profile?.full_name}
                        </p>
                      </div>
                      <div className="mt-2 sm:mt-0">
                        <PDFStatus dailyReportId={report.id} />
                      </div>
                    </div>
                    {report.work_content && (
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                        {report.work_content}
                      </p>
                    )}
                  </div>
                  
                  <div className="ml-4 flex items-center space-x-2">
                    {/* PDF 빠른 다운로드 */}
                    {photoGridReports[report.id]?.length > 0 && (
                      <div className="flex items-center space-x-1">
                        {photoGridReports[report.id].slice(0, 1).map((pdfReport) => (
                          <button
                            key={pdfReport.id}
                            onClick={() => handleDownloadPDF(pdfReport)}
                            className="text-blue-400 hover:text-blue-600"
                            title="최신 PDF 다운로드"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        ))}
                      </div>
                    )}
                    
                    <Link
                      href={`/dashboard/daily-reports/${report.id}`}
                      className="text-gray-400 hover:text-gray-500"
                      title="상세보기"
                    >
                      <Eye className="h-5 w-5" />
                    </Link>
                    {report.status === 'draft' && (
                      <>
                        <Link
                          href={`/dashboard/daily-reports/${report.id}/edit`}
                          className="text-gray-400 hover:text-gray-500"
                          title="편집"
                        >
                          <Edit className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => {
                            if (confirm('정말 삭제하시겠습니까?')) {
                              // TODO: Implement delete
                            }
                          }}
                          className="text-gray-400 hover:text-red-500"
                          title="삭제"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}