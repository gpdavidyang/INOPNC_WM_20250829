'use client'

import type { PhotoGridReport, PhotoGroup } from '@/types'

interface PhotoGridReportSectionProps {
  dailyReportId: string
  photoGroups: PhotoGroup[]
  siteName?: string
  reportDate?: string
  reporterName?: string
  canManage?: boolean // 편집/삭제 권한
}

export default function PhotoGridReportSection({
  dailyReportId,
  photoGroups,
  siteName,
  reportDate,
  reporterName,
  canManage = false
}: PhotoGridReportSectionProps) {
  const [pdfReports, setPdfReports] = useState<PhotoGridReport[]>([])
  const [loading, setLoading] = useState(true)
  const [showGenerator, setShowGenerator] = useState(false)
  const [selectedReport, setSelectedReport] = useState<PhotoGridReport | null>(null)

  useEffect(() => {
    loadPdfReports()
  }, [dailyReportId])

  const loadPdfReports = async () => {
    try {
      setLoading(true)
      const reports = await getPhotoGridReports({ 
        dailyReportId,
        status: 'active'
      })
      setPdfReports(reports)
    } catch (error) {
      console.error('PDF 보고서 로딩 오류:', error)
    } finally {
      setLoading(false)
    }
  }

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
      
      // 목록 새로고침으로 다운로드 카운트 업데이트
      loadPdfReports()
    } catch (error) {
      console.error('PDF 다운로드 오류:', error)
    }
  }

  const handleDeletePDF = async (report: PhotoGridReport) => {
    if (!canManage) return
    
    if (!confirm(`"${report.title}" PDF를 삭제하시겠습니까?`)) return
    
    try {
      const result = await deletePhotoGridReport(report.id)
      if (result.success) {
        loadPdfReports() // 목록 새로고침
      } else {
        alert('PDF 삭제에 실패했습니다: ' + result.error)
      }
    } catch (error) {
      console.error('PDF 삭제 오류:', error)
      alert('PDF 삭제 중 오류가 발생했습니다.')
    }
  }

  const handleGenerationComplete = (pdfUrl: string, reportId?: string) => {
    setShowGenerator(false)
    loadPdfReports() // 목록 새로고침
    
    if (reportId) {
      // 생성된 PDF 자동 다운로드 (선택사항)
      // const link = document.createElement('a')
      // link.href = pdfUrl
      // link.download = `사진대지양식_${siteName || '현장'}.pdf`
      // document.body.appendChild(link)
      // link.click()
      // document.body.removeChild(link)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">
              사진대지 PDF 보고서
            </h3>
            {pdfReports.length > 0 && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {pdfReports.length}개
              </span>
            )}
          </div>
          
          {photoGroups.length > 0 && (
            <Button
              onClick={() => setShowGenerator(!showGenerator)}
              size="sm"
              className="flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              새 PDF 생성
            </Button>
          )}
        </div>
      </div>

      <div className="p-6">
        {showGenerator && (
          <div className="mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg">
            <PDFReportGenerator
              photoGroups={photoGroups}
              dailyReportId={dailyReportId}
              siteName={siteName}
              reportDate={reportDate}
              reporterName={reporterName}
              onGenerationComplete={handleGenerationComplete}
              onGenerationError={(error) => {
                console.error('PDF 생성 오류:', error)
                alert('PDF 생성 중 오류가 발생했습니다: ' + error)
              }}
            />
          </div>
        )}

        {pdfReports.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-sm font-medium text-gray-900 mb-2">PDF 보고서 없음</h4>
            <p className="text-sm text-gray-500 mb-4">
              아직 생성된 사진대지 PDF 보고서가 없습니다.
            </p>
            {photoGroups.length > 0 ? (
              <Button
                onClick={() => setShowGenerator(true)}
                variant="outline"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                첫 번째 PDF 생성하기
              </Button>
            ) : (
              <p className="text-xs text-gray-400">
                먼저 작업 사진을 업로드하세요.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {pdfReports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-blue-600 mr-3" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {report.title}
                      </h4>
                      <div className="flex items-center mt-1 space-x-4 text-xs text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(report.created_at)}
                        </div>
                        {report.generated_by_profile && (
                          <div className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {report.generated_by_profile.full_name}
                          </div>
                        )}
                        <div className="flex items-center">
                          <ArrowDownTrayIcon className="h-3 w-3 mr-1" />
                          {report.download_count}회 다운로드
                        </div>
                        {report.file_size && (
                          <div>
                            {(report.file_size / 1024 / 1024).toFixed(1)}MB
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 메타데이터 표시 */}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {report.total_photo_groups > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {report.total_photo_groups}개 항목
                      </span>
                    )}
                    {report.total_before_photos > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        작업전 {report.total_before_photos}장
                      </span>
                    )}
                    {report.total_after_photos > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        작업후 {report.total_after_photos}장
                      </span>
                    )}
                    {report.generation_method && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        {report.generation_method === 'canvas' ? 'Canvas' : 'HTML'}
                      </span>
                    )}
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    onClick={() => handleDownloadPDF(report)}
                    size="sm"
                    variant="outline"
                    className="flex items-center"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    다운로드
                  </Button>
                  
                  {canManage && (
                    <Button
                      onClick={() => handleDeletePDF(report)}
                      size="sm"
                      variant="outline"
                      className="flex items-center text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      삭제
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}