'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileText, Search, Download, Eye, Trash2, Building2, Users, Calendar, RefreshCw, Upload, DollarSign, Clock } from 'lucide-react'
import InvoiceDocumentUploadModal from './InvoiceDocumentUploadModal'
import InvoiceDocumentDetailModal from './InvoiceDocumentDetailModal'

interface InvoiceDocument {
  id: string
  title: string
  description?: string
  document_type: string
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
  contract_phase: 'pre_contract' | 'in_progress' | 'completed'
  amount?: number
  created_at: string
  updated_at: string
  created_by: string
  site_id?: string
  partner_company_id?: string
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
  organizations?: {
    id: string
    name: string
    business_registration_number: string
  }
}

interface Site {
  id: string
  name: string
  address: string
}

// 기성청구 문서 유형
const documentTypes = [
  { value: 'contract', label: '계약서' },
  { value: 'work_order', label: '작업지시서' },
  { value: 'progress_report', label: '진행보고서' },
  { value: 'invoice', label: '청구서' },
  { value: 'completion_report', label: '완료보고서' },
  { value: 'payment_request', label: '대금청구서' },
  { value: 'tax_invoice', label: '세금계산서' },
  { value: 'other', label: '기타 서류' }
]

// 계약 단계
const contractPhases = [
  { value: 'pre_contract', label: '계약 전' },
  { value: 'in_progress', label: '진행 중' },
  { value: 'completed', label: '완료' }
]

export default function InvoiceDocumentsManagement() {
  const [documents, setDocuments] = useState<InvoiceDocument[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSite, setSelectedSite] = useState<string>('')
  const [phaseFilter, setPhaseFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const itemsPerPage = 20

  // Modal states
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<InvoiceDocument | null>(null)
  const [userRole, setUserRole] = useState<string>('')

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
        .from('documents')
        .select(`
          *,
          profiles!documents_created_by_fkey(id, full_name, email),
          sites(id, name, address),
          organizations!documents_partner_company_id_fkey(id, name, business_registration_number)
        `, { count: 'exact' })
        .eq('document_category', 'invoice')

      // 검색 필터 적용
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,file_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      }

      // 현장 필터 적용
      if (selectedSite) {
        query = query.eq('site_id', selectedSite)
      }

      // 계약 단계 필터 적용
      if (phaseFilter) {
        query = query.eq('contract_phase', phaseFilter)
      }

      // 문서 유형 필터 적용
      if (typeFilter) {
        query = query.eq('document_type', typeFilter)
      }

      const from = (currentPage - 1) * itemsPerPage
      const to = from + itemsPerPage - 1

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw error

      setDocuments(data || [])
      setTotalCount(count || 0)
    } catch (error) {
      console.error('Error fetching invoice documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('정말로 이 기성청구 서류를 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId)

      if (error) throw error

      await fetchDocuments()
      alert('기성청구 서류가 성공적으로 삭제되었습니다.')
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('서류 삭제에 실패했습니다.')
    }
  }

  const handleDownloadDocument = async (document: InvoiceDocument) => {
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

  const getDocumentTypeLabel = (type: string) => {
    const docType = documentTypes.find(t => t.value === type)
    return docType ? docType.label : type
  }

  const getPhaseLabel = (phase: string) => {
    const phaseInfo = contractPhases.find(p => p.value === phase)
    return phaseInfo ? phaseInfo.label : phase
  }

  const getPhaseBadge = (phase: string) => {
    switch (phase) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            완료
          </span>
        )
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            진행중
          </span>
        )
      case 'pre_contract':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            계약전
          </span>
        )
    }
  }

  // Fetch user role
  const fetchUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          setUserRole(profile.role)
        }
      }
    } catch (error) {
      console.error('Error fetching user role:', error)
    }
  }

  const handleShowDetail = (document: InvoiceDocument) => {
    setSelectedDocument(document)
    setShowDetailModal(true)
  }

  const handleCloseDetail = () => {
    setShowDetailModal(false)
    setSelectedDocument(null)
  }

  const handleUploadSuccess = () => {
    setShowUploadModal(false)
    fetchDocuments()
  }

  const handleUpdateSuccess = () => {
    fetchDocuments()
  }

  useEffect(() => {
    fetchSites()
    fetchUserRole()
  }, [])

  useEffect(() => {
    fetchDocuments()
  }, [currentPage, searchTerm, selectedSite, phaseFilter, typeFilter])

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  return (
    <div className="space-y-6">
      {/* 검색 및 필터 섹션 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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

          <select
            className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white appearance-none"
            value={phaseFilter}
            onChange={(e) => {
              setPhaseFilter(e.target.value)
              setCurrentPage(1)
            }}
          >
            <option value="">모든 단계</option>
            {contractPhases.map((phase) => (
              <option key={phase.value} value={phase.value}>
                {phase.label}
              </option>
            ))}
          </select>

          <select
            className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white appearance-none"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value)
              setCurrentPage(1)
            }}
          >
            <option value="">모든 문서 유형</option>
            {documentTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          
          <button
            onClick={fetchDocuments}
            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            새로고침
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Upload className="w-4 h-4 mr-2" />
            서류 등록
          </button>
        </div>
      </div>

      {/* 통계 정보 */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            전체 <span className="font-medium text-gray-900">{totalCount.toLocaleString()}</span>개의 기성청구 서류
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

      {/* 서류 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">기성청구 서류를 불러오는 중...</span>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>기성청구 서류가 없습니다.</p>
            {selectedSite && (
              <p className="text-sm mt-2">선택한 현장에 기성청구 서류가 없습니다.</p>
            )}
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
                    현장 / 파트너사
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    문서 유형
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    계약 단계
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    금액
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    등록일
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
                        <DollarSign className="w-5 h-5 text-green-500 mr-3 mt-1" />
                        <div>
                          <button
                            onClick={() => handleShowDetail(document)}
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
                        {document.sites?.name || '미지정'}
                      </div>
                      {document.organizations && (
                        <div className="text-sm text-gray-500 mt-1">
                          {document.organizations.name}
                        </div>
                      )}
                      {document.sites?.address && (
                        <div className="text-xs text-gray-400">
                          {document.sites.address}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {getDocumentTypeLabel(document.document_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPhaseBadge(document.contract_phase)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {document.amount ? 
                        `₩${document.amount.toLocaleString()}` : 
                        '-'
                      }
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
                          onClick={() => handleShowDetail(document)}
                          className="text-green-600 hover:text-green-900 p-1 rounded"
                          title="상세보기"
                        >
                          <Eye className="w-4 h-4" />
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

      {/* Upload Modal */}
      <InvoiceDocumentUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleUploadSuccess}
        sites={sites}
      />

      {/* Detail Modal */}
      <InvoiceDocumentDetailModal
        document={selectedDocument}
        isOpen={showDetailModal}
        onClose={handleCloseDetail}
        onUpdate={handleUpdateSuccess}
        userRole={userRole}
      />
    </div>
  )
}