'use client'

import BulkActionBar, { commonBulkActions } from './BulkActionBar'

interface DocumentManagementProps {
  profile: Profile
}

export default function DocumentManagement({ profile }: DocumentManagementProps) {
  const [documents, setDocuments] = useState<DocumentWithApproval[]>([])
  const [integratedDocuments, setIntegratedDocuments] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'legacy' | 'integrated'>('integrated')
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 10

  // Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<DocumentType | ''>('')
  const [approvalFilter, setApprovalFilter] = useState<ApprovalStatus | ''>('')
  const [siteFilter, setSiteFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  
  // Statistics
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total_documents: 0
  })
  
  // Available sites
  const [availableSites, setAvailableSites] = useState<Array<{ id: string; name: string }>>([])

  // Load integrated documents data
  const loadIntegratedDocuments = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/admin/documents/integrated')
      if (response.ok) {
        const data = await response.json()
        console.log('DocumentManagement - API Response:', data)
        console.log('DocumentManagement - Documents Count:', data.documents?.length || 0)
        console.log('DocumentManagement - Statistics:', data.statistics)
        setIntegratedDocuments(data)
      } else {
        setError('통합 문서 데이터를 불러오는데 실패했습니다.')
      }
    } catch (err) {
      setError('통합 문서 데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // Load documents data
  const loadDocuments = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await getDocuments(
        currentPage,
        pageSize,
        searchTerm,
        typeFilter || undefined,
        approvalFilter || undefined,
        siteFilter || undefined
      )
      
      if (result.success && result.data) {
        setDocuments(result.data.documents)
        setTotalCount(result.data.total)
        setTotalPages(result.data.pages)
      } else {
        setError(result.error || '문서 데이터를 불러오는데 실패했습니다.')
      }
    } catch (err) {
      setError('문서 데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // Load statistics
  const loadStats = async () => {
    try {
      const result = await getDocumentApprovalStats()
      if (result.success && result.data) {
        setStats(result.data)
      }
    } catch (err) {
      console.error('Failed to load document stats:', err)
    }
  }

  // Load available sites
  const loadAvailableSites = async () => {
    try {
      const result = await getAvailableSitesForDocuments()
      if (result.success && result.data) {
        setAvailableSites(result.data)
      }
    } catch (err) {
      console.error('Failed to load available sites:', err)
    }
  }

  // Load data on mount and when filters change
  useEffect(() => {
    if (viewMode === 'integrated') {
      loadIntegratedDocuments()
    } else {
      loadDocuments()
    }
  }, [viewMode, currentPage, searchTerm, typeFilter, approvalFilter, siteFilter, categoryFilter])

  useEffect(() => {
    loadStats()
    loadAvailableSites()
  }, [])

  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1)
  }

  // Handle filters
  const handleTypeFilter = (type: DocumentType | '') => {
    setTypeFilter(type)
    setCurrentPage(1)
  }

  const handleApprovalFilter = (status: ApprovalStatus | '') => {
    setApprovalFilter(status)
    setCurrentPage(1)
  }

  const handleSiteFilter = (siteId: string) => {
    setSiteFilter(siteId)
    setCurrentPage(1)
  }

  // Handle bulk approval
  const handleBulkApproval = (action: 'approve' | 'reject') => async (documentIds: string[]) => {
    const comments = prompt(`${action === 'approve' ? '승인' : '거부'} 사유를 입력하세요 (선택사항):`)
    
    try {
      const result = await processDocumentApprovals(documentIds, action, comments || undefined)
      if (result.success) {
        await Promise.all([loadDocuments(), loadStats()])
        setSelectedIds([])
        alert(result.message)
      } else {
        alert(result.error)
      }
    } catch (error) {
      alert(`${action === 'approve' ? '승인' : '거부'} 처리 중 오류가 발생했습니다.`)
    }
  }

  // Handle bulk delete
  const handleBulkDelete = async (documentIds: string[]) => {
    if (!confirm(`${documentIds.length}개 문서를 삭제하시겠습니까?`)) {
      return
    }

    try {
      const result = await deleteDocuments(documentIds)
      if (result.success) {
        await loadDocuments()
        setSelectedIds([])
        alert(result.message)
      } else {
        alert(result.error)
      }
    } catch (error) {
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  // Handle view document
  const handleViewDocument = (document: DocumentWithApproval) => {
    if (document.file_url) {
      window.open(document.file_url, '_blank')
    } else {
      alert('문서 파일을 찾을 수 없습니다.')
    }
  }

  // Define table columns
  const columns = [
    {
      key: 'title',
      label: '문서 정보',
      sortable: true,
      filterable: true,
      render: (value: string, document: DocumentWithApproval) => (
        <div className="flex items-start space-x-3">
          <FileText className="h-8 w-8 text-blue-500 mt-1 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="font-medium text-gray-900 dark:text-gray-100 truncate">{value}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {document.file_name}
            </div>
            {document.description && (
              <div className="text-sm text-gray-600 dark:text-gray-300 truncate mt-1">
                {document.description}
              </div>
            )}
            <div className="text-xs text-gray-400 mt-1">
              크기: {document.file_size ? Math.round(document.file_size / 1024) + 'KB' : 'N/A'}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'document_type',
      label: '타입',
      render: (value: DocumentType) => {
        const typeConfig = {
          personal: { text: '개인', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' },
          shared: { text: '공유', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' },
          blueprint: { text: '도면', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300' },
          report: { text: '보고서', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300' },
          certificate: { text: '인증서', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' },
          other: { text: '기타', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300' }
        }
        
        const config = typeConfig[value] || typeConfig.other
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
            {config.text}
          </span>
        )
      }
    },
    {
      key: 'approval_status',
      label: '승인 상태',
      render: (value: ApprovalStatus | undefined, document: DocumentWithApproval) => {
        if (!value) {
          return <span className="text-gray-400">-</span>
        }

        const statusConfig = {
          pending: { text: '대기중', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300', icon: Clock },
          approved: { text: '승인됨', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300', icon: CheckCircle },
          rejected: { text: '거부됨', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300', icon: XCircle },
          cancelled: { text: '취소됨', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300', icon: AlertCircle }
        }
        
        const config = statusConfig[value] || statusConfig.pending
        const Icon = config.icon
        
        return (
          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
            <Icon className="h-3 w-3 mr-1" />
            {config.text}
          </span>
        )
      }
    },
    {
      key: 'owner',
      label: '소유자',
      render: (owner: { full_name: string; email: string } | undefined) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {owner?.full_name || 'N/A'}
          </div>
          <div className="text-gray-500 dark:text-gray-400">
            {owner?.email || ''}
          </div>
        </div>
      )
    },
    {
      key: 'site',
      label: '현장',
      render: (site: { name: string } | undefined) => (
        <span className="text-sm text-gray-900 dark:text-gray-100">
          {site?.name || '전체'}
        </span>
      )
    },
    {
      key: 'created_at',
      label: '생성일',
      render: (value: string) => new Date(value).toLocaleDateString('ko-KR')
    }
  ]

  // Define bulk actions
  const bulkActions = [
    commonBulkActions.delete(handleBulkDelete),
    {
      id: 'approve',
      label: '승인',
      icon: CheckCircle,
      variant: 'default' as const,
      onClick: handleBulkApproval('approve')
    },
    {
      id: 'reject',
      label: '거부',
      icon: XCircle,
      variant: 'destructive' as const,
      onClick: handleBulkApproval('reject')
    }
  ]

  // Custom actions for individual documents
  const customActions = [
    {
      icon: Download,
      label: '다운로드',
      onClick: (document: DocumentWithApproval) => {
        if (document.file_url) {
          const link = window.document.createElement('a')
          link.href = document.file_url
          link.download = document.file_name
          link.click()
        }
      }
    }
  ]

  return (
    <div className="space-y-4">
      {/* View Mode Toggle */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">문서 관리</h2>
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setViewMode('integrated')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'integrated'
                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <FolderOpen className="h-4 w-4 mr-2 inline" />
            통합 문서함 관리
          </button>
          <button
            onClick={() => setViewMode('legacy')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'legacy'
                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <FileText className="h-4 w-4 mr-2 inline" />
            기존 승인 관리
          </button>
        </div>
      </div>

      {viewMode === 'integrated' && integratedDocuments ? (
        // Integrated Documents View
        <div className="space-y-6">
          {/* Document Category Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-blue-700 dark:text-blue-300">공유문서함</div>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {integratedDocuments.statistics?.shared_documents || 0}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-700">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Image className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-purple-700 dark:text-purple-300">도면마킹문서함</div>
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {integratedDocuments.statistics?.markup_documents || 0}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border border-green-200 dark:border-green-700">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-green-700 dark:text-green-300">필수제출서류함</div>
                  <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {integratedDocuments.statistics?.required_documents || 0}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-6 border border-orange-200 dark:border-orange-700">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Package className="h-8 w-8 text-orange-600" />
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-orange-700 dark:text-orange-300">기성청구문서함</div>
                  <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                    {integratedDocuments.statistics?.invoice_documents || 0}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-6 border border-teal-200 dark:border-teal-700">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Image className="h-8 w-8 text-teal-600" />
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-teal-700 dark:text-teal-300">사진대지문서함</div>
                  <div className="text-2xl font-bold text-teal-900 dark:text-teal-100">
                    {integratedDocuments.statistics?.photo_grid_documents || 0}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Document Categories Display */}
          {integratedDocuments.documents_by_category && Object.entries(integratedDocuments.documents_by_category).map(([category, docs]: [string, any[]]) => {
            const categoryConfig = {
              shared: { name: '공유문서함', color: 'blue', icon: FileText, description: '현장별 접근 권한 관리' },
              markup: { name: '도면마킹문서함', color: 'purple', icon: Image, description: '현장별 도면 및 마킹 자료' },
              required: { name: '필수제출서류함', color: 'green', icon: Shield, description: '작업자-현장관리자-본사관리자 공유' },
              invoice: { name: '기성청구문서함', color: 'orange', icon: Package, description: '파트너사-본사관리자 공유' },
              photo_grid: { name: '사진대지문서함', color: 'teal', icon: Image, description: '현장 사진 및 이미지 자료 관리' }
            }
            const config = categoryConfig[category as keyof typeof categoryConfig] || { name: category, color: 'gray', icon: FileText, description: '' }
            const IconComponent = config.icon
            
            return (
              <div key={category} className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                <div className={`bg-${config.color}-50 dark:bg-${config.color}-900/20 p-6 border-b border-${config.color}-200 dark:border-${config.color}-700`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <IconComponent className={`h-6 w-6 text-${config.color}-600 mr-3`} />
                      <div>
                        <h3 className={`text-lg font-semibold text-${config.color}-900 dark:text-${config.color}-100`}>
                          {config.name}
                        </h3>
                        <p className={`text-sm text-${config.color}-700 dark:text-${config.color}-300`}>
                          {config.description}
                        </p>
                      </div>
                    </div>
                    <div className={`bg-${config.color}-100 dark:bg-${config.color}-800 px-3 py-1 rounded-full`}>
                      <span className={`text-sm font-medium text-${config.color}-800 dark:text-${config.color}-200`}>
                        {docs.length}개 문서
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  {docs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {docs.slice(0, 6).map((doc) => (
                        <div key={doc.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start space-x-3">
                            <div className={`p-2 bg-${config.color}-100 dark:bg-${config.color}-800 rounded-lg`}>
                              <FileText className={`h-5 w-5 text-${config.color}-600`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {doc.title || doc.file_name}
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {doc.file_name}
                              </p>
                              {doc.sites?.name && (
                                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                                  현장: {doc.sites.name}
                                </p>
                              )}
                              {doc.profiles?.full_name && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  업로더: {doc.profiles.full_name}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className={`p-4 bg-${config.color}-100 dark:bg-${config.color}-800 rounded-full inline-block mb-4`}>
                        <IconComponent className={`h-8 w-8 text-${config.color}-600`} />
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        등록된 문서가 없습니다
                      </h4>
                      <p className="text-gray-500 dark:text-gray-400">
                        {config.name}에 업로드된 문서가 없습니다.
                      </p>
                    </div>
                  )}
                  
                  {docs.length > 6 && (
                    <div className="mt-4 text-center">
                      <button className={`text-${config.color}-600 hover:text-${config.color}-800 dark:text-${config.color}-400 dark:hover:text-${config.color}-300 text-sm font-medium`}>
                        {docs.length - 6}개 더 보기 →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        // Legacy Document Management View
        <div className="space-y-4">
          {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">전체 문서</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{stats.total_documents}</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">승인 대기</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{stats.pending}</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">승인됨</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{stats.approved}</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">거부됨</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{stats.rejected}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Header with search and filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="문서 제목, 설명, 파일명으로 검색..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <select
            value={typeFilter}
            onChange={(e) => handleTypeFilter(e.target.value as DocumentType | '')}
            className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">모든 타입</option>
            <option value="personal">개인</option>
            <option value="shared">공유</option>
            <option value="blueprint">도면</option>
            <option value="report">보고서</option>
            <option value="certificate">인증서</option>
            <option value="other">기타</option>
          </select>
          
          <select
            value={approvalFilter}
            onChange={(e) => handleApprovalFilter(e.target.value as ApprovalStatus | '')}
            className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">모든 승인 상태</option>
            <option value="pending">승인 대기</option>
            <option value="approved">승인됨</option>
            <option value="rejected">거부됨</option>
          </select>
          
          <select
            value={siteFilter}
            onChange={(e) => handleSiteFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">모든 현장</option>
            {availableSites.map((site) => (
              <option key={site.id} value={site.id}>{site.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Documents table */}
      <AdminDataTable
        data={documents}
        columns={columns}
        loading={loading}
        error={error}
        selectable={true}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        getRowId={(document: DocumentWithApproval) => document.id}
        onView={handleViewDocument}
        customActions={customActions}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        pageSize={pageSize}
        totalCount={totalCount}
        emptyMessage="문서가 없습니다"
        emptyDescription="승인 요청된 문서가 나타날 예정입니다."
      />

      {/* Bulk action bar */}
      <BulkActionBar
        selectedIds={selectedIds}
        totalCount={totalCount}
        actions={bulkActions}
        onClearSelection={() => setSelectedIds([])}
      />
        </div>
      )}
    </div>
  )
}