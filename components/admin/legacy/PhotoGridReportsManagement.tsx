'use client'

import type { PhotoGridReport, PhotoGridReportStats, Profile } from '@/types'

interface PhotoGridReportsManagementProps {
  profile: Profile
}

export default function PhotoGridReportsManagement({ profile }: PhotoGridReportsManagementProps) {
  const [reports, setReports] = useState<PhotoGridReport[]>([])
  const [filteredReports, setFilteredReports] = useState<PhotoGridReport[]>([])
  const [stats, setStats] = useState<PhotoGridReportStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [methodFilter, setMethodFilter] = useState<string>('all')
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterReports()
  }, [reports, searchQuery, statusFilter, methodFilter])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // 병렬로 데이터 로딩
      const [reportsData, statsData] = await Promise.all([
        getPhotoGridReports(),
        getPhotoGridReportStats()
      ])
      
      setReports(reportsData)
      setStats(statsData)
    } catch (error) {
      console.error('데이터 로딩 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterReports = () => {
    let filtered = reports

    // 검색 필터
    if (searchQuery) {
      filtered = filtered.filter(report => 
        report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.daily_report?.member_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.daily_report?.site?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // 상태 필터
    if (statusFilter !== 'all') {
      filtered = filtered.filter(report => report.status === statusFilter)
    }

    // 생성 방법 필터
    if (methodFilter !== 'all') {
      filtered = filtered.filter(report => report.generation_method === methodFilter)
    }

    setFilteredReports(filtered)
  }

  const handleDownload = async (report: PhotoGridReport) => {
    try {
      await trackPhotoGridReportDownload(report.id)
      
      const link = document.createElement('a')
      link.href = report.file_url
      link.download = report.file_name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // 다운로드 카운트 업데이트를 위해 새로고침
      await loadData()
    } catch (error) {
      console.error('다운로드 오류:', error)
    }
  }

  const handleSoftDelete = async (reportId: string) => {
    if (!confirm('이 PDF를 삭제하시겠습니까? (휴지통으로 이동)')) return
    
    try {
      const result = await deletePhotoGridReport(reportId)
      if (result.success) {
        await loadData()
      } else {
        alert('삭제에 실패했습니다: ' + result.error)
      }
    } catch (error) {
      console.error('삭제 오류:', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  const handlePermanentDelete = async (reportId: string) => {
    if (!confirm('이 PDF를 영구적으로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return
    
    try {
      const result = await permanentlyDeletePhotoGridReport(reportId)
      if (result.success) {
        await loadData()
      } else {
        alert('영구 삭제에 실패했습니다: ' + result.error)
      }
    } catch (error) {
      console.error('영구 삭제 오류:', error)
      alert('영구 삭제 중 오류가 발생했습니다.')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedReports.size === 0) return
    
    if (!confirm(`선택된 ${selectedReports.size}개의 PDF를 삭제하시겠습니까?`)) return
    
    try {
      const promises = Array.from(selectedReports).map(id => deletePhotoGridReport(id))
      await Promise.all(promises)
      
      setSelectedReports(new Set())
      await loadData()
    } catch (error) {
      console.error('벌크 삭제 오류:', error)
      alert('일부 PDF 삭제에 실패했습니다.')
    }
  }

  const handleRefreshCounts = async () => {
    try {
      setLoading(true)
      const result = await updateDailyReportPdfCounts()
      if (result.success) {
        alert(`${result.updated}개 작업일지의 PDF 카운트를 업데이트했습니다.`)
        await loadData()
      }
    } catch (error) {
      console.error('카운트 업데이트 오류:', error)
      alert('카운트 업데이트 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const toggleReportSelection = (reportId: string) => {
    const newSelection = new Set(selectedReports)
    if (newSelection.has(reportId)) {
      newSelection.delete(reportId)
    } else {
      newSelection.add(reportId)
    }
    setSelectedReports(newSelection)
  }

  const toggleAllSelection = () => {
    if (selectedReports.size === filteredReports.length) {
      setSelectedReports(new Set())
    } else {
      setSelectedReports(new Set(filteredReports.map(r => r.id)))
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: '활성', className: 'bg-green-100 text-green-800' },
      archived: { label: '보관됨', className: 'bg-yellow-100 text-yellow-800' },
      deleted: { label: '삭제됨', className: 'bg-red-100 text-red-800' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active
    
    return (
      <Badge variant="secondary" className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const getMethodBadge = (method: string) => {
    return (
      <Badge variant="outline">
        {method === 'canvas' ? 'Canvas' : 'HTML'}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">사진대지 PDF 관리</h1>
          <p className="text-sm text-gray-600 mt-1">
            모든 사진대지 PDF 보고서를 관리하고 모니터링합니다.
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleRefreshCounts}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            카운트 업데이트
          </Button>
          
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            size="sm"
          >
            <Filter className="h-4 w-4 mr-1" />
            필터
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">총 보고서</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_reports}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <ArrowDownTrayIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">총 다운로드</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_downloads}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">평균 크기</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(stats.average_file_size / 1024 / 1024).toFixed(1)}MB
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">총 용량</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(stats.total_file_size / 1024 / 1024 / 1024).toFixed(2)}GB
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 검색 및 필터 */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="제목, 파일명, 현장명으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
                icon={<Search className="h-4 w-4 text-gray-400" />}
              />
            </div>
          </div>
          
          {showFilters && (
            <div className="flex flex-wrap gap-4 pt-4 border-t">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">모든 상태</option>
                <option value="active">활성</option>
                <option value="archived">보관됨</option>
                <option value="deleted">삭제됨</option>
              </select>
              
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">모든 생성방법</option>
                <option value="canvas">Canvas</option>
                <option value="html">HTML</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 벌크 액션 */}
      {selectedReports.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-blue-800">
              {selectedReports.size}개 항목 선택됨
            </p>
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleBulkDelete}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                선택 삭제
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 보고서 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">
              PDF 보고서 목록 ({filteredReports.length})
            </h2>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedReports.size === filteredReports.length && filteredReports.length > 0}
                onChange={toggleAllSelection}
                className="rounded"
              />
              <label className="text-sm text-gray-600">전체 선택</label>
            </div>
          </div>
        </div>
        
        {filteredReports.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">조건에 맞는 PDF 보고서가 없습니다.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredReports.map((report) => (
              <div key={report.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedReports.has(report.id)}
                    onChange={() => toggleReportSelection(report.id)}
                    className="rounded"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">
                            {report.title}
                          </h3>
                          <div className="flex items-center mt-1 space-x-4 text-xs text-gray-500">
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDate(report.created_at)}
                            </span>
                            <span className="flex items-center">
                              <User className="h-3 w-3 mr-1" />
                              {report.generated_by_profile?.full_name || '알 수 없음'}
                            </span>
                            <span className="flex items-center">
                              <Building className="h-3 w-3 mr-1" />
                              {report.daily_report?.site?.name || '현장 정보 없음'}
                            </span>
                            <span className="flex items-center">
                              <ArrowDownTrayIcon className="h-3 w-3 mr-1" />
                              {report.download_count}회
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(report.status)}
                        {report.generation_method && getMethodBadge(report.generation_method)}
                        
                        {report.file_size && (
                          <Badge variant="outline">
                            {(report.file_size / 1024 / 1024).toFixed(1)}MB
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* 메타데이터 */}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {report.total_photo_groups > 0 && (
                        <Badge variant="secondary">
                          {report.total_photo_groups}개 항목
                        </Badge>
                      )}
                      {report.total_before_photos > 0 && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          작업전 {report.total_before_photos}장
                        </Badge>
                      )}
                      {report.total_after_photos > 0 && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          작업후 {report.total_after_photos}장
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* 액션 버튼 */}
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => handleDownload(report)}
                      size="sm"
                      variant="outline"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      다운로드
                    </Button>
                    
                    {report.status !== 'deleted' && (
                      <Button
                        onClick={() => handleSoftDelete(report.id)}
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        삭제
                      </Button>
                    )}
                    
                    {report.status === 'deleted' && profile.role === 'system_admin' && (
                      <Button
                        onClick={() => handlePermanentDelete(report.id)}
                        size="sm"
                        variant="outline"
                        className="text-red-800 border-red-500 hover:bg-red-100"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        영구 삭제
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}