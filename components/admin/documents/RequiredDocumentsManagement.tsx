'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileCheck, Search, Download, Eye, Trash2, User, Calendar, RefreshCw, Upload, AlertCircle, CheckCircle, X } from 'lucide-react'
import RequiredDocumentUploadModal from './RequiredDocumentUploadModal'
import RequiredDocumentDetailModal from './RequiredDocumentDetailModal'

interface RequiredDocument {
  id: string
  title: string
  description?: string
  document_type: string
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
  status: 'pending' | 'approved' | 'rejected'
  submission_date: string
  review_date?: string
  review_notes?: string
  created_at: string
  submitted_by: string
  reviewed_by?: string
  profiles?: {
    id: string
    full_name: string
    email: string
    role: string
  }
  reviewer_profile?: {
    id: string
    full_name: string
    email: string
  }
}

// 필수 제출 서류 유형
const documentTypes = [
  { value: 'safety_certificate', label: '안전교육이수증' },
  { value: 'health_certificate', label: '건강진단서' },
  { value: 'insurance_certificate', label: '보험증서' },
  { value: 'id_copy', label: '신분증 사본' },
  { value: 'license', label: '자격증' },
  { value: 'employment_contract', label: '근로계약서' },
  { value: 'bank_account', label: '통장사본' },
  { value: 'other', label: '기타 서류' }
]

