'use client'

import { useState, useEffect } from 'react'
import { FileCheck, Search, Download, Eye, Trash2, User, Calendar, RefreshCw, AlertCircle, CheckCircle, XCircle, Clock, Filter } from 'lucide-react'

interface RequiredDocument {
  id: string
  title: string
  description?: string
  document_type: string
  file_name: string
  file_size: number
  status: 'pending' | 'approved' | 'rejected'
  submission_date: string
  submitted_by: {
    id: string
    full_name: string
    email: string
    role: string
  }
  organization_name?: string
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

export default function RealRequiredDocumentsManagement() {
  const [documents, setDocuments] = useState<RequiredDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  useEffect(() => {
    console.log('RealRequiredDocumentsManagement - Component mounted')
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      console.log('RealRequiredDocumentsManagement - Fetching documents...')
      
      const response = await fetch('/api/admin/documents/required', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      console.log('RealRequiredDocumentsManagement - Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('RealRequiredDocumentsManagement - API response:', data)
        console.log('RealRequiredDocumentsManagement - Documents count:', data.documents?.length || 0)
        setDocuments(data.documents || [])
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to fetch required documents:', response.status, errorData)
      }
    } catch (error) {
      console.error('Error fetching required documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (document: RequiredDocument) => {
    try {
      // This would need to be implemented to get the signed URL for download
      alert(`다운로드 기능은 추후 구현 예정입니다: ${document.file_name}`)
    } catch (error) {
      alert('다운로드 중 오류가 발생했습니다.')
    }
  }

  const handleDelete = async (document: RequiredDocument) => {
    if (!confirm(`${document.title}을(를) 삭제하시겠습니까?`)) return

    try {
      // This would need to be implemented
      alert('삭제 기능은 추후 구현 예정입니다.')
    } catch (error) {
      alert('삭제 중 오류가 발생했습니다.')
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
    const matchesType = typeFilter === 'all' || doc.document_type === typeFilter
    
    return matchesSearch && matchesStatus && matchesType
  })

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
        <div className="flex items-center gap-2">
          <FileCheck className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">필수 제출 서류함</h2>
          <span className="px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
            {filteredDocuments.length}건
          </span>
        </div>
        <button
          onClick={fetchDocuments}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          새로고침
        </button>
      </div>

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

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">모든 문서 유형</option>
            {Object.entries(DOCUMENT_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 문서 목록 */}
      {filteredDocuments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">제출된 필수 서류가 없습니다</h3>
          <p className="text-gray-600">사용자들이 업로드한 필수 서류가 여기에 표시됩니다.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    문서 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    제출자
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
                {filteredDocuments.map((document) => (
                  <tr key={document.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{document.title}</div>
                        <div className="text-sm text-gray-500">
                          {DOCUMENT_TYPE_LABELS[document.document_type as keyof typeof DOCUMENT_TYPE_LABELS] || document.document_type}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {document.file_name} ({formatFileSize(document.file_size)})
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{document.submitted_by.full_name}</div>
                          <div className="text-sm text-gray-500">{document.organization_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(document.status)}
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
                          onClick={() => handleDownload(document)}
                          className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors"
                          title="다운로드"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(document)}
                          className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors"
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
        </div>
      )}
    </div>
  )
}