'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Download, Trash2, Building2, Users, Share2, RefreshCw, Upload, X, FileText, Calendar, User, MapPin, Edit2 } from 'lucide-react'

interface Document {
  id: string
  title: string
  description?: string
  file_name: string
  file_url: string
  file_size: number
  mime_type: string
  category_type: string
  status: string
  is_public: boolean
  created_at: string
  updated_at: string
  uploaded_by: string
  site_id?: string
  profiles?: {
    id: string
    full_name: string
    email: string
  }
  sites?: {
    id: string
    name: string
    address: string
  }
}

interface Site {
  id: string
  name: string
  address: string
}

export default function SharedDocumentsManagement() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSite, setSelectedSite] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editFormData, setEditFormData] = useState<{
    title: string
    description: string
    site_id: string | null
    is_public: boolean
  }>({
    title: '',
    description: '',
    site_id: null,
    is_public: false
  })
  const [saving, setSaving] = useState(false)
  const itemsPerPage = 20

  const supabase = createClient()

  const fetchSites = async () => {
    try {
      const { data, error } = await supabase
        .from('sites')
        .select('id, name, address')
        .eq('status', 'active')
        .order('name')

      if (error) throw error
      setSites(data || [])
    } catch (error) {
      console.error('Error fetching sites:', error)
    }
  }

  const fetchDocuments = async () => {
    setLoading(true)
    try {
      // 통합 API 사용
      const params = new URLSearchParams({
        category_type: 'shared',
        status: 'active',
        limit: itemsPerPage.toString(),
        offset: ((currentPage - 1) * itemsPerPage).toString()
      })

      // 검색 필터 적용
      if (searchTerm) {
        params.append('search', searchTerm)
      }

      // 현장 필터 적용
      if (selectedSite) {
        params.append('site_id', selectedSite)
      }

      const response = await fetch(`/api/unified-documents?${params}`)
      if (!response.ok) throw new Error('Failed to fetch documents')

      const result = await response.json()
      setDocuments(result.documents || [])
      setTotalCount(result.total || 0)
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('정말로 이 문서를 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('unified_document_system')
        .delete()
        .eq('id', documentId)

      if (error) throw error

      await fetchDocuments()
      alert('문서가 성공적으로 삭제되었습니다.')
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('문서 삭제에 실패했습니다.')
    }
  }

  const handleDownloadDocument = async (document: Document) => {
    try {
      // 실제 구현에서는 Supabase Storage URL을 사용
      window.open(document.file_url, '_blank')
    } catch (error) {
      console.error('Error downloading document:', error)
      alert('문서 다운로드에 실패했습니다.')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileTypeIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️'
    if (mimeType === 'application/pdf') return '📄'
    if (mimeType.includes('document') || mimeType.includes('word')) return '📝'
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊'
    return '📁'
  }

  const handleDocumentClick = (document: Document) => {
    setSelectedDocument(document)
    setShowDetailModal(true)
    setIsEditMode(false)
  }

  const closeDetailModal = () => {
    setShowDetailModal(false)
    setSelectedDocument(null)
    setIsEditMode(false)
    setEditFormData({
      title: '',
      description: '',
      site_id: null,
      is_public: false
    })
  }

  const startEditMode = () => {
    if (selectedDocument) {
      setEditFormData({
        title: selectedDocument.title,
        description: selectedDocument.description || '',
        site_id: selectedDocument.site_id,
        is_public: selectedDocument.is_public
      })
      setIsEditMode(true)
    }
  }

  const cancelEditMode = () => {
    setIsEditMode(false)
    setEditFormData({
      title: '',
      description: '',
      site_id: null,
      is_public: false
    })
  }

  const saveDocumentChanges = async () => {
    if (!selectedDocument) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('unified_document_system')
        .update({
          title: editFormData.title,
          description: editFormData.description,
          site_id: editFormData.site_id,
          is_public: editFormData.is_public,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedDocument.id)

      if (error) throw error

      // Update local state
      const updatedDoc = {
        ...selectedDocument,
        ...editFormData
      }
      setSelectedDocument(updatedDoc)
      setDocuments(documents.map(doc => 
        doc.id === selectedDocument.id ? updatedDoc : doc
      ))
      
      setIsEditMode(false)
      alert('문서가 성공적으로 수정되었습니다.')
    } catch (error) {
      console.error('Error updating document:', error)
      alert('문서 수정 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    fetchSites()
  }, [])

  useEffect(() => {
    fetchDocuments()
  }, [currentPage, searchTerm, selectedSite])

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  return (
    <div className="space-y-6">
      {/* 검색 및 필터 섹션 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="문서명, 파일명으로 검색..."
              className="pl-10 pr-4 py-2 w-full bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
            />
          </div>
          
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              className="pl-10 pr-4 py-2 w-full bg-white border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white appearance-none"
              value={selectedSite}
              onChange={(e) => {
                setSelectedSite(e.target.value)
                setCurrentPage(1)
              }}
            >
              <option value="">모든 현장</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={fetchDocuments}
            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            새로고침
          </button>

          <button
            onClick={() => {/* TODO: 문서 업로드 모달 열기 */}}
            className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Upload className="w-4 h-4 mr-2" />
            문서 업로드
          </button>
        </div>
      </div>

      {/* 통계 정보 */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            전체 <span className="font-medium text-gray-900">{totalCount.toLocaleString()}</span>개의 공유 문서
            {selectedSite && (
              <span className="ml-2">
                (현장: {sites.find(s => s.id === selectedSite)?.name})
              </span>
            )}
          </div>
          <div className="text-sm text-gray-600">
            {currentPage} / {totalPages} 페이지
          </div>
        </div>
      </div>

      {/* 문서 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">문서 목록을 불러오는 중...</span>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Share2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>공유 문서가 없습니다.</p>
            {selectedSite && (
              <p className="text-sm mt-2">선택한 현장에 공유된 문서가 없습니다.</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    문서 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    현장
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    등록자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    파일 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    생성일
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
                        <span className="text-2xl mr-3 mt-1">
                          {getFileTypeIcon(document.mime_type)}
                        </span>
                        <div>
                          <button
                            onClick={() => handleDocumentClick(document)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline text-left"
                          >
                            {document.title}
                          </button>
                          {document.description && (
                            <div className="text-sm text-gray-500 mt-1">
                              {document.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {document.sites?.name || '미지정'}
                      </div>
                      {document.sites?.address && (
                        <div className="text-sm text-gray-500">
                          {document.sites.address}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {document.profiles?.full_name || '알 수 없음'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {document.profiles?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {document.file_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatFileSize(document.file_size)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(document.created_at).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDownloadDocument(document)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="다운로드"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {/* TODO: 공유 설정 모달 */}}
                          className="text-green-600 hover:text-green-900 p-1 rounded"
                          title="공유 설정"
                        >
                          <Users className="w-4 h-4" />
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

      {/* Document Detail Modal */}
      {showDetailModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditMode ? '문서 정보 수정' : '문서 상세 정보'}
              </h2>
              <button
                onClick={closeDetailModal}
                className="text-gray-400 hover:text-gray-500 p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-4 space-y-6">
              {/* Document Header */}
              <div className="flex items-start space-x-4">
                <span className="text-5xl">
                  {getFileTypeIcon(selectedDocument.mime_type)}
                </span>
                <div className="flex-1">
                  {isEditMode ? (
                    <>
                      <input
                        type="text"
                        value={editFormData.title}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full text-2xl font-bold text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="문서 제목"
                      />
                      <textarea
                        value={editFormData.description}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="mt-2 w-full text-gray-600 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        rows={2}
                        placeholder="문서 설명 (선택사항)"
                      />
                    </>
                  ) : (
                    <>
                      <h3 className="text-2xl font-bold text-gray-900">
                        {selectedDocument.title}
                      </h3>
                      {selectedDocument.description && (
                        <p className="mt-2 text-gray-600">
                          {selectedDocument.description}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Document Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* File Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-gray-500" />
                    파일 정보
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div>
                      <dt className="text-sm text-gray-500">파일명</dt>
                      <dd className="mt-1 text-sm text-gray-900 font-medium">
                        {selectedDocument.file_name}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">파일 크기</dt>
                      <dd className="mt-1 text-sm text-gray-900 font-medium">
                        {formatFileSize(selectedDocument.file_size)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">파일 형식</dt>
                      <dd className="mt-1 text-sm text-gray-900 font-medium">
                        {selectedDocument.mime_type}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">문서 유형</dt>
                      <dd className="mt-1 text-sm text-gray-900 font-medium">
                        {selectedDocument.document_type}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">저장 경로</dt>
                      <dd className="mt-1 text-sm text-gray-900 font-medium">
                        {selectedDocument.folder_path}
                      </dd>
                    </div>
                  </div>
                </div>

                {/* Upload Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    <User className="w-5 h-5 mr-2 text-gray-500" />
                    등록 정보
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div>
                      <dt className="text-sm text-gray-500">등록자</dt>
                      <dd className="mt-1 text-sm text-gray-900 font-medium">
                        {selectedDocument.profiles?.full_name || '알 수 없음'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">이메일</dt>
                      <dd className="mt-1 text-sm text-gray-900 font-medium">
                        {selectedDocument.profiles?.email || '-'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">등록일시</dt>
                      <dd className="mt-1 text-sm text-gray-900 font-medium">
                        {new Date(selectedDocument.created_at).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">수정일시</dt>
                      <dd className="mt-1 text-sm text-gray-900 font-medium">
                        {new Date(selectedDocument.updated_at).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </dd>
                    </div>
                  </div>
                </div>
              </div>

              {/* Site Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-gray-500" />
                  현장 정보
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  {isEditMode ? (
                    <div>
                      <label className="text-sm text-gray-500">현장 선택</label>
                      <select
                        value={editFormData.site_id || ''}
                        onChange={(e) => setEditFormData(prev => ({ 
                          ...prev, 
                          site_id: e.target.value || null 
                        }))}
                        className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">현장 미지정</option>
                        {sites.map((site) => (
                          <option key={site.id} value={site.id}>
                            {site.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    selectedDocument.sites ? (
                      <>
                        <div>
                          <dt className="text-sm text-gray-500">현장명</dt>
                          <dd className="mt-1 text-sm text-gray-900 font-medium">
                            {selectedDocument.sites.name}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm text-gray-500">현장 주소</dt>
                          <dd className="mt-1 text-sm text-gray-900 font-medium">
                            {selectedDocument.sites.address}
                          </dd>
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-gray-500">현장 미지정</div>
                    )
                  )}
                </div>
              </div>

              {/* Sharing Status */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 flex items-center">
                  <Share2 className="w-5 h-5 mr-2 text-gray-500" />
                  공유 상태
                </h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  {isEditMode ? (
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="is_public"
                        checked={editFormData.is_public}
                        onChange={(e) => setEditFormData(prev => ({ 
                          ...prev, 
                          is_public: e.target.checked 
                        }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="is_public" className="text-sm text-gray-700">
                        공개 문서로 설정 (모든 사용자가 이 문서를 볼 수 있습니다)
                      </label>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        selectedDocument.is_public 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedDocument.is_public ? '공개 문서' : '비공개 문서'}
                      </span>
                      {selectedDocument.is_public && (
                        <span className="ml-2 text-sm text-gray-600">
                          모든 사용자가 이 문서를 볼 수 있습니다
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
              {isEditMode ? (
                <>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={cancelEditMode}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      취소
                    </button>
                  </div>
                  <button
                    onClick={saveDocumentChanges}
                    disabled={isSaving}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? '저장 중...' : '저장'}
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={startEditMode}
                      className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      수정
                    </button>
                    <button
                      onClick={() => handleDownloadDocument(selectedDocument)}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      다운로드
                    </button>
                    <button
                      onClick={() => {
                        // TODO: 공유 설정 기능
                        alert('공유 설정 기능은 준비 중입니다.')
                      }}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      공유 설정
                    </button>
                    <button
                      onClick={() => {
                        closeDetailModal()
                        handleDeleteDocument(selectedDocument.id)
                      }}
                      className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      삭제
                    </button>
                  </div>
                  <button
                    onClick={closeDetailModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    닫기
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}