export default function RequiredDocumentsManagement() {
  const [documents, setDocuments] = useState<RequiredDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null)
  const itemsPerPage = 20

  const supabase = createClient()

  const fetchDocuments = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('documents')
        .select(`
          *,
          profiles!documents_submitted_by_fkey(id, full_name, email, role),
          reviewer_profile:profiles!documents_reviewed_by_fkey(id, full_name, email)
        `, { count: 'exact' })
        .eq('document_category', 'required')

      // 검색 필터 적용
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,file_name.ilike.%${searchTerm}%,document_type.ilike.%${searchTerm}%`)
      }

      // 사용자 검색 필터 적용 (이름, 이메일, 역할로 검색)
      if (userSearchTerm) {
        // First get user IDs that match the search term
        const { data: users, error: userError } = await supabase
          .from('profiles')
          .select('id')
          .or(`full_name.ilike.%${userSearchTerm}%,email.ilike.%${userSearchTerm}%,role.ilike.%${userSearchTerm}%`)
        
        if (!userError && users && users.length > 0) {
          const userIds = users.map(u => u.id)
          query = query.in('submitted_by', userIds)
        } else {
          // If no users found, return empty result
          setDocuments([])
          setTotalCount(0)
          setLoading(false)
          return
        }
      }

      // 상태 필터 적용
      if (statusFilter) {
        query = query.eq('status', statusFilter)
      }

      // 서류 유형 필터 적용
      if (typeFilter) {
        query = query.eq('document_type', typeFilter)
      }

      const from = (currentPage - 1) * itemsPerPage
      const to = from + itemsPerPage - 1

      const { data, error, count } = await query
        .order('submission_date', { ascending: false })
        .range(from, to)

      if (error) throw error

      setDocuments(data || [])
      setTotalCount(count || 0)
    } catch (error) {
      console.error('Error fetching required documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (documentId: string, status: 'approved' | 'rejected', notes?: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ 
          status,
          review_date: new Date().toISOString(),
          review_notes: notes
        })
        .eq('id', documentId)

      if (error) throw error

      await fetchDocuments()
      alert(`서류가 ${status === 'approved' ? '승인' : '반려'}되었습니다.`)
    } catch (error) {
      console.error('Error updating document status:', error)
      alert('서류 상태 업데이트에 실패했습니다.')
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('정말로 이 서류를 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId)

      if (error) throw error

      await fetchDocuments()
      alert('서류가 성공적으로 삭제되었습니다.')
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('서류 삭제에 실패했습니다.')
    }
  }

  const handleDownloadDocument = async (document: RequiredDocument) => {
    try {
      // 실제 구현에서는 Supabase Storage URL을 사용
      window.open(document.file_path, '_blank')
    } catch (error) {
      console.error('Error downloading document:', error)
      alert('서류 다운로드에 실패했습니다.')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            승인
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            반려
          </span>
        )
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            검토중
          </span>
        )
    }
  }

  const getDocumentTypeLabel = (type: string) => {
    const docType = documentTypes.find(t => t.value === type)
    return docType ? docType.label : type
  }

  useEffect(() => {
    fetchDocuments()
  }, [currentPage, searchTerm, userSearchTerm, statusFilter, typeFilter])

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  return (
    <div className="space-y-6">
      {/* 검색 및 필터 섹션 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="space-y-4">
          {/* 첫 번째 줄: 서류명 검색, 사용자 검색 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="서류명, 파일명으로 검색..."
                className="pl-10 pr-4 py-2 w-full bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>
            
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="제출자 이름, 이메일, 역할로 검색..."
                className="pl-10 pr-4 py-2 w-full bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white"
                value={userSearchTerm}
                onChange={(e) => {
                  setUserSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>
          </div>

          {/* 두 번째 줄: 필터 및 액션 버튼 */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <select
              className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white appearance-none"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
            >
              <option value="">모든 상태</option>
              <option value="pending">검토중</option>
              <option value="approved">승인</option>
              <option value="rejected">반려</option>
            </select>

            <select
              className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white appearance-none"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value)
                setCurrentPage(1)
              }}
            >
              <option value="">모든 서류 유형</option>
              {documentTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            
            <button
              onClick={() => {
                setSearchTerm('')
                setUserSearchTerm('')
                setStatusFilter('')
                setTypeFilter('')
                setCurrentPage(1)
              }}
              className="flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              <X className="w-4 h-4 mr-2" />
              초기화
            </button>
            
            <button
              onClick={fetchDocuments}
              className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              새로고침
            </button>

            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Upload className="w-4 h-4 mr-2" />
              직접 등록
            </button>
          </div>
        </div>
      </div>

      {/* 통계 정보 */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            전체 <span className="font-medium text-gray-900">{totalCount.toLocaleString()}</span>개의 필수 제출 서류
          </div>
          <div className="text-sm text-gray-600">
            {currentPage} / {totalPages} 페이지
          </div>
        </div>
      </div>

      {/* 서류 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">필수 제출 서류를 불러오는 중...</span>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileCheck className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>필수 제출 서류가 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    서류 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    제출자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    서류 유형
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    제출일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documents.map((document) => (
                  <tr key={document.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-start">
                        <FileCheck className="w-5 h-5 text-blue-500 mr-3 mt-1" />
                        <div>
                          <button
                            onClick={() => {
                              setSelectedDocumentId(document.id)
                              setIsDetailModalOpen(true)
                            }}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline text-left"
                          >
                            {document.title}
                          </button>
                          <div className="text-sm text-gray-500 mt-1">
                            {document.file_name}
                          </div>
                          <div className="text-xs text-gray-400">
                            {formatFileSize(document.file_size)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {document.profiles?.full_name || '알 수 없음'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {document.profiles?.email}
                      </div>
                      <div className="text-xs text-gray-400">
                        {document.profiles?.role}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {getDocumentTypeLabel(document.document_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(document.status)}
                      {document.review_notes && (
                        <div className="text-xs text-gray-500 mt-1">
                          {document.review_notes}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(document.submission_date).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      {document.review_date && (
                        <div className="text-xs text-gray-400 mt-1">
                          검토: {new Date(document.review_date).toLocaleDateString('ko-KR')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedDocumentId(document.id)
                            setIsDetailModalOpen(true)
                          }}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="상세보기"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadDocument(document)}
                          className="text-gray-600 hover:text-gray-900 p-1 rounded"
                          title="다운로드"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDocument(document.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-6 py-3 rounded-lg shadow">
          <div className="text-sm text-gray-700">
            {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalCount)} / {totalCount} 항목
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              이전
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 border rounded text-sm ${
                    currentPage === pageNum 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              다음
            </button>
          </div>
        </div>
      )}

      {/* 모달들 */}
      <RequiredDocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={() => {
          setIsUploadModalOpen(false)
          fetchDocuments()
        }}
      />

      <RequiredDocumentDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedDocumentId(null)
        }}
        onSuccess={() => {
          setIsDetailModalOpen(false)
          setSelectedDocumentId(null)
          fetchDocuments()
        }}
        documentId={selectedDocumentId}
      />
    </div>
  )
}