'use client'


interface RequiredDocument {
  id: string
  title: string
  description?: string
  document_type: string
  file_name: string
  file_size: number
  status: 'pending' | 'approved' | 'rejected'
  submission_date: string
  review_date?: string
  review_notes?: string
  submitted_by: {
    id: string
    full_name: string
    email: string
    role: string
  }
  reviewed_by?: {
    id: string
    full_name: string
    email: string
  }
  site_name?: string
}

// 필수 제출 서류 유형
const documentTypes = [
  { value: 'safety_certificate', label: '안전교육이수증', description: '건설현장 안전교육 이수증명서' },
  { value: 'health_certificate', label: '건강진단서', description: '건설업 종사자 건강진단서' },
  { value: 'insurance_certificate', label: '보험증서', description: '산재보험 및 고용보험 가입증명서' },
  { value: 'id_copy', label: '신분증 사본', description: '주민등록증 또는 운전면허증 사본' },
  { value: 'license', label: '자격증', description: '해당 업무 관련 자격증' },
  { value: 'employment_contract', label: '근로계약서', description: '정식 근로계약서' },
  { value: 'bank_account', label: '통장사본', description: '급여 입금용 통장 사본' },
  { value: 'business_license', label: '사업자등록증', description: '사업자등록증 사본' },
  { value: 'corporate_register', label: '법인등기부등본', description: '법인등기부등본' }
]

// Mock data generator
const generateMockData = (): RequiredDocument[] => {
  const workers = [
    { id: '1', full_name: '김철수', email: 'worker1@inopnc.com', role: 'worker' },
    { id: '2', full_name: '이영희', email: 'worker2@inopnc.com', role: 'worker' },
    { id: '3', full_name: '박민수', email: 'worker3@inopnc.com', role: 'worker' },
    { id: '4', full_name: '정수진', email: 'partner1@inopnc.com', role: 'partner' },
    { id: '5', full_name: '최동현', email: 'manager1@inopnc.com', role: 'site_manager' },
    { id: '6', full_name: '한미영', email: 'worker4@inopnc.com', role: 'worker' },
    { id: '7', full_name: '강성호', email: 'worker5@inopnc.com', role: 'worker' },
    { id: '8', full_name: '송지민', email: 'partner2@inopnc.com', role: 'partner' }
  ]

  const sites = ['강남 A현장', '송파 C현장', '서초 B현장', '마포 D현장', '용산 E현장']
  const statuses: ('pending' | 'approved' | 'rejected')[] = ['pending', 'approved', 'rejected']
  const reviewer = { id: 'admin', full_name: '관리자', email: 'admin@inopnc.com' }

  const documents: RequiredDocument[] = []
  let docId = 1

  workers.forEach(worker => {
    // Get relevant document types for this worker's role
    const relevantTypes = documentTypes.filter(type => {
      if (worker.role === 'worker') {
        return ['safety_certificate', 'health_certificate', 'insurance_certificate', 'id_copy', 'license', 'employment_contract', 'bank_account'].includes(type.value)
      } else if (worker.role === 'partner') {
        return ['business_license', 'corporate_register', 'insurance_certificate'].includes(type.value)
      } else if (worker.role === 'site_manager') {
        return ['license', 'id_copy', 'employment_contract'].includes(type.value)
      }
      return false
    })

    relevantTypes.forEach(docType => {
      const status = statuses[Math.floor(Math.random() * statuses.length)]
      const submissionDays = Math.floor(Math.random() * 30)
      const submissionDate = new Date()
      submissionDate.setDate(submissionDate.getDate() - submissionDays)

      const doc: RequiredDocument = {
        id: `doc-${docId++}`,
        title: `${docType.label} - ${worker.full_name}`,
        description: `${worker.full_name}님이 제출한 ${docType.description}`,
        document_type: docType.value,
        file_name: `${docType.value}_${worker.id}.pdf`,
        file_size: Math.floor(Math.random() * 5000000) + 100000,
        status: status,
        submission_date: submissionDate.toISOString(),
        submitted_by: worker,
        site_name: sites[Math.floor(Math.random() * sites.length)]
      }

      if (status !== 'pending') {
        const reviewDate = new Date(submissionDate)
        reviewDate.setDate(reviewDate.getDate() + Math.floor(Math.random() * 3) + 1)
        doc.review_date = reviewDate.toISOString()
        doc.reviewed_by = reviewer
        doc.review_notes = status === 'approved' 
          ? '서류 확인 완료되었습니다.' 
          : '서류가 불명확합니다. 다시 제출해주세요.'
      }

      documents.push(doc)
    })
  })

  return documents
}

