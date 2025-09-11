'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, FileCheck, Search, Download, Eye, RefreshCw, AlertCircle, CheckCircle, XCircle, Clock, Filter, CheckSquare, Square, User, Calendar } from 'lucide-react'

interface RequiredDocument {
  id: string
  title: string
  description?: string
  document_type: string
  file_name: string
  file_size: number
  file_url?: string
  status: 'pending' | 'approved' | 'rejected' | 'submitted'
  submission_date: string
  submitted_by: {
    id: string
    full_name: string
    email: string
    role: string
  }
  organization_name?: string
  submission_id?: string
  requirement_id?: string
  rejection_reason?: string
}

interface RequiredDocumentTypeDetailPageProps {
  documentType: string
}

// 문서 타입 라벨 매핑
const DOCUMENT_TYPE_LABELS = {
  medical_checkup: '배치전 검진 결과서',
  safety_education: '기초안전보건교육이수증',
  vehicle_insurance: '차량 보험증',
  vehicle_registration: '차량등록증',
  payroll_stub: '통장 사본',
  id_card: '신분증 사본',
  senior_documents: '고령자 서류'
}

export default function RequiredDocumentTypeDetailPage({ 
  documentType 
}: RequiredDocumentTypeDetailPageProps) {
  const router = useRouter()
  const [documents, setDocuments] = useState<RequiredDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedDocs, setSelectedDocs] = useState<string[]>([])
  const [showRejectionModal, setShowRejectionModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [selectedForRejection, setSelectedForRejection] = useState<string[]>([])
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewDocument, setPreviewDocument] = useState<RequiredDocument | null>(null)

  useEffect(() => {
    fetchDocuments()
  }, [documentType])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      
      const response = await fetch(`/api/admin/documents/required/${encodeURIComponent(documentType)}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents || [])
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to fetch documents:', response.status, errorData)
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (submissionIds: string[]) => {
    try {
      const promises = submissionIds.map(id => 
        fetch('/api/user-document-submissions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            submission_id: id,
            status: 'approved'
          })
        })
      )
      
      await Promise.all(promises)
      alert(`${submissionIds.length}개 서류가 승인되었습니다.`)
      fetchDocuments()
      setSelectedDocs([])
    } catch (error) {
      console.error('Error approving documents:', error)
      alert('승인 처리 중 오류가 발생했습니다.')
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('반려 사유를 입력해주세요.')
      return
    }

    try {
      const promises = selectedForRejection.map(id => 
        fetch('/api/user-document-submissions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            submission_id: id,
            status: 'rejected',
            rejection_reason: rejectionReason
          })
        })
      )
      
      await Promise.all(promises)
      alert(`${selectedForRejection.length}개 서류가 반려되었습니다.`)
      fetchDocuments()
      setSelectedDocs([])
      setShowRejectionModal(false)
      setRejectionReason('')
      setSelectedForRejection([])
    } catch (error) {
      console.error('Error rejecting documents:', error)
      alert('반려 처리 중 오류가 발생했습니다.')
    }
  }

  const handlePreview = (document: RequiredDocument) => {
    setPreviewDocument(document)
    setShowPreviewModal(true)
  }

  const handleDownload = async (document: RequiredDocument) => {
    try {
      // This would need to be implemented to get the signed URL for download
      alert(`다운로드 기능은 추후 구현 예정입니다: ${document.file_name}`)
    } catch (error) {
      alert('다운로드 중 오류가 발생했습니다.')
    }
  }

  const toggleDocSelection = (docId: string) => {
    setSelectedDocs(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    )
  }

  const toggleAllSelection = () => {
    if (selectedDocs.length === filteredDocuments.length) {
      setSelectedDocs([])
    } else {
      setSelectedDocs(filteredDocuments.map(doc => doc.submission_id || doc.id))
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { icon: Clock, text: '검토 대기', className: 'bg-yellow-100 text-yellow-800' },
      approved: { icon: CheckCircle, text: '승인', className: 'bg-green-100 text-green-800' },
      rejected: { icon: XCircle, text: '반려', className: 'bg-red-100 text-red-800' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
        <Icon className="w-3 h-3" />
        {config.text}
      </span>
    )
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.submitted_by.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.file_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const documentTypeLabel = DOCUMENT_TYPE_LABELS[documentType as keyof typeof DOCUMENT_TYPE_LABELS] || documentType

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">문서를 불러오는 중...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            뒤로가기
          </button>
          <div className="flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">{documentTypeLabel}</h1>
            <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
              {filteredDocuments.length}건
            </span>
          </div>
        </div>
        <button
          onClick={fetchDocuments}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          새로고침
        </button>
      </div>

      {/* 일괄 작업 버튼 */}
      {selectedDocs.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
          <span className="text-sm text-blue-700 font-medium">
            {selectedDocs.length}개 선택됨
          </span>
          <button
            onClick={() => handleApprove(selectedDocs)}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            일괄 승인
          </button>
          <button
            onClick={() => {
              setSelectedForRejection(selectedDocs)
              setShowRejectionModal(true)
            }}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            일괄 반려
          </button>
          <button
            onClick={() => setSelectedDocs([])}
            className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            선택 취소
          </button>
        </div>
      )}

      {/* 검색 및 필터 */}
      <div className="flex flex-col sm:flex-row gap-4 bg-gray-50 p-4 rounded-lg">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="제목, 제출자명, 파일명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">모든 상태</option>
            <option value="pending">검토 대기</option>
            <option value="approved">승인</option>
            <option value="rejected">반려</option>
          </select>
        </div>
      </div>

      {/* 문서 목록 */}
      {filteredDocuments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">제출된 {documentTypeLabel}가 없습니다</h3>
          <p className="text-gray-600">해당 문서 유형의 제출서류가 여기에 표시됩니다.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-12 px-6 py-3">
                    <input
                      type="checkbox"
                      checked={selectedDocs.length === filteredDocuments.length && filteredDocuments.length > 0}
                      onChange={toggleAllSelection}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    제출자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    파일 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    제출일
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDocuments.map((document) => {
                  const docId = document.submission_id || document.id
                  const isSelected = selectedDocs.includes(docId)
                  
                  return (
                    <tr key={document.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleDocSelection(docId)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{document.submitted_by.full_name}</div>
                            <div className="text-sm text-gray-500">{document.submitted_by.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{document.file_name}</div>
                          <div className="text-sm text-gray-500">{formatFileSize(document.file_size)}</div>
                          {document.title && (
                            <div className="text-xs text-gray-400 mt-1">{document.title}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(document.status)}
                        {document.status === 'rejected' && document.rejection_reason && (
                          <div className="mt-1 text-xs text-red-600">
                            사유: {document.rejection_reason}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="w-4 h-4 mr-2" />
                          {formatDate(document.submission_date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handlePreview(document)}
                            className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors"
                            title="미리보기"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {document.status === 'pending' || document.status === 'submitted' ? (
                            <>
                              <button
                                onClick={() => handleApprove([docId])}
                                className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded transition-colors"
                                title="승인"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedForRejection([docId])
                                  setShowRejectionModal(true)
                                }}
                                className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors"
                                title="반려"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          ) : null}
                          <button
                            onClick={() => handleDownload(document)}
                            className="text-gray-600 hover:text-gray-900 p-1 hover:bg-gray-50 rounded transition-colors"
                            title="다운로드"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 반려 사유 입력 모달 */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">반려 사유 입력</h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="반려 사유를 입력해주세요..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowRejectionModal(false)
                  setRejectionReason('')
                  setSelectedForRejection([])
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                반려
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 미리보기 모달 (간단한 구현) */}
      {showPreviewModal && previewDocument && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full p-6 overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">파일 미리보기</h3>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="text-center py-8 text-gray-500">
              <Eye className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">{previewDocument.file_name}</p>
              <p className="text-sm">{formatFileSize(previewDocument.file_size)}</p>
              <p className="mt-4">미리보기 기능은 추후 구현 예정입니다.</p>
              <button
                onClick={() => handleDownload(previewDocument)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Download className="w-4 h-4 inline mr-2" />
                다운로드
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}