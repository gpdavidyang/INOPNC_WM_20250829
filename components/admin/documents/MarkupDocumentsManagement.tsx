'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Edit3, Search, Download, Eye, Trash2, Building2, Calendar, RefreshCw, Upload, PenTool, History, GitBranch, X, FileText, User, MapPin, Edit2 } from 'lucide-react'
import MarkupDocumentVersionModal from './MarkupDocumentVersionModal'

interface MarkupDocument {
  id: string
  title: string
  description?: string
  file_url: string
  file_name: string
  file_size?: number
  mime_type?: string
  category_type: string
  status: string
  created_at: string
  updated_at: string
  uploaded_by: string
  site_id?: string
  metadata?: {
    original_filename?: string
    markup_data?: any[]
    preview_image_url?: string
    location?: 'personal' | 'shared'
    markup_count?: number
    version_number?: number
    is_latest_version?: boolean
    change_summary?: string
    original_blueprint_url?: string
    original_blueprint_filename?: string
  }
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

export default function MarkupDocumentsManagement() {
  const [documents, setDocuments] = useState<MarkupDocument[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSite, setSelectedSite] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null)
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<MarkupDocument | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editFormData, setEditFormData] = useState<Partial<MarkupDocument>>({})
  const [isSaving, setIsSaving] = useState(false)
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
      let query = supabase
        .from('unified_document_system')
        .select(`
          *,
          profiles!unified_document_system_uploaded_by_fkey(id, full_name, email),
          sites(id, name, address)
        `, { count: 'exact' })
        .eq('category_type', 'markup')
        .eq('status', 'active')

      // 검색 필터 적용
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,original_filename.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      }

      // 현장 필터 적용
      if (selectedSite) {
        query = query.eq('site_id', selectedSite)
      }

      const from = (currentPage - 1) * itemsPerPage
      const to = from + itemsPerPage - 1

      const { data, error, count } = await query
        .order('updated_at', { ascending: false })
        .range(from, to)

      if (error) throw error

      setDocuments(data || [])
      setTotalCount(count || 0)
    } catch (error) {
      console.error('Error fetching markup documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('정말로 이 도면마킹 문서를 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('unified_document_system')
        .update({ status: 'deleted' })
        .eq('id', documentId)

      if (error) throw error

      await fetchDocuments()
      alert('도면마킹 문서가 성공적으로 삭제되었습니다.')
    } catch (error) {
      console.error('Error deleting markup document:', error)
      alert('도면마킹 문서 삭제에 실패했습니다.')
    }
  }

  const handleDownloadDocument = async (document: MarkupDocument) => {
    try {
      // 실제 구현에서는 Supabase Storage URL을 사용
      window.open(document.file_url, '_blank')
    } catch (error) {
      console.error('Error downloading document:', error)
      alert('문서 다운로드에 실패했습니다.')
    }
  }

  const handleOpenMarkupEditor = (document: MarkupDocument) => {
    // 도면마킹 에디터로 이동
    window.open(`/markup-editor?document=${document.id}`, '_blank')
  }

  const handleOpenVersionModal = (document: MarkupDocument) => {
    setSelectedDocumentId(document.id)
    setIsVersionModalOpen(true)
  }

  const handleDocumentClick = (document: MarkupDocument) => {
    setSelectedDocument(document)
    setShowDetailModal(true)
  }

  const closeDetailModal = () => {
    setShowDetailModal(false)
    setSelectedDocument(null)
    setIsEditMode(false)
    setEditFormData({})
  }

  const startEditMode = () => {
    if (selectedDocument) {
      setEditFormData({
        title: selectedDocument.title,
        description: selectedDocument.description || '',
        location: selectedDocument.metadata?.location || 'personal',
        site_id: selectedDocument.site_id
      })
      setIsEditMode(true)
    }
  }

  const cancelEditMode = () => {
    setIsEditMode(false)
    setEditFormData({})
  }

  const saveDocumentChanges = async () => {
    if (!selectedDocument || !editFormData) return

    setIsSaving(true)
    try {
      const updatedMetadata = {
        ...selectedDocument.metadata,
        location: editFormData.location
      }

      const { error } = await supabase
        .from('unified_document_system')
        .update({
          title: editFormData.title,
          description: editFormData.description,
          metadata: updatedMetadata,
          site_id: editFormData.site_id || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedDocument.id)

      if (error) throw error

      // 목록 새로고침
      await fetchDocuments()
      
      // 선택된 문서 업데이트
      const updatedDoc = { 
        ...selectedDocument, 
        ...editFormData,
        updated_at: new Date().toISOString()
      }
      setSelectedDocument(updatedDoc as MarkupDocument)
      
      setIsEditMode(false)
      setEditFormData({})
      alert('도면마킹 문서가 성공적으로 수정되었습니다.')
    } catch (error) {
      console.error('Error updating document:', error)
      alert('도면마킹 문서 수정에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleVersionRestore = () => {
    // 버전 복원 후 목록 새로고침
    fetchDocuments()
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
              placeholder="도면명, 파일명으로 검색..."
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
            onClick={() => window.open('/markup-editor', '_blank')}
            className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <PenTool className="w-4 h-4 mr-2" />
            새 도면마킹
          </button>
        </div>
      </div>

      {/* 통계 정보 */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            전체 <span className="font-medium text-gray-900">{totalCount.toLocaleString()}</span>개의 도면마킹 문서
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
            <span className="ml-2 text-gray-600">도면마킹 문서를 불러오는 중...</span>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Edit3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>도면마킹 문서가 없습니다.</p>
            {selectedSite && (
              <p className="text-sm mt-2">선택한 현장에 도면마킹 문서가 없습니다.</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    도면 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    현장
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    생성자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    마킹 수
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    버전
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    최근 수정일
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
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                          {document.metadata?.preview_image_url ? (
                            <img 
                              src={document.metadata.preview_image_url} 
                              alt="미리보기" 
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <Edit3 className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <button
                            onClick={() => handleDocumentClick(document)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline text-left"
                          >
                            {document.title}
                          </button>
                          <div className="text-sm text-gray-500 mt-1">
                            {document.metadata?.original_filename || document.file_name}
                          </div>
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
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {document.metadata?.markup_count || 0}개 마킹
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        <span className="text-sm font-medium text-gray-900">
                          v{document.metadata?.version_number || 1}
                        </span>
                        {document.metadata?.is_latest_version !== false && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            최신
                          </span>
                        )}
                      </div>
                      {document.metadata?.change_summary && (
                        <div className="text-xs text-gray-500 mt-1">
                          {document.metadata.change_summary}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(document.updated_at).toLocaleDateString('ko-KR', {
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
                          onClick={() => handleOpenMarkupEditor(document)}
                          className="text-green-600 hover:text-green-900 p-1 rounded"
                          title="도면마킹 편집"
                        >
                          <PenTool className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenVersionModal(document)}
                          className="text-purple-600 hover:text-purple-900 p-1 rounded"
                          title="버전 관리"
                        >
                          <GitBranch className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadDocument(document)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="원본 다운로드"
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

      {/* 버전 관리 모달 */}
      {selectedDocumentId && (
        <MarkupDocumentVersionModal
          documentId={selectedDocumentId}
          isOpen={isVersionModalOpen}
          onClose={() => {
            setIsVersionModalOpen(false)
            setSelectedDocumentId(null)
          }}
          onVersionRestore={handleVersionRestore}
        />
      )}

      {/* 문서 상세 정보 모달 */}
      {showDetailModal && selectedDocument && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <Edit3 className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">도면마킹 문서 상세 정보</h2>
              </div>
              <button
                onClick={closeDetailModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(90vh-8rem)]">
              <div className="px-6 py-4 space-y-6">
                {/* 문서 정보 */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">문서 정보</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-start space-x-3">
                      <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        {isEditMode ? (
                          <div className="space-y-2">
                            <div>
                              <label className="text-xs text-gray-500">제목</label>
                              <input
                                type="text"
                                value={editFormData.title || ''}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                                className="w-full text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded px-2 py-1 mt-1"
                                placeholder="문서 제목을 입력하세요"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500">설명</label>
                              <textarea
                                value={editFormData.description || ''}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                                className="w-full text-sm text-gray-700 bg-white border border-gray-300 rounded px-2 py-1 mt-1 resize-none"
                                rows={2}
                                placeholder="문서 설명을 입력하세요"
                              />
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm font-medium text-gray-900">{selectedDocument.title}</p>
                            {selectedDocument.description && (
                              <p className="text-sm text-gray-500 mt-1">{selectedDocument.description}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200">
                      <div>
                        <p className="text-xs text-gray-500">원본 파일명</p>
                        <p className="text-sm text-gray-900 mt-1">{selectedDocument.original_filename}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">마킹 개수</p>
                        <p className="text-sm text-gray-900 mt-1">{selectedDocument.metadata?.markup_count || 0}개</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">버전</p>
                        <p className="text-sm text-gray-900 mt-1">v{selectedDocument.metadata?.version_number || 1}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">위치</p>
                        {isEditMode ? (
                          <select
                            value={editFormData.location || 'personal'}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, location: e.target.value as 'personal' | 'shared' }))}
                            className="w-full text-sm text-gray-900 bg-white border border-gray-300 rounded px-2 py-1 mt-1"
                          >
                            <option value="personal">개인 문서</option>
                            <option value="shared">공유 문서</option>
                          </select>
                        ) : (
                          <p className="text-sm text-gray-900 mt-1">
                            {selectedDocument.metadata?.location === 'shared' ? '공유 문서' : '개인 문서'}
                          </p>
                        )}
                      </div>
                    </div>
                    {isEditMode && (
                      <div className="pt-3 border-t border-gray-200">
                        <label className="text-xs text-gray-500">현장 선택</label>
                        <select
                          value={editFormData.site_id || ''}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, site_id: e.target.value || null }))}
                          className="w-full text-sm text-gray-900 bg-white border border-gray-300 rounded px-2 py-1 mt-1"
                        >
                          <option value="">현장 선택 안함</option>
                          {sites.map((site) => (
                            <option key={site.id} value={site.id}>
                              {site.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* 작성자 정보 */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">작성자 정보</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedDocument.profiles?.full_name || '알 수 없음'}
                        </p>
                        <p className="text-sm text-gray-500">{selectedDocument.profiles?.email}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200">
                      <div>
                        <p className="text-xs text-gray-500">생성일</p>
                        <p className="text-sm text-gray-900 mt-1">
                          {new Date(selectedDocument.created_at).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">수정일</p>
                        <p className="text-sm text-gray-900 mt-1">
                          {new Date(selectedDocument.updated_at).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 현장 정보 */}
                {selectedDocument.sites && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">현장 정보</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex items-start space-x-3">
                        <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{selectedDocument.sites.name}</p>
                          <p className="text-sm text-gray-500 mt-1">{selectedDocument.sites.address}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 변경 요약 */}
                {selectedDocument.metadata?.change_summary && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">변경 내역</h3>
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700">{selectedDocument.metadata.change_summary}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              {isEditMode ? (
                <>
                  <button
                    onClick={cancelEditMode}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center space-x-2"
                  >
                    <X className="h-4 w-4" />
                    <span>취소</span>
                  </button>
                  <button
                    onClick={saveDocumentChanges}
                    disabled={isSaving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isSaving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                    <span>{isSaving ? '저장 중...' : '저장'}</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleOpenMarkupEditor(selectedDocument)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span>열기</span>
                  </button>
                  <button
                    onClick={() => handleOpenVersionModal(selectedDocument)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2"
                  >
                    <GitBranch className="h-4 w-4" />
                    <span>버전 관리</span>
                  </button>
                  <button
                    onClick={() => handleDownloadDocument(selectedDocument)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>다운로드</span>
                  </button>
                  <button
                    onClick={startEditMode}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center space-x-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    <span>수정</span>
                  </button>
                  <button
                    onClick={() => {
                      if(confirm('이 문서를 삭제하시겠습니까?')) {
                        handleDeleteDocument(selectedDocument.id)
                        closeDetailModal()
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>삭제</span>
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