export default function RequiredDocumentsWithMockData() {
  const [documents, setDocuments] = useState<RequiredDocument[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<RequiredDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [workerFilter, setWorkerFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedDocument, setSelectedDocument] = useState<RequiredDocument | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const itemsPerPage = 20

  useEffect(() => {
    // Simulate loading mock data
    setTimeout(() => {
      const mockData = generateMockData()
      setDocuments(mockData)
      setFilteredDocuments(mockData)
      setLoading(false)
    }, 500)
  }, [])

  useEffect(() => {
    // Apply filters
    let filtered = [...documents]

    if (searchTerm) {
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.submitted_by.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.file_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter) {
      filtered = filtered.filter(doc => doc.status === statusFilter)
    }

    if (typeFilter) {
      filtered = filtered.filter(doc => doc.document_type === typeFilter)
    }

    if (workerFilter) {
      filtered = filtered.filter(doc => doc.submitted_by.id === workerFilter)
    }

    setFilteredDocuments(filtered)
    setCurrentPage(1)
  }, [searchTerm, statusFilter, typeFilter, workerFilter, documents])

  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage)
  const paginatedDocuments = filteredDocuments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleApprove = (doc: RequiredDocument) => {
    const updatedDocs = documents.map(d => {
      if (d.id === doc.id) {
        return {
          ...d,
          status: 'approved' as const,
          review_date: new Date().toISOString(),
          reviewed_by: { id: 'admin', full_name: '관리자', email: 'admin@inopnc.com' },
          review_notes: '서류 확인 완료되었습니다.'
        }
      }
      return d
    })
    setDocuments(updatedDocs)
    alert('서류가 승인되었습니다.')
  }

  const handleReject = (doc: RequiredDocument) => {
    const reason = prompt('반려 사유를 입력해주세요:')
    if (reason) {
      const updatedDocs = documents.map(d => {
        if (d.id === doc.id) {
          return {
            ...d,
            status: 'rejected' as const,
            review_date: new Date().toISOString(),
            reviewed_by: { id: 'admin', full_name: '관리자', email: 'admin@inopnc.com' },
            review_notes: reason
          }
        }
        return d
      })
      setDocuments(updatedDocs)
      alert('서류가 반려되었습니다.')
    }
  }

  const handleDelete = (doc: RequiredDocument) => {
    if (confirm(`정말로 "${doc.title}"을(를) 삭제하시겠습니까?`)) {
      const updatedDocs = documents.filter(d => d.id !== doc.id)
      setDocuments(updatedDocs)
      alert('서류가 삭제되었습니다.')
    }
  }

  const handleAddDocument = () => {
    alert('새 필수제출서류 등록 기능은 추가 개발이 필요합니다.')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            승인됨
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            반려됨
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            검토중
          </span>
        )
    }
  }

  const getDocumentTypeLabel = (type: string) => {
    const docType = documentTypes.find(dt => dt.value === type)
    return docType?.label || type
  }

  const uniqueWorkers = Array.from(new Set(documents.map(d => JSON.stringify({
    id: d.submitted_by.id,
    name: d.submitted_by.full_name
  })))).map(w => JSON.parse(w))

  // Statistics
  const stats = {
    total: documents.length,
    pending: documents.filter(d => d.status === 'pending').length,
    approved: documents.filter(d => d.status === 'approved').length,
    rejected: documents.filter(d => d.status === 'rejected').length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">전체 서류</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
            <FileCheck className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">검토중</p>
              <p className="text-2xl font-semibold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">승인됨</p>
              <p className="text-2xl font-semibold text-green-600">{stats.approved}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">반려됨</p>
              <p className="text-2xl font-semibold text-red-600">{stats.rejected}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="서류명, 제출자, 파일명으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">모든 상태</option>
            <option value="pending">검토중</option>
            <option value="approved">승인됨</option>
            <option value="rejected">반려됨</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">모든 서류 유형</option>
            {documentTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>

          <select
            value={workerFilter}
            onChange={(e) => setWorkerFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">모든 작업자</option>
            {uniqueWorkers.map(worker => (
              <option key={worker.id} value={worker.id}>{worker.name}</option>
            ))}
          </select>

          <button
            onClick={handleAddDocument}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            서류 등록
          </button>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  서류 정보
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  제출자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  현장
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  제출일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  검토자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedDocuments.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{doc.title}</div>
                      <div className="text-sm text-gray-500">{getDocumentTypeLabel(doc.document_type)}</div>
                      <div className="text-xs text-gray-400">{Math.round(doc.file_size / 1024)} KB</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{doc.submitted_by.full_name}</div>
                        <div className="text-sm text-gray-500">{doc.submitted_by.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {doc.site_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      {new Date(doc.submission_date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(doc.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {doc.reviewed_by ? (
                      <div>
                        <div>{doc.reviewed_by.full_name}</div>
                        {doc.review_date && (
                          <div className="text-xs text-gray-500">
                            {new Date(doc.review_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedDocument(doc)
                          setIsDetailModalOpen(true)
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="상세보기"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      {doc.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(doc)}
                            className="text-green-600 hover:text-green-900"
                            title="승인"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleReject(doc)}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="반려"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      
                      <button
                        onClick={() => alert(`"${doc.file_name}" 다운로드 기능은 추가 개발이 필요합니다.`)}
                        className="text-gray-600 hover:text-gray-900"
                        title="다운로드"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDelete(doc)}
                        className="text-red-600 hover:text-red-900"
                        title="삭제"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                전체 {filteredDocuments.length}개 중 {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredDocuments.length)}개 표시
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md disabled:opacity-50"
                >
                  이전
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = currentPage - 2 + i
                  if (pageNum < 1 || pageNum > totalPages) return null
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 text-sm rounded-md ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md disabled:opacity-50"
                >
                  다음
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {isDetailModalOpen && selectedDocument && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">서류 상세 정보</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">서류명</label>
                <p className="mt-1 text-sm text-gray-900">{selectedDocument.title}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">서류 유형</label>
                <p className="mt-1 text-sm text-gray-900">{getDocumentTypeLabel(selectedDocument.document_type)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">설명</label>
                <p className="mt-1 text-sm text-gray-900">{selectedDocument.description || '-'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">제출자</label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedDocument.submitted_by.full_name} ({selectedDocument.submitted_by.email})
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">현장</label>
                <p className="mt-1 text-sm text-gray-900">{selectedDocument.site_name || '-'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">제출일</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(selectedDocument.submission_date).toLocaleString()}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">상태</label>
                <div className="mt-1">{getStatusBadge(selectedDocument.status)}</div>
              </div>
              
              {selectedDocument.reviewed_by && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">검토자</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedDocument.reviewed_by.full_name} ({selectedDocument.reviewed_by.email})
                    </p>
                  </div>
                  
                  {selectedDocument.review_date && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">검토일</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {new Date(selectedDocument.review_date).toLocaleString()}
                      </p>
                    </div>
                  )}
                  
                  {selectedDocument.review_notes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">검토 의견</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedDocument.review_notes}</p>
                    </div>
                  )}
                </>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700">파일 정보</label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedDocument.file_name} ({Math.round(selectedDocument.file_size / 1024)} KB)
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              {selectedDocument.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      handleApprove(selectedDocument)
                      setIsDetailModalOpen(false)
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    승인
                  </button>
                  <button
                    onClick={() => {
                      handleReject(selectedDocument)
                      setIsDetailModalOpen(false)
                    }}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                  >
                    반려
                  </button>
                </>
              )}
              
